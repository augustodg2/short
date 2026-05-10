import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { validateAccessToken } from "../auth.service.js";

export const authenticatePlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.routeOptions.config.public) {
        return;
      }

      try {
        await validateAccessToken(request.headers.authorization);
      } catch (error) {
        return reply.unauthorized();
      }
    },
  );
});
