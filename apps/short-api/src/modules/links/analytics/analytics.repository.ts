import { sql } from "drizzle-orm";
import { clicks } from "../../../db/schema.js";
import { db } from "../../../db/index.js";
import type { Metric } from "./analytics.types.js";

export async function getMetricsByLinkId(linkId: number): Promise<Metric[]> {
  // GROUPING SETS computes 4 aggregations in a single query, avoiding multiple DB round-trips
  return db.execute(sql`
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
}

export async function trackClick(click: {
  linkId: number;
  country: string | null;
  referrer: string | null;
  device: string | null;
}) {
  return db.insert(clicks).values(click);
}
