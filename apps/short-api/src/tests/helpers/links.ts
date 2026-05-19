import { Link } from "../../db/entities.js";
import { CreateLinkInput } from "../../modules/links/links.schema.js";
import * as LinksService from "../../modules/links/links.service.js";

const defaultLink: CreateLinkInput = {
  url: "https://example.com",
  expiresAt: null,
};

export async function createLink(
  requesterUserId: number | null = null,
  link: Partial<CreateLinkInput> = {},
): Promise<Link> {
  return LinksService.createLink({ ...defaultLink, ...link }, requesterUserId);
}
