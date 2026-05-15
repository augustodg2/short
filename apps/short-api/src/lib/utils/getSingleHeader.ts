import { FastifyRequest } from "fastify";

export function getSingleHeader(
  headers: FastifyRequest["headers"],
  header: keyof FastifyRequest["headers"],
): string | null {
  const rawValue = headers[header];
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  return value ?? null;
}
