import { FastifyInstance } from "fastify";
import { createLinkSchema } from "./links.schema.js";
import { createLink, resolveLink, trackClick } from "./links.service.js";
import { env } from "../../config/env.js";
import { ExpiredLinkError } from "./errors/ExpiredLinkError.js";
import { getSingleHeader } from "../../utils/getSingleHeader.js";

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

      try {
        const link = await resolveLink(slug);

        if (!link) {
          return reply.notFound("Link not found");
        }

        const userAgent = getSingleHeader(request.headers, "user-agent");
        const referrer = getSingleHeader(request.headers, "referer");
        const country =
          getSingleHeader(request.headers, "cf-ipcountry") ??
          getSingleHeader(request.headers, "x-country");

        trackClick({
          linkId: link.id,
          userAgent,
          country,
          referrer,
        }).catch((error) => {
          app.log.warn("Error trying to track click to link:", error);
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
}
