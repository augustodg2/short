import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { RegisterUserInput } from "./auth.schema.js";
import { EmailAlreadyInUseError } from "./errors/EmailAlreadyInUseError.js";

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export async function createUser(input: {
  email: string;
  password: string;
}): Promise<{ id: number; email: string; createdAt: Date }> {
  const passwordHash = await argon2.hash(input.password);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

const accessTokenSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshTokenSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function generateTokens(user: {
  id: number;
  email: string;
}): Promise<Tokens> {
  const accessToken = await new SignJWT({
    id: user.id,
    email: user.email,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY_SECONDS)
    .sign(accessTokenSecret);

  const refreshToken = await new SignJWT({
    id: user.id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY_SECONDS)
    .sign(refreshTokenSecret);

  return {
    accessToken,
    refreshToken,
  };
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function registerUser(input: RegisterUserInput): Promise<Tokens> {
  const existingUser = await getUserByEmail(input.email);

  if (existingUser) {
    throw new EmailAlreadyInUseError();
  }

  const user = await createUser(input);

  return generateTokens(user);
}
