import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { refreshTokens } from "../../db/schema.js";
import { RefreshToken } from "../../db/entities.js";

export async function deleteAllFromUser(userId: number): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

export async function deleteToken(tokenHash: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revoke(tokenHash: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function save(
  tokenHash: string,
  userId: number,
  expiresAt: Date,
): Promise<void> {
  await db.insert(refreshTokens).values({
    userId,
    expiresAt,
    tokenHash,
  });
}

export async function getByTokenHash(
  tokenHash: string,
): Promise<RefreshToken | null> {
  const result = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
    with: { user: { columns: { id: true, email: true } } },
  });

  return result ?? null;
}
