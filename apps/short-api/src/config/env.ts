import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CACHE_TTL_SECONDS: z.coerce.number().positive().default(3600),
});

export const env = schema.parse(process.env);
