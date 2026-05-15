import { describe, expect, test, vi } from "vitest";
import { app } from "../../app.js";

describe("POST /links", () => {
  test("should create link and return slug", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com" },
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
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe(
      "Expiration date should be in the future",
    );

    vi.useRealTimers();
  });
});

describe("GET /links/:slug/resolve", () => {
  test("should return resolved url", async () => {
    const createLinkResponse = await app.inject({
      method: "POST",
      url: "/links",
      body: { url: "https://example.com" },
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
