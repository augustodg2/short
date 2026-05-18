import { UAParser } from "ua-parser-js";
import * as analyticsRepository from "./analytics.repository.js";
import { LinkAnalytics } from "./analytics.types.js";
import { formatAnalytics } from "./helpers/format-analytics.js";

export async function getLinkAnalytics(linkId: number): Promise<LinkAnalytics> {
  const metrics = await analyticsRepository.getMetricsByLinkId(linkId);

  return formatAnalytics(metrics);
}

export async function trackClick({
  linkId,
  userAgent,
  country,
  referrer,
}: {
  linkId: number;
  userAgent: string | null;
  country: string | null;
  referrer: string | null;
}) {
  let device: string | null = null;

  if (userAgent) {
    device = UAParser(userAgent).device.type ?? null;
  }

  await analyticsRepository.trackClick({
    linkId,
    country,
    referrer,
    device,
  });
}
