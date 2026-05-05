import { customAlphabet, nanoid } from "nanoid";
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
