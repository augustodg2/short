import { FastifyRequest } from "fastify";
import { getSingleHeader } from "../../../../lib/utils/getSingleHeader.js";

export function extractTrackLinkPayload(
  request: FastifyRequest,
  linkId: number,
) {
  const userAgent = getSingleHeader(request.headers, "user-agent");
  const referrer = getSingleHeader(request.headers, "referer");
  const country =
    getSingleHeader(request.headers, "cf-ipcountry") ??
    getSingleHeader(request.headers, "x-country");

  return {
    linkId,
    userAgent,
    country,
    referrer,
  };
}
