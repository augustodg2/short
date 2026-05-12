import { FastifyInstance } from "fastify";
import {
  loginInputSchema,
  logoutInputSchema,
  refreshSessionInputSchema,
  registerUserInputSchema,
} from "./auth.schema.js";

import { validate } from "../../utils/validate.js";
import {
  deleteRefreshToken,
  login,
  refreshSession,
  registerUser,
} from "./auth.service.js";
import { EmailAlreadyInUseError } from "./errors/EmailAlreadyInUseError.js";
import { InvalidCredentialsError } from "./errors/InvalidCredentialsError.js";
import { InvalidRefreshTokenError } from "./errors/InvalidRefreshTokenError.js";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/register",
    {
      config: {
        public: true,
      },
    },
    async (request, reply) => {
      try {
        const input = validate(request.body, registerUserInputSchema);

        const tokens = await registerUser(input);

        return tokens;
      } catch (error) {
        if (error instanceof EmailAlreadyInUseError) {
          return reply.conflict(error.message);
        }

        throw error;
      }
    },
  );

  app.post(
    "/auth/login",
    {
      config: {
        public: true,
      },
    },
    async (request, reply) => {
      try {
        const input = validate(request.body, loginInputSchema);

        const tokens = await login(input);

        return tokens;
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.unauthorized(error.message);
        }

        throw error;
      }
    },
  );

  app.post("/auth/refresh", async (request, reply) => {
    try {
      const { refreshToken } = validate(
        request.body,
        refreshSessionInputSchema,
      );

      const tokens = await refreshSession(refreshToken, request.user!);

      return tokens;
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        return reply.unauthorized(error.message);
      }

      throw error;
    }
  });

  app.post("/auth/logout", async (request, reply) => {
    const { refreshToken } = validate(request.body, logoutInputSchema);

    await deleteRefreshToken(refreshToken);
  });
}
