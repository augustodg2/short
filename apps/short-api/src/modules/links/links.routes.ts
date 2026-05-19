import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { FastifyInstance } from "fastify";
import z from "zod";
import { env } from "../../config/env.js";
import { analyticsRoutes } from "./analytics/analytics.routes.js";
import { trackClick } from "./analytics/analytics.service.js";
import { extractTrackLinkPayload } from "./analytics/helpers/extract-track-link-payload.js";
import { ExpiredLinkError } from "./errors/ExpiredLinkError.js";
import { createLinkSchema } from "./links.schema.js";
import { createLink, resolveLink } from "./links.service.js";

export async function linksRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.post(
    "/links",
    {
      config: {
        public: true,
        rateLimit: {
          max: env.CREATE_LINK_RATE_LIMIT_MAX,
          timeWindow: env.CREATE_LINK_RATE_LIMIT_TIME_WINDOW_MS,
        },
      },
      schema: {
        body: createLinkSchema,
      },
    },
    async (request, reply) => {
      const link = await createLink(request.body, request.user?.id ?? null);

      return reply.code(201).send(link);
    },
  );

  routes.get(
    "/links/:slug/resolve",
    {
      schema: {
        params: z.object({
          slug: z.string(),
        }),
      },
      config: {
        public: true,
      },
    },
    async (request, reply) => {
      const { slug } = request.params;

      try {
        const link = await resolveLink(slug);

        if (!link) {
          return reply.notFound("Link not found");
        }

        const trackLinkPayload = extractTrackLinkPayload(request, link.id);

        trackClick(trackLinkPayload).catch((err) => {
          request.log.error(
            { err, payload: trackLinkPayload },
            "Error trying to track click to link.",
          );
        });

        return { url: link.url };
      } catch (error) {
        if (error instanceof ExpiredLinkError) {
          return reply.gone("The link you are trying to resolve expired");
        }

        throw error;
      }
    },
  );

  routes.register(analyticsRoutes);
}
