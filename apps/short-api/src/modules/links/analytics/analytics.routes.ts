import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { FastifyInstance } from "fastify";
import z from "zod";
import { getLinkById } from "../links.service.js";
import { getLinkAnalytics } from "./analytics.service.js";

export async function analyticsRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();

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
          { requesterUserId: request.user!.id, link },
          "Trying to fetch analytics for a link that belongs to another user.",
        );

        return reply.notFound("Link not found");
      }

      const analytics = await getLinkAnalytics(linkId);

      return reply.send(analytics);
    },
  );
}
