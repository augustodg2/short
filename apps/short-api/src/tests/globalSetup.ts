import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer } from "@testcontainers/redis";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function setupDb() {
  const dbContainer = await new PostgreSqlContainer(
    "postgres:16-alpine",
  ).start();

  process.env.DATABASE_URL = dbContainer.getConnectionUri();

  const client = postgres(dbContainer.getConnectionUri(), { max: 1 });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  await client.end();

  return async () => {
    await dbContainer.stop();
  };
}

async function setupRedis() {
  const redisContainer = await new RedisContainer("redis:7-alpine").start();

  process.env.REDIS_URL = redisContainer.getConnectionUrl();

  return async () => {
    await redisContainer.stop();
  };
}

export async function setup() {
  const [stopDb, stopRedis] = await Promise.all([setupDb(), setupRedis()]);

  return async () => {
    await Promise.all([stopDb, stopRedis]);
  };
}
