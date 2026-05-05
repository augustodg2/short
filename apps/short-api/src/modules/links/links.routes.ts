import { FastifyInstance } from "fastify";
import { createLinkSchema } from "./links.schema.js";
import { createLink, getLink } from "./links.service.js";

export async function linksRoutes(app: FastifyInstance) {
  app.post("/links", async (request, reply) => {
    const input = createLinkSchema.safeParse(request.body);

    if (!input.success) {
      return reply.badRequest(input.error.issues[0].message);
    }

    const link = await createLink(input.data);

    return reply.code(201).send(link);
  });

  app.get<{ Params: { slug: string } }>(
    "/links/:slug/resolve",
    async (request, reply) => {
      const { slug } = request.params;

      const link = await getLink(slug);

      if (!link) {
        return reply.notFound("Link not found");
      }

      return { url: link.url };
    },
  );
}
