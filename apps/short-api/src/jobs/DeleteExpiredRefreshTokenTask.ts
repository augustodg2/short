import { lt } from "drizzle-orm";
import { AsyncTask, SimpleIntervalJob } from "toad-scheduler";
import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";
import { FastifyInstance } from "fastify";

export const deleteExpiredRefreshTokenJob = (app: FastifyInstance) => {
  const deleteExpiredRefreshTokenTask = new AsyncTask(
    "Delete expired refresh token",
    async () => {
      try {
        app.log.info("CRON: Will delete expired refresh tokens.");

        const result = await db
          .delete(refreshTokens)
          .where(lt(refreshTokens.expiresAt, new Date()))
          .returning();

        app.log.info(`CRON: Deleted ${result.length} rows.`);
      } catch (error) {
        app.log.error(
          `CRON: Error trying to delete expired refresh tokens: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  return new SimpleIntervalJob(
    { hours: 24, runImmediately: true },
    deleteExpiredRefreshTokenTask,
  );
};
