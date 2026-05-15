import { app } from "./app.js";
import { env } from "./config/env.js";

await app.listen({ port: env.PORT, host: env.HOST });
