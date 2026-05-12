import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, integer } from "drizzle-orm/pg-core";

export const links = pgTable(
  "links",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
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
  (clicksTable) => [
    index("clicks_link_id_idx").on(clicksTable.linkId),
    index("clicks_created_at_idx").on(clicksTable.createdAt),
  ],
);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
  },
  (accessTokensTable) => [
    index("refresh_tokens_token_hash_idx").on(accessTokensTable.tokenHash),
    index("refresh_tokens_user_id").on(accessTokensTable.userId),
  ],
);

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
