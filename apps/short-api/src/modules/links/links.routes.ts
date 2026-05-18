import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { FastifyInstance } from "fastify";
import z from "zod";
import { env } from "../../config/env.js";
import { getLinkAnalytics, trackClick } from "./analytics/analytics.service.js";
import { extractTrackLinkPayload } from "./analytics/helpers/extract-track-link-payload.js";
import { ExpiredLinkError } from "./errors/ExpiredLinkError.js";
import { createLinkSchema } from "./links.schema.js";
import { createLink, getLinkById, resolveLink } from "./links.service.js";

export async function linksRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.post(
    "/links",
    {
      config: {
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
      const link = await createLink(request.body);

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

  routes.get(
    "/links/:id/analytics",
    {
      schema: {
        params: z.object({
          id: z.coerce.number().int().positive(),
        }),
      },
    },
    async (request, reply) => {
      const { id: linkId } = request.params;

      const link = await getLinkById(linkId);

      if (!link) {
        return reply.notFound("Link not found");
      }

      if (link.userId !== request.user!.id) {
        request.log.warn(
          { requesterUserId: request.user?.id, link },
          "Trying to fetch analytics for a link that belongs to another user.",
        );

        return reply.notFound("Link not found");
      }

      const analytics = await getLinkAnalytics(linkId);

      return reply.send(analytics);
    },
  );
}
