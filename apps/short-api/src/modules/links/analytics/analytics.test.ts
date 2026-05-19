import { FastifyInstance } from "fastify";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Link } from "../../../db/entities.js";
import { insertClick } from "../../../tests/helpers/analytics.js";
import { createUserAndLogin } from "../../../tests/helpers/auth.js";
import { createLink } from "../../../tests/helpers/links.js";
import { setupTestEnvironment } from "../../../tests/helpers/setupTestEnvironment.js";

describe("GET /link/:id/analytics", () => {
  const { getApp } = setupTestEnvironment();

  let app: FastifyInstance;
  let user: Awaited<ReturnType<typeof createUserAndLogin>>;
  let link: Link;

  beforeAll(() => {
    app = getApp();
  });

  beforeEach(async () => {
    user = await createUserAndLogin();
    link = await createLink(user.id);
  });

  test("should return the link analytics", async () => {
    await Promise.all([
      insertClick(link.id),
      insertClick(link.id, { country: "BR" }),
      insertClick(link.id, { country: "BR", device: "mobile" }),
      insertClick(link.id, {
        country: "US",
        device: null,
        referrer: "https://example.com",
      }),
    ]);

    const res = await app.inject({
      method: "GET",
      url: `/links/${link.id}/analytics`,
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(200);

    const responseBody = res.json();

    expect(responseBody).toHaveProperty("totalClicks", 4);

    expect(responseBody).toHaveProperty("clicksByCountry", [
      {
        value: "BR",
        count: 2,
      },
      { value: "US", count: 1 },
      { value: "unknown", count: 1 },
    ]);

    expect(responseBody).toHaveProperty("clicksByDevice", [
      { value: "unknown", count: 3 },
      {
        value: "mobile",
        count: 1,
      },
    ]);

    expect(responseBody).toHaveProperty("clicksByReferrer", [
      { value: "unknown", count: 3 },
      {
        value: "https://example.com",
        count: 1,
      },
    ]);
  });

  test("should return 404 for non existing link", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/links/999/analytics`,
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty("message", "Link not found");
  });

  test("should return 404 for link not related to any user", async () => {
    const linkWithoutUser = await createLink();

    const res = await app.inject({
      method: "GET",
      url: `/links/${linkWithoutUser.id}/analytics`,
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty("message", "Link not found");
  });

  test("should return 404 for link related to another user", async () => {
    const anotherUser = await createUserAndLogin({
      email: "another@example.com",
    });

    const anotherUserLink = await createLink(anotherUser.id);

    const res = await app.inject({
      method: "GET",
      url: `/links/${anotherUserLink.id}/analytics`,
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty("message", "Link not found");
  });

  test("should return 401 for non authenticated request", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/links/${link.id}/analytics`,
    });

    expect(res.statusCode).toBe(401);
  });
});
