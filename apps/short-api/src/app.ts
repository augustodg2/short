import rateLimit from "@fastify/rate-limit";
import fastifySchedule from "@fastify/schedule";
import sensible from "@fastify/sensible";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "@fastify/type-provider-zod";
import Fastify from "fastify";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import { deleteExpiredLinksJob } from "./jobs/DeleteExpiredLinksJob.js";
import { deleteExpiredRefreshTokensJob } from "./jobs/DeleteExpiredRefreshTokenJob.js";
import { logger } from "./lib/logger.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { authenticatePlugin } from "./modules/auth/plugins/authenticate.plugin.js";
import { linksRoutes } from "./modules/links/links.routes.js";

export const app = Fastify({
  loggerInstance: logger,
  trustProxy: true,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(sensible);
app.register(fastifySchedule);

app.ready().then(() => {
  app.scheduler.addSimpleIntervalJob(deleteExpiredRefreshTokensJob());
  app.scheduler.addSimpleIntervalJob(deleteExpiredLinksJob());
});

app.register(authenticatePlugin);

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
