import { FastifyInstance } from "fastify";
import { createLinkSchema } from "./links.schema.js";
import { createLink, resolveLink } from "./links.service.js";
import { env } from "../../config/env.js";

export async function linksRoutes(app: FastifyInstance) {
  app.post(
    "/links",
    {
      config: {
        rateLimit: {
          max: env.CREATE_LINK_RATE_LIMIT_MAX,
          timeWindow: env.CREATE_LINK_RATE_LIMIT_TIME_WINDOW_MS,
        },
      },
    },
    async (request, reply) => {
      const input = createLinkSchema.safeParse(request.body);

      if (!input.success) {
        return reply.badRequest(input.error.issues[0].message);
      }

      const link = await createLink(input.data);

      return reply.code(201).send(link);
    },
  );

  app.get<{ Params: { slug: string } }>(
    "/links/:slug/resolve",
    async (request, reply) => {
      const { slug } = request.params;

      const link = await resolveLink(slug);

      if (!link) {
        return reply.notFound("Link not found");
      }

      return { url: link.url };
    },
  );
}
