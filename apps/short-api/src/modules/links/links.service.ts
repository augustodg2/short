import { customAlphabet, nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { CreateLinkInput } from "./links.schema.js";
import { db } from "../../db/index.js";
import { links } from "../../db/schema.js";
import { redis } from "../../cache/index.js";
import { env } from "../../config/env.js";

const generateSlug = customAlphabet(
  // Excludes: 0, O, o, l, 1, I (ambiguous characters)
  "123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ",
  8,
);

export async function createLink(input: CreateLinkInput) {
  const id = nanoid();
  const slug = generateSlug();

  const [link] = await db
    .insert(links)
    .values({
      id,
      slug,
      url: input.url,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();

  return link;
}

export async function resolveLink(
  slug: string,
  options: { useCache?: boolean } = { useCache: true },
): Promise<{ url: string } | null> {
  const cacheKey = `short:slug:${slug}`;

  if (options?.useCache) {
    try {
      const cached = await redis.get(cacheKey);

      if (cached) {
        console.debug({ slug, cache: "hit" });

        const parsed = JSON.parse(cached);

        return { url: parsed.url };
      }
    } catch (error) {
      console.warn("Redis error, falling back to DB.", error);
    }
  }

  console.debug({ slug, cache: "miss" });

  const [link] = await db.select().from(links).where(eq(links.slug, slug));

  if (!link) {
    return null;
  }

  await redis.setex(
    cacheKey,
    env.CACHE_TTL_SECONDS,
    JSON.stringify({ url: link.url }),
  );

  return { url: link.url };
}
