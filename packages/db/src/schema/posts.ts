import { pgTable, text, timestamp, serial, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './auth'
import { workspace } from './workspace'
import { postStatusEnum, mediaTypeEnum } from './enums'
import { platformPosts } from './platform-posts'

// Posts table
export const post = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    platforms: text('platforms').array().notNull(),
    content: text('content').array().notNull(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    refName: text('ref_name').notNull(),

    status: postStatusEnum('status').notNull().default('scheduled'),

    scheduledAt: timestamp('scheduled_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdIdx: index('posts_workspace_id_idx').on(table.workspaceId),
    createdByIdx: index('posts_created_by_idx').on(table.createdBy),
    statusIdx: index('posts_status_idx').on(table.status),
    scheduledAtIdx: index('posts_scheduled_at_idx').on(table.scheduledAt),
    workspaceStatusIdx: index('posts_workspace_status_idx').on(table.workspaceId, table.status),
  }),
)

// Post media - images/videos attached to posts
export const postMedia = pgTable(
  'media',
  {
    id: serial('id').primaryKey(),

    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    url: text('url').notNull().unique(),
    type: mediaTypeEnum('type').notNull(),
    size: integer('size'),
    height: integer('height'),
    width: integer('width'),
    duration: integer('duration'),
    extension: text('extension'),
    aspectRatio: text('aspect_ratio'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdIdx: index('media_workspace_id_idx').on(table.workspaceId),
    userIdIdx: index('media_user_id_idx').on(table.userId),
  }),
)

export const postRelations = relations(post, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [post.createdBy],
    references: [user.id],
  }),
  workspace: one(workspace, {
    fields: [post.workspaceId],
    references: [workspace.id],
  }),
  platformPosts: many(platformPosts),
}))

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  workspace: one(workspace, {
    fields: [postMedia.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [postMedia.userId],
    references: [user.id],
  }),
}))
