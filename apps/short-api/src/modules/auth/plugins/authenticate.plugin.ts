import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { validateAccessToken } from "../tokens.service.js";
import { logger } from "../../../lib/logger.js";

export const authenticatePlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await validateAccessToken(request.headers.authorization);

        request.user = user;
      } catch (err) {
        if (request.routeOptions.config.public) {
          logger.warn(
            { route: request.routeOptions.url, err },
            "Invalid access token, but will ignore because route is public.",
          );

          return;
        }

        logger.error(
          { route: request.routeOptions.url, err },
          "Invalid access token.",
        );

        return reply.unauthorized();
      }
    },
  );
});
