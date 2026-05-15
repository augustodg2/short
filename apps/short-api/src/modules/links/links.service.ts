import { customAlphabet } from "nanoid";
import { eq, sql } from "drizzle-orm";
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

async function getLinkBySlug(
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

  const link = await getLinkBySlug(slug, options);

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

export async function getLinkById(linkId: number) {
  return db.query.links.findFirst({ where: eq(links.id, linkId) });
}

type AggregateMetric = {
  value: string;
  count: number;
};

type LinkAnalytics = {
  totalClicks: number;
  clicksByCountry: AggregateMetric[];
  clicksByReferer: AggregateMetric[];
  clicksByDevice: AggregateMetric[];
};

export async function getLinkAnalytics(linkId: number): Promise<LinkAnalytics> {
  // GROUPING SETS computes 4 aggregations in a single query, avoiding multiple DB round-trips
  const result: {
    type: "total" | "country" | "device" | "referrer";
    category: string | null;
    count: number;
  }[] = await db.execute(sql`
    WITH filtered AS (
        SELECT id, country, device, referrer
        FROM ${clicks}
        WHERE ${clicks.linkId} = ${linkId}
    )
    SELECT
        CASE
            WHEN GROUPING(country) = 1 AND GROUPING(device) = 1 AND GROUPING(referrer) = 1 THEN 'total'
            WHEN GROUPING(device) = 1 AND GROUPING(referrer) = 1 THEN 'country'
            WHEN GROUPING(referrer) = 1 THEN 'device'
            ELSE 'referrer'
        END AS type,
        COALESCE(country, device, referrer) AS category,
        CAST(COUNT(id) AS INTEGER) AS count
    FROM filtered
    GROUP BY
        GROUPING SETS (
            (),
            (country),
            (device),
            (referrer)
        )
  `);

  const aggregate = (type: "country" | "referrer" | "device") =>
    result
      .filter((metric) => metric.type === type)
      .map((metric) => ({
        value: metric.category ?? "unknown",
        count: metric.count,
      }))
      .sort((a, b) => b.count - a.count);

  const response = {
    totalClicks: result.find((metric) => metric.type === "total")?.count ?? 0,
    clicksByCountry: aggregate("country"),
    clicksByReferer: aggregate("referrer"),
    clicksByDevice: aggregate("device"),
  };

  return response;
}
