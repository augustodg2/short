import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { clicks } from "../../db/schema.js";

export async function insertClick(
  linkId: number,
  overrides: Partial<typeof clicks.$inferInsert> = {},
) {
  const [click] = await db
    .insert(clicks)
    .values({
      linkId,
      country: null,
      referrer: null,
      device: null,
      ...overrides,
    })
    .returning();

  return click;
}

export async function getLinkClicks(linkId: number) {
  return db.query.clicks.findMany({
    where: eq(clicks.linkId, linkId),
  });
}
