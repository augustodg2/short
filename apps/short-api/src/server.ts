import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { Redis } from "ioredis";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { linksRoutes } from "./modules/links/links.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { ValidationError } from "./utils/validate.js";

export const app = Fastify({ logger: true, trustProxy: true });

app.register(sensible);

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ValidationError) {
    return reply.badRequest(error.message);
  }

  throw error;
});

if (process.env.NODE_ENV != "test") {
  app.register(rateLimit, {
    redis: new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 500,
    }),
    skipOnError: true,
    max: env.GLOBAL_RATE_LIMIT_MAX,
    timeWindow: env.GLOBAL_RATE_LIMIT_TIME_WINDOW_MS,
  });
}

app.register(authRoutes);
app.register(linksRoutes);

app.get("/health", async () => ({ status: "ok" }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await app.listen({ port: env.PORT, host: env.HOST });
}
