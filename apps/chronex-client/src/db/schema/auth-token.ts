import {
  pgTable,
  text,
  timestamp,
  serial,
  index,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { workspace } from "./workspace";
import { platformEnum } from "./enums";

// Auth tokens for social platforms
export const authToken = pgTable(
  "auth_tokens",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    profileId: text("profile_id"),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("auth_tokens_user_id_idx").on(table.userId),
    workspaceIdIdx: index("auth_tokens_workspace_id_idx").on(table.workspaceId),
    workspacePlatformIdx: uniqueIndex("auth_tokens_workspace_platform_idx").on(
      table.workspaceId,
      table.platform,
    ),
  }),
);

export const authTokenRelations = relations(authToken, ({ one }) => ({
  user: one(user, {
    fields: [authToken.userId],
    references: [user.id],
  }),
  workspace: one(workspace, {
    fields: [authToken.workspaceId],
    references: [workspace.id],
  }),
}));
