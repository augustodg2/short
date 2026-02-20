import express, { type Express } from "express";
import morgan from "morgan";
import { prisma } from "./prisma.js";

export function createServer(): Express {
  const app = express();

  app.use(morgan("dev"));

  app.get("/health", async (request, response) => {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('health')

    return  response.status(200).json({
        ok: true,
      });
    } catch (error) {
      console.error(error);

      response.status(503).json({
        ok: false,
        status: "unavailable",
      });
    }
  });

  return app;
}
