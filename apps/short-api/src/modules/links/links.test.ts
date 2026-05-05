import { describe, expect, test } from "vitest";
import { app } from "../../server.js";

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
});
