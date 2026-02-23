import { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(`https://api.workos.com/sso/jwks/${process.env.WORKOS_CLIENT_ID}`),
);

const PUBLIC_ROUTES = [{ path: "/health", method: "GET" }];

function isPublicRoute(request: Request) {
  return PUBLIC_ROUTES.some(
    (route) => route.path === request.path && route.method === request.method,
  );
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (isPublicRoute(request)) {
    return next();
  }

  const token = request.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);

    request.user = payload;

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
