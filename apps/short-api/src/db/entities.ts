import { clicks, links, refreshTokens, users } from "./schema.js";

export type Link = typeof links.$inferSelect;
export type LinkClick = typeof clicks.$inferSelect;
export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
