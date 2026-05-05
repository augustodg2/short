import { z } from "zod";

const schema = z.object({
  PORT: z.string().default("3000"),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

export const env = schema.parse(process.env);
