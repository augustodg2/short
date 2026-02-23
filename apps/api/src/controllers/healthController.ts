import { Router } from "express";
import { prisma } from "../prisma.js";

export const healthController: Router = Router();

healthController.get("/health", async (request, response) => {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  response.setHeader("Pragma", "no-cache");

  try {
    await prisma.$queryRaw`SELECT 1`;

    return response.status(200).json({
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
