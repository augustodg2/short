import { z } from "zod";

export const createLinkSchema = z.object({
  url: z.url(),
  expiresAt: z.iso
    .datetime()
    .optional()
    .nullable()
    .transform((dateString) => (dateString ? new Date(dateString) : null))
    .refine(
      (date) => !date || date > new Date(),
      "Expiration date should be in the future",
    ),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
