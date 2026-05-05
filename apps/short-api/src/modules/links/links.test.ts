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
