import express, { type Express } from "express";
import morgan from "morgan";
import { authMiddleware } from "./authMiddleware.js";
import { healthController } from "./controllers/healthController.js";

export function createServer(): Express {
  const app = express();

  app.use(morgan("dev"));
  app.use(authMiddleware);

  app.use(healthController);

  return app;
}
