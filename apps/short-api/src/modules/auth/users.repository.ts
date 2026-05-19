import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { User } from "../../db/entities.js";

export async function getByEmail(email: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  return result ?? null;
}

export async function create({
  email,
  passwordHash,
}: {
  email: string;
  passwordHash: string;
}): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
    })
    .returning();

  return user;
}
