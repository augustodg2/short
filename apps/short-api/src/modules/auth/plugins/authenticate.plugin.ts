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
        const user = await validateAccessToken(request.headers.authorization);
        request.user = user;
      } catch (error) {
        return reply.unauthorized();
      }
    },
  );
});
