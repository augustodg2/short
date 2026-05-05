import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LINK_CACHE_TTL_SECONDS: z.coerce.number().positive().default(3600),
  CREATE_LINK_RATE_LIMIT_TTL_SECONDS: z.coerce.number().positive().default(60),
  CREATE_LINK_RATE_LIMIT_MAX: z.coerce.number().positive().default(10),
});

export const env = schema.parse(process.env);
