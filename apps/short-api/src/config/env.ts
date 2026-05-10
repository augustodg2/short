import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LINK_CACHE_TTL_SECONDS: z.coerce.number().positive().default(3600),
  CREATE_LINK_RATE_LIMIT_TIME_WINDOW_MS: z.coerce
    .number()
    .positive()
    .default(60_000),
  CREATE_LINK_RATE_LIMIT_MAX: z.coerce.number().positive().default(10),
  GLOBAL_RATE_LIMIT_TIME_WINDOW_MS: z.coerce
    .number()
    .positive()
    .default(60_000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().positive().default(60),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY_SECONDS: z.coerce
    .number()
    .positive()
    .default(15 * 60),
  JWT_REFRESH_EXPIRY_SECONDS: z.coerce
    .number()
    .positive()
    .default(7 * 24 * 60 * 60),
});

export const env = schema.parse(process.env);
