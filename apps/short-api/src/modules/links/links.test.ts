import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { FastifyInstance } from "fastify";
import { setupTestEnvironment } from "../../tests/helpers/setupTestEnvironment.js";
import { registerUser } from "../../tests/helpers/auth.js";

describe("POST /links", () => {
  const { getApp } = setupTestEnvironment();

  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(() => {
    app = getApp();
  });

  beforeEach(async () => {
    accessToken = await registerUser(app);
  });

  test("should create link and return slug", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com" },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().slug).toBeDefined();
    expect(response.json().url).toBe("https://example.com");
  });

  test("should return 400 for invalid URL", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "invalid url" },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe("Invalid URL");
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
    expect(response.json().message).toBe(
      "Expiration date should be in the future",
    );

    vi.useRealTimers();
  });
});

describe("GET /links/:slug/resolve", () => {
  const { getApp } = setupTestEnvironment();

  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(() => {
    app = getApp();
  });

  beforeEach(async () => {
    accessToken = await registerUser(app);
  });

  test("should return resolved url", async () => {
    const createLinkResponse = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com" },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const { slug } = createLinkResponse.json();

    const redirectResponse = await app.inject({
      method: "GET",
      url: `/links/${slug}/resolve`,
    });

    expect(redirectResponse.statusCode).toBe(200);
    expect(redirectResponse.json().url).toBe("https://example.com");
  });

  test("should return 404 for non-existing slug", async () => {
    const redirectResponse = await app.inject({
      method: "GET",
      url: `/links/non-existing-slug/resolve`,
    });

    expect(redirectResponse.statusCode).toBe(404);
    expect(redirectResponse.json().message).toBe("Link not found");
  });

  test("should return 410 for expired link", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const yesterday = new Date(2026, 4, 5);
    const today = new Date(2026, 4, 6);

    vi.setSystemTime(yesterday);

    const createLinkResponse = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com", expiresAt: today.toISOString() },
      headers: { authorization: `Bearer ${accessToken}` },
    });

    vi.setSystemTime(today);

    const { slug } = createLinkResponse.json();

    const redirectResponse = await app.inject({
      method: "GET",
      url: `/links/${slug}/resolve`,
    });

    expect(redirectResponse.statusCode).toBe(410);

    vi.useRealTimers();
  });
});
