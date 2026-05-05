import { FastifyInstance } from "fastify";
import { createLinkSchema } from "./links.schema.js";
import { createLink } from "./links.service.js";

export async function linksRoutes(app: FastifyInstance) {
  app.post("/links", async (request, reply) => {
    const input = createLinkSchema.safeParse(request.body);

    if (!input.success) {
      return reply.badRequest(input.error.issues[0].message);
    }

    const link = await createLink(input.data);

    return reply.code(201).send(link);
  });
}
