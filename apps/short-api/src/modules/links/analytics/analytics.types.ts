export type AggregateMetric = {
  value: string;
  count: number;
};

export type Metric = {
  type: "total" | "country" | "device" | "referrer";
  category: string | null;
  count: number;
};

export type LinkAnalytics = {
  totalClicks: number;
  clicksByCountry: AggregateMetric[];
  clicksByReferer: AggregateMetric[];
  clicksByDevice: AggregateMetric[];
};
