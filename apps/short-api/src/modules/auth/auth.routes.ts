import { FastifyInstance } from "fastify";
import { registerUserInputSchema, loginInputSchema } from "./auth.schema.js";

import { login, registerUser } from "./auth.service.js";
import { InvalidCredentialsError } from "./errors/InvalidCredentialsError.js";
import { EmailAlreadyInUseError } from "./errors/EmailAlreadyInUseError.js";
import { validate } from "../../utils/validate.js";

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
}
