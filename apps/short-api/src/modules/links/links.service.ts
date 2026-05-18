import { customAlphabet } from "nanoid";
import { Link } from "../../db/entities.js";
import { logger } from "../../lib/logger.js";
import { ExpiredLinkError } from "./errors/ExpiredLinkError.js";
import * as linkRepository from "./links.repository.js";
import { CreateLinkInput } from "./links.schema.js";
import { ZodError } from "zod";
import { MalformedCachedLinkError } from "./errors/MalformedCachedLinkError.js";

const generateSlug = customAlphabet(
  // Excludes: 0, O, o, l, 1, I (ambiguous characters)
  "123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ",
  8,
);

export async function createLink({ url, expiresAt }: CreateLinkInput) {
  return linkRepository.create({
    slug: generateSlug(),
    url,
    expiresAt,
  });
}

async function getBySlug(
  slug: string,
  options: { useCache?: boolean } = { useCache: true },
): Promise<Link | null> {
  if (options?.useCache) {
    try {
      const cached = await linkRepository.getBySlugFromCache(slug);

      if (cached) {
        logger.debug({ slug }, "cache hit");

        return cached;
      }
    } catch (err) {
      if (err instanceof MalformedCachedLinkError) {
        await linkRepository.deleteFromCache(slug);
      }

      logger.warn({ err }, "Redis error, falling back to DB.");
    }
  }

  logger.debug({ slug }, "cache miss");

  return linkRepository.getBySlugFromDb(slug);
}

export async function resolveLink(
  slug: string,
  options: { useCache?: boolean } = { useCache: true },
): Promise<{ id: number; url: string } | null> {
  const link = await getBySlug(slug, options);

  if (!link) {
    return null;
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new ExpiredLinkError();
  }

  await linkRepository.writeToCache(link);

  return { id: link.id, url: link.url };
}

export async function getLinkById(linkId: number) {
  return linkRepository.getById(linkId);
}
