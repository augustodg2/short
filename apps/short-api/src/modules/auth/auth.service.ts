import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { refreshTokens, users } from "../../db/schema.js";
import { LoginInput, RegisterUserInput } from "./auth.schema.js";
import { EmailAlreadyInUseError } from "./errors/EmailAlreadyInUseError.js";
import { InvalidCredentialsError } from "./errors/InvalidCredentialsError.js";
import { InvalidTokenError } from "./errors/InvalidTokenError.js";
import { createHash } from "node:crypto";

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
    type: "access",
    sub: String(user.id),
    email: user.email,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(
      new Date(Date.now() + env.JWT_ACCESS_EXPIRY_SECONDS * 1000),
    )
    .sign(accessTokenSecret);

  const refreshTokenExpiration = new Date(
    Date.now() + env.JWT_REFRESH_EXPIRY_SECONDS * 1000,
  );

  const refreshToken = await new SignJWT({
    type: "refresh",
    sub: String(user.id),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(refreshTokenExpiration)
    .sign(refreshTokenSecret);

  await persistAccessToken(accessToken, user.id, refreshTokenExpiration);

  return {
    accessToken,
    refreshToken,
  };
}

function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function persistAccessToken(
  token: string,
  userId: number,
  expiresAt: Date,
) {
  await db.insert(refreshTokens).values({
    userId,
    expiresAt,
    tokenHash: hashAccessToken(token),
  });
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

export async function login(input: LoginInput): Promise<Tokens> {
  const user = await getUserByEmail(input.email);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatch = await argon2.verify(user.passwordHash, input.password);

  if (!passwordMatch) {
    throw new InvalidCredentialsError();
  }

  return generateTokens(user);
}

export async function validateAccessToken(
  token: string | undefined,
): Promise<{ id: number; email: string }> {
  if (!token?.startsWith("Bearer ")) {
    throw new InvalidTokenError();
  }

  try {
    const result = await jwtVerify(token.slice(7), accessTokenSecret);

    return {
      id: Number(result.payload.sub),
      email: String(result.payload.email),
    };
  } catch (error) {
    throw new InvalidTokenError();
  }
}
