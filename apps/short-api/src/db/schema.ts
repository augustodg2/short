import { pgTable, text, timestamp, index, integer } from "drizzle-orm/pg-core";

export const links = pgTable(
  "links",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    url: text("url").notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (linksTable) => [index("links_slug_idx").on(linksTable.slug)],
);

export const clicks = pgTable(
  "clicks",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    linkId: integer("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    country: text("country"),
    referrer: text("referrer"),
    device: text("device"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (clicksTable) => [index("clicks_link_id_idx").on(clicksTable.linkId)],
);
