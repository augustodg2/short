import { jwtVerify, SignJWT } from "jose";
import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { RefreshToken, User } from "../../db/entities.js";
import { logger } from "../../lib/logger.js";
import { Tokens } from "./auth.types.js";
import { InvalidAccessTokenError } from "./errors/InvalidAccessTokenError.js";
import { InvalidRefreshTokenError } from "./errors/InvalidRefreshTokenError.js";
import * as refreshTokensRepository from "./refresh-tokens.repository.js";

const accessTokenSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshTokenSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function generateAccessToken(
  user: Pick<User, "id" | "email">,
): Promise<string> {
  return new SignJWT({
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
}

async function generateRefreshToken(
  user: Pick<User, "id">,
): Promise<{ refreshToken: string; expiration: Date }> {
  const expiration = new Date(
    Date.now() + env.JWT_REFRESH_EXPIRY_SECONDS * 1000,
  );

  const refreshToken = await new SignJWT({
    type: "refresh",
    sub: String(user.id),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(refreshTokenSecret);

  return { refreshToken, expiration };
}

export async function generateTokens(
  user: Pick<User, "id" | "email">,
): Promise<Tokens> {
  const accessToken = await generateAccessToken(user);

  const { refreshToken, expiration: refreshTokenExpiration } =
    await generateRefreshToken(user);

  await refreshTokensRepository.save(
    hash(refreshToken),
    user.id,
    refreshTokenExpiration,
  );

  return {
    accessToken,
    refreshToken,
  };
}

export async function validateAccessToken(
  token: string | undefined,
): Promise<Pick<User, "id" | "email">> {
  if (!token?.startsWith("Bearer ")) {
    logger.error(
      "Invalid access token. It doesn't start with 'Bearer ' prefix.",
    );

    throw new InvalidAccessTokenError();
  }

  try {
    const result = await jwtVerify(token.slice(7), accessTokenSecret);

    return {
      id: Number(result.payload.sub),
      email: String(result.payload.email),
    };
  } catch (err) {
    logger.error({ err }, "Invalid access token.");

    throw new InvalidAccessTokenError(undefined, { cause: err });
  }
}

async function validateRefreshToken(token: string): Promise<
  RefreshToken & {
    user: Pick<User, "id" | "email">;
  }
> {
  try {
    await jwtVerify(token, refreshTokenSecret);
  } catch (err) {
    logger.error({ err }, "Refresh token is invalid.");

    throw new InvalidRefreshTokenError(undefined, { cause: err });
  }

  const refreshToken = await refreshTokensRepository.getByTokenHash(
    hash(token),
  );

  if (!refreshToken) {
    logger.error("Refresh token is valid, but is not stored in DB.");

    throw new InvalidRefreshTokenError();
  }

  return refreshToken;
}

export async function rotateTokens(refreshToken: string): Promise<Tokens> {
  const tokenRecord = await validateRefreshToken(refreshToken);

  if (tokenRecord.revokedAt) {
    logger.error(
      "Tried to use already revoked refreshToken, will delete all tokens from user.",
    );

    await refreshTokensRepository.deleteAllFromUser(tokenRecord.userId);

    throw new InvalidRefreshTokenError();
  }

  await refreshTokensRepository.revoke(hash(refreshToken));

  return generateTokens(tokenRecord.user);
}

export async function deleteRefreshToken(refreshToken: string): Promise<void> {
  await refreshTokensRepository.deleteToken(hash(refreshToken));
}
