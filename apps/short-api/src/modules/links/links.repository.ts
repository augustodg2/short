import { eq } from "drizzle-orm";
import { redis } from "../../cache/index.js";
import { db } from "../../db/index.js";
import { links } from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";

export async function create({
  slug,
  url,
  expiresAt,
}: {
  slug: string;
  url: string;
  expiresAt: Date | null;
}) {
  const [link] = await db
    .insert(links)
    .values({
      slug,
      url,
      expiresAt,
    })
    .returning();

  return link;
}

function getCacheKey(slug: string) {
  return `short:slug:${slug}`;
}

async function getFromCache(slug: string) {
  const cached = await redis.get(getCacheKey(slug));

  if (!cached) {
    return null;
  }

  const parsed = JSON.parse(cached);

  return {
    id: parsed.id,
    url: parsed.url,
    expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
    slug,
  };
}

export async function getBySlug(
  slug: string,
  options: { useCache?: boolean } = { useCache: true },
) {
  if (options?.useCache) {
    try {
      const cached = await getFromCache(slug);

      if (cached) {
        logger.debug({ slug }, "cache hit");

        return cached;
      }
    } catch (err) {
      logger.warn({ err }, "Redis error, falling back to DB.");
    }
  }

  logger.debug({ slug }, "cache miss");

  const [link] = await db.select().from(links).where(eq(links.slug, slug));

  return link;
}

export async function writeToCache(link: {
  id: number;
  slug: string;
  url: string;
  expiresAt: Date | null;
}) {
  return redis.setex(
    getCacheKey(link.slug),
    env.LINK_CACHE_TTL_SECONDS,
    JSON.stringify({ id: link.id, url: link.url, expiresAt: link.expiresAt }),
  );
}

export async function getById(id: number) {
  return db.query.links.findFirst({ where: eq(links.id, id) });
}
