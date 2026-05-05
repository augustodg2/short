import { z } from "zod";

export const createLinkSchema = z.object({
  url: z.url(),
  expiresAt: z.iso.datetime().optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
