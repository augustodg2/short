import { customAlphabet, nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { CreateLinkInput } from "./links.schema.js";
import { db } from "../../db/index.js";
import { clicks, links } from "../../db/schema.js";
import { redis } from "../../cache/index.js";
import { env } from "../../config/env.js";
import { ExpiredLinkError } from "./errors/ExpiredLinkError.js";
import { UAParser } from "ua-parser-js";

const generateSlug = customAlphabet(
  // Excludes: 0, O, o, l, 1, I (ambiguous characters)
  "123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ",
  8,
);

export async function createLink(input: CreateLinkInput) {
  const slug = generateSlug();

  const [link] = await db
    .insert(links)
    .values({
      slug,
      url: input.url,
      expiresAt: input.expiresAt,
    })
    .returning();

  return link;
}

async function getLink(
  slug: string,
  options: { useCache?: boolean } = { useCache: true },
): Promise<{
  id: number;
  url: string;
  expiresAt: Date | null;
}> {
  const cacheKey = `short:slug:${slug}`;

  if (options?.useCache) {
    try {
      const cached = await redis.get(cacheKey);

      if (cached) {
        console.debug({ slug, cache: "hit" });

        const parsed = JSON.parse(cached);

        return {
          id: parsed.id,
          url: parsed.url,
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        };
      }
    } catch (error) {
      console.warn("Redis error, falling back to DB.", error);
    }
  }

  console.debug({ slug, cache: "miss" });

  const [link] = await db.select().from(links).where(eq(links.slug, slug));

  return link;
}

export async function resolveLink(
  slug: string,
  options: { useCache?: boolean } = { useCache: true },
): Promise<{ id: number; url: string } | null> {
  const cacheKey = `short:slug:${slug}`;

  const link = await getLink(slug, options);

  if (!link) {
    return null;
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new ExpiredLinkError();
  }

  await redis.setex(
    cacheKey,
    env.LINK_CACHE_TTL_SECONDS,
    JSON.stringify({ id: link.id, url: link.url, expiresAt: link.expiresAt }),
  );

  return { id: link.id, url: link.url };
}

export async function trackClick({
  linkId,
  userAgent,
  country,
  referrer,
}: {
  linkId: number;
  userAgent: string | null;
  country: string | null;
  referrer: string | null;
}) {
  let device: string | null = null;

  if (userAgent) {
    device = UAParser(userAgent).device.type ?? null;
  }

  await db.insert(clicks).values({
    linkId,
    country,
    referrer,
    device,
  });
}
