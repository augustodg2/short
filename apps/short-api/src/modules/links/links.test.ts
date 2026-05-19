import { FastifyInstance } from "fastify";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createUserAndLogin } from "../../tests/helpers/auth.js";
import { createLink } from "../../tests/helpers/links.js";
import { setupTestEnvironment } from "../../tests/helpers/setupTestEnvironment.js";
import { db } from "../../db/index.js";
import { eq } from "drizzle-orm";
import { getLinkClicks } from "../../tests/helpers/analytics.js";

const { getApp } = setupTestEnvironment();

describe("POST /links", () => {
  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(() => {
    app = getApp();
  });

  beforeEach(async () => {
    ({ accessToken } = await createUserAndLogin());
  });

  test("should create link and return slug", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com" },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(201);

    const responseBody = response.json();

    expect(responseBody).toHaveProperty("slug", expect.any(String));
    expect(responseBody).toHaveProperty("url", "https://example.com");
  });

  test("should allow unauthorized users to create link", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com" },
    });

    expect(response.statusCode).toBe(201);
  });

  test("should return 400 for invalid URL", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "invalid url" },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("message", "Invalid URL");
  });

  test("should return 400 for expiry date in the past", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const today = new Date(2026, 4, 6);
    const yesterday = new Date(2026, 4, 5);

    vi.setSystemTime(today);

    const response = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com", expiresAt: yesterday.toISOString() },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty(
      "message",
      "Expiration date should be in the future",
    );

    vi.useRealTimers();
  });
});

describe("GET /links/:slug/resolve", () => {
  let app: FastifyInstance;

  beforeAll(() => {
    app = getApp();
  });

  test("should return resolved url", async () => {
    const { slug } = await createLink();

    const res = await app.inject({
      method: "GET",
      url: `/links/${slug}/resolve`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("url", "https://example.com");
  });

  test("should track click to link when resolving", async () => {
    const { slug, id: linkId } = await createLink();

    let clicks = await getLinkClicks(linkId);

    expect(clicks.length).toBe(0);

    await app.inject({
      method: "GET",
      url: `/links/${slug}/resolve`,
      headers: {
        "x-country": "BR",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
        referer: "https://example.com",
      },
    });

    await vi.waitFor(async () => {
      clicks = await getLinkClicks(linkId);

      expect(clicks.length).toBe(1);
    });

    expect(clicks[0].country).toBe("BR");
    expect(clicks[0].device).toBe("mobile");
    expect(clicks[0].referrer).toBe("https://example.com");
  });

  test("should return 404 for non-existing slug", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/links/non-existing-slug/resolve`,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty("message", "Link not found");
  });

  test("should return 410 for expired link", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const yesterday = new Date(2026, 4, 5);
    const today = new Date(2026, 4, 6);

    vi.setSystemTime(today);

    const link = await createLink(null, {
      expiresAt: yesterday,
    });

    const res = await app.inject({
      method: "GET",
      url: `/links/${link.slug}/resolve`,
    });

    expect(res.statusCode).toBe(410);

    vi.useRealTimers();
  });
});
