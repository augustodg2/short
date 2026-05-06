import { Redis } from "ioredis";
import { env } from "../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 2000,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (error) => console.error("❌ Redis error:", error));
