import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { linksRoutes } from "./modules/links/links.routes.js";
import { rateLimiting } from "./plugins/rate-limiting.js";

export const app = Fastify({ logger: true, trustProxy: true });

app.register(sensible);

app.addHook("preHandler", rateLimiting);

app.register(linksRoutes);

app.get("/health", async () => {
  ({ status: "ok" });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await app.listen({ port: env.PORT, host: env.HOST });
}
