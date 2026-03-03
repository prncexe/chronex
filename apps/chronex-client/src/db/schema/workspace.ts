import { pgTable, text, timestamp, index, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { authToken } from "./auth-token";
import { post, postMedia } from "./posts";

// Workspaces table
export const workspace = pgTable(
  "workspaces",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    image: text("image"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
 createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => ({
    createdByIdx: index("workspaces_created_by_idx").on(table.createdBy),
  }),
);

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [workspace.createdBy],
    references: [user.id],
  }),
  authTokens: many(authToken),
  posts: many(post),
  media: many(postMedia),
}));
