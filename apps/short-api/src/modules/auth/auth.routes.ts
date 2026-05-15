import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { FastifyInstance } from "fastify";
import {
  loginInputSchema,
  logoutInputSchema,
  refreshSessionInputSchema,
  registerUserInputSchema,
} from "./auth.schema.js";
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
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.post(
    "/auth/register",
    {
      config: {
        public: true,
      },
      schema: {
        body: registerUserInputSchema,
      },
    },
    async (request, reply) => {
      try {
        const tokens = await registerUser(request.body);

        return tokens;
      } catch (error) {
        if (error instanceof EmailAlreadyInUseError) {
          return reply.conflict(error.message);
        }

        throw error;
      }
    },
  );

  routes.post(
    "/auth/login",
    {
      config: {
        public: true,
      },
      schema: {
        body: loginInputSchema,
      },
    },
    async (request, reply) => {
      try {
        const tokens = await login(request.body);

        return tokens;
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.unauthorized(error.message);
        }

        throw error;
      }
    },
  );

  routes.post(
    "/auth/refresh",
    {
      config: {
        public: true,
      },
      schema: {
        body: refreshSessionInputSchema,
      },
    },
    async (request, reply) => {
      try {
        const tokens = await refreshSession(request.body.refreshToken);

        return tokens;
      } catch (error) {
        if (error instanceof InvalidRefreshTokenError) {
          return reply.unauthorized(error.message);
        }

        throw error;
      }
    },
  );

  routes.post(
    "/auth/logout",
    {
      config: {
        public: true,
      },
      schema: {
        body: logoutInputSchema,
      },
    },
    async (request) => {
      await deleteRefreshToken(request.body.refreshToken);
    },
  );
}
