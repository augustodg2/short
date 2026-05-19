import { LinkAnalytics, Metric } from "../analytics.types.js";

export function formatAnalytics(metrics: Metric[]): LinkAnalytics {
  const aggregate = (type: "country" | "referrer" | "device") =>
    metrics
      .filter((metric) => metric.type === type)
      .map((metric) => ({
        value: metric.category ?? "unknown",
        count: metric.count,
      }))
      .sort((a, b) => b.count - a.count);

  return {
    totalClicks: metrics.find((metric) => metric.type === "total")?.count ?? 0,
    clicksByCountry: aggregate("country"),
    clicksByReferrer: aggregate("referrer"),
    clicksByDevice: aggregate("device"),
  };
}
