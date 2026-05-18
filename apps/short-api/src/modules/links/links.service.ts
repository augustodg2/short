import { customAlphabet } from "nanoid";
import { ExpiredLinkError } from "./errors/ExpiredLinkError.js";
import { CreateLinkInput } from "./links.schema.js";

import * as linkRepository from "./links.repository.js";

const generateSlug = customAlphabet(
  // Excludes: 0, O, o, l, 1, I (ambiguous characters)
  "123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ",
  8,
);

export async function createLink({ url, expiresAt }: CreateLinkInput) {
  const slug = generateSlug();

  return linkRepository.create({
    slug,
    url,
    expiresAt,
  });
}

export async function resolveLink(
  slug: string,
  options: { useCache?: boolean } = { useCache: true },
): Promise<{ id: number; url: string } | null> {
  const link = await linkRepository.getBySlug(slug, options);

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
