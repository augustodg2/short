import express, { type Express } from "express";
import morgan from "morgan";

export function createServer(): Express {
  const app = express();

  app.use(morgan("dev"));

  app.get("/health", (request, response) => {
    response.status(200).send({
      ok: true,
    });
  });

  return app;
}
