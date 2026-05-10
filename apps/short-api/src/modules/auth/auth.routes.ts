import { FastifyInstance } from "fastify";
import { registerUserInputSchema, loginInputSchema } from "./auth.schema.js";

import { registerUser } from "./auth.service.js";
import { EmailAlreadyInUseError } from "./errors/EmailAlreadyInUseError.js";
import { validate } from "../../utils/validate.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
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
  });
}
