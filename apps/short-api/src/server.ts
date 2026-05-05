import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { linksRoutes } from "./modules/links/links.routes.js";

export const app = Fastify({ logger: true });

app.register(sensible);
app.register(linksRoutes);

app.get("/health", async () => {
  ({ status: "ok" });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await app.listen({ port: Number(env.PORT), host: env.HOST });
}
