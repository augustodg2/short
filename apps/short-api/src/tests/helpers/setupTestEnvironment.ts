import { afterAll, beforeEach, beforeAll } from "vitest";
import { buildApp } from "../../app.js";
import { db } from "../../db/index.js";
import { FastifyInstance } from "fastify";
import { clicks, links, refreshTokens, users } from "../../db/schema.js";

export function setupTestEnvironment() {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(async () => {
    await db.delete(clicks);
    await db.delete(refreshTokens);
    await db.delete(links);
    await db.delete(users);
  });

  afterAll(async () => {
    await app.close();
  });

  return { getApp: () => app };
}
