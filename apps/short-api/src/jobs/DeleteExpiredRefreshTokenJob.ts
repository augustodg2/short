import { lt } from "drizzle-orm";
import { AsyncTask, SimpleIntervalJob } from "toad-scheduler";
import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";
import { logger } from "../lib/logger.js";

export const deleteExpiredRefreshTokensJob = () => {
  const deleteExpiredRefreshTokensTask = new AsyncTask(
    "delete-expired-refresh-tokens",
    async () => {
      try {
        logger.info("CRON: Will delete expired refresh tokens.");

        const result = await db
          .delete(refreshTokens)
          .where(lt(refreshTokens.expiresAt, new Date()))
          .returning({ id: refreshTokens.id });

        logger.info(`CRON: Deleted ${result.length} expired refresh tokens.`);
      } catch (error) {
        logger.error(
          `CRON: Error trying to delete expired refresh tokens: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  return new SimpleIntervalJob(
    { hours: 24, runImmediately: true },
    deleteExpiredRefreshTokensTask,
  );
};
