import { customAlphabet, nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { CreateLinkInput } from "./links.schema.js";
import { db } from "../../db/index.js";
import { links } from "../../db/schema.js";

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

export async function getLink(slug: string) {
  const [link] = await db.select().from(links).where(eq(links.slug, slug));

  return link ?? null;
}
