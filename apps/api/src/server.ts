import express, { type Express } from "express";
import morgan from "morgan";
import { prisma } from "./prisma.js";

export function createServer(): Express {
  const app = express();

  app.use(morgan("dev"));

  app.get("/health", async (request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      response.json({
        ok: true,
      });
    } catch (error) {
      console.error(error);

      response.status(503).json({
        status: "unavailable",
      });
    }
  });

  return app;
}
