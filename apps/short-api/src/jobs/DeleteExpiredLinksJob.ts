import { lt } from "drizzle-orm";
import { AsyncTask, SimpleIntervalJob } from "toad-scheduler";
import { db } from "../db/index.js";
import { links } from "../db/schema.js";
import { logger } from "../lib/logger.js";

export const deleteExpiredLinksJob = () => {
  const deleteExpiredLinksTask = new AsyncTask(
    "delete-expired-links",
    async () => {
      try {
        logger.info("CRON: Will delete expired links.");

        const result = await db
          .delete(links)
          .where(lt(links.expiresAt, new Date()))
          .returning({ id: links.id });

        logger.info(`CRON: Deleted ${result.length} expired links.`);
      } catch (error) {
        logger.error(
          `CRON: Error trying to delete links: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  return new SimpleIntervalJob(
    { hours: 24, runImmediately: true },
    deleteExpiredLinksTask,
  );
};
