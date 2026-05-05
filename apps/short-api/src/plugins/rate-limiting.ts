import { FastifyReply, FastifyRequest } from "fastify";
import { redis } from "../cache/index.js";
import { env } from "../config/env.js";

export const limits = [
  {
    url: "/links",
    method: "POST",
    getKey: (ip: string) => `rate-limit:ip:${ip}:endpoint:create-link`,
    maxRequests: env.CREATE_LINK_RATE_LIMIT_MAX,
    windowTtl: env.CREATE_LINK_RATE_LIMIT_TTL_SECONDS,
  },
];

export async function rateLimiting(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const rateLimit = limits.find(
    (limit) =>
      limit.url === request.routeOptions.url && limit.method === request.method,
  );

  if (!rateLimit) {
    return;
  }

  const { ip } = request;

  const rateLimitKey = rateLimit.getKey(ip);
  try {
    const requestCount = await redis.incr(rateLimitKey);

    if (requestCount === 1) {
      await redis.expire(rateLimitKey, rateLimit.windowTtl);
    }

    if (requestCount > rateLimit.maxRequests) {
      return reply.tooManyRequests().header("retry-after", rateLimit.windowTtl);
    }
  } catch (error) {
    console.warn("Rate limiting error, allowing request", error);
  }
}
