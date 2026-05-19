import { eq } from "drizzle-orm";
import { redis } from "../../cache/index.js";
import { env } from "../../config/env.js";
import { Link } from "../../db/entities.js";
import { db } from "../../db/index.js";
import { links } from "../../db/schema.js";
import { MalformedCachedLinkError } from "./errors/MalformedCachedLinkError.js";
import { linkSchema } from "./links.schema.js";

export async function create(
  linkValues: Pick<Link, "slug" | "url" | "expiresAt" | "userId">,
): Promise<Link> {
  const [link] = await db.insert(links).values(linkValues).returning();

  return link;
}

function getCacheKey(slug: string): string {
  return `short:slug:${slug}`;
}

export async function getBySlugFromCache(slug: string): Promise<Link | null> {
  const cached = await redis.get(getCacheKey(slug));

  if (!cached) {
    return null;
  }

  try {
    return linkSchema.parse(JSON.parse(cached));
  } catch (err) {
    throw new MalformedCachedLinkError(undefined, cached, {
      cause: err,
    });
  }
}

export async function getBySlugFromDb(slug: string): Promise<Link | null> {
  const link = await db.query.links.findFirst({
    where: eq(links.slug, slug),
  });

  return link ?? null;
}

export async function writeToCache(link: Link): Promise<void> {
  await redis.setex(
    getCacheKey(link.slug),
    env.LINK_CACHE_TTL_SECONDS,
    JSON.stringify(link),
  );
}

export async function getById(id: number): Promise<Link | null> {
  const link = await db.query.links.findFirst({ where: eq(links.id, id) });

  return link ?? null;
}
export async function deleteFromCache(slug: string) {
  await redis.del(getCacheKey(slug));
}
