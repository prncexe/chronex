import {
  pgTable,
  text,
  timestamp,
  index,
  serial,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { post, postMedia } from "./posts";
import {
  platformPostStatusEnum,
  platformEnum,
} from "./enums";

export const platformPosts = pgTable("platform_posts", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => post.id, { onDelete: "cascade" }).notNull(),
  platform: platformEnum("platform").notNull(),
  externalId: text("external_id"),
  postUrl: text("post_url"),
  metadata:jsonb("metadata"),
  status: platformPostStatusEnum("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},
(table) => ({
  postIdPlatformIdx: index("platform_posts_post_id_platform_idx").on(
    table.postId,
    table.platform,
  ),  
  statusIdx: index("platform_posts_status_idx").on(table.status),
  scheduledAtIdx: index("platform_posts_scheduled_at_idx").on(
    table.scheduledAt,
  ),
  
}));

export const platformPostsRelations = relations(platformPosts, ({ one }) => ({
  post: one(post, {
    fields: [platformPosts.postId],
    references: [post.id],
  }),
}));



// deprecated - we will use platformPosts table instead of separate tables for each platform




// export const youtubePosts = pgTable(
//   "youtube_posts",
//   {
//     id: serial("id").primaryKey(),

//     postId: integer("post_id")
//       .notNull()
//       .references(() => post.id, { onDelete: "cascade" })
//       .unique(),

//     title: text("title").notNull(),
//     description: text("description"),
//     visibility: youtubeVisibilityEnum("visibility").default("public"),
//     thumbnailUrl: text("thumbnail_url"),

//     status: platformPostStatusEnum("status").notNull().default("pending"),
//     scheduledAt: timestamp("scheduled_at"),
//     publishedAt: timestamp("published_at"),
//     errorMessage: text("error_message"),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     statusIdx: index("youtube_posts_status_idx").on(table.status),
//     scheduledAtIdx: index("youtube_posts_scheduled_at_idx").on(
//       table.scheduledAt,
//     ),
//   }),
// );

// export const youtubePostRelations = relations(youtubePosts, ({ one }) => ({
//   post: one(post, {
//     fields: [youtubePosts.postId],
//     references: [post.id],
//   }),
// }));

// export const linkedinPosts = pgTable(
//   "linkedin_posts",
//   {
//     id: serial("id").primaryKey(),

//     postId: integer("post_id")
//       .notNull()
//       .references(() => post.id, { onDelete: "cascade" })
//       .unique(),

//     commentary: text("commentary"),
//     visibility: linkedinVisibilityEnum("visibility").default("PUBLIC"),

//     linkedinPostUrn: text("linkedin_post_urn"),
//     mediaType: linkedinMediaTypeEnum("media_type").default("IMAGE"),
//     status: platformPostStatusEnum("status").notNull().default("pending"),
//     scheduledAt: timestamp("scheduled_at"),
//     publishedAt: timestamp("published_at"),
//     errorMessage: text("error_message"),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     statusIdx: index("linkedin_posts_status_idx").on(table.status),
//     scheduledAtIdx: index("linkedin_posts_scheduled_at_idx").on(
//       table.scheduledAt,
//     ),
//   }),
// );

// export const linkedinPostRelations = relations(linkedinPosts, ({ one }) => ({
//   post: one(post, {
//     fields: [linkedinPosts.postId],
//     references: [post.id],
//   }),
// }));

// export const instagramPosts = pgTable(
//   "instagram_posts",
//   {
//     id: serial("id").primaryKey(),

//     postId: integer("post_id")
//       .notNull()
//       .references(() => post.id, { onDelete: "cascade" })
//       .unique(),

//     mediaType: instagramMediaTypeEnum("media_type").default("IMAGE"),
//     caption: text("caption"),
//     coverUrl: text("cover_url"),

//     instagramMediaId: text("instagram_media_id"),

//     status: platformPostStatusEnum("status").notNull().default("pending"),
//     scheduledAt: timestamp("scheduled_at"),
//     publishedAt: timestamp("published_at"),
//     errorMessage: text("error_message"),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     statusIdx: index("instagram_posts_status_idx").on(table.status),
//     scheduledAtIdx: index("instagram_posts_scheduled_at_idx").on(
//       table.scheduledAt,
//     ),
//   }),
// );

// export const instagramPostRelations = relations(instagramPosts, ({ one }) => ({
//   post: one(post, {
//     fields: [instagramPosts.postId],
//     references: [post.id],
//   }),
// }));

// export const threadsPosts = pgTable(
//   "threads_posts",
//   {
//     id: serial("id").primaryKey(),

//     postId: integer("post_id")
//       .notNull()
//       .references(() => post.id, { onDelete: "cascade" })
//       .unique(),

//     mediaType: threadsMediaTypeEnum("media_type").default("TEXT"),
//     text: text("text"),

//     threadsMediaId: text("threads_media_id"),

//     status: platformPostStatusEnum("status").notNull().default("pending"),
//     scheduledAt: timestamp("scheduled_at"),
//     publishedAt: timestamp("published_at"),
//     errorMessage: text("error_message"),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     statusIdx: index("threads_posts_status_idx").on(table.status),
//     scheduledAtIdx: index("threads_posts_scheduled_at_idx").on(
//       table.scheduledAt,
//     ),
//   }),
// );

// export const threadsPostRelations = relations(threadsPosts, ({ one }) => ({
//   post: one(post, {
//     fields: [threadsPosts.postId],
//     references: [post.id],
//   }),
// }));

// export const slackPosts = pgTable(
//   "slack_posts",
//   {
//     id: serial("id").primaryKey(),

//     postId: integer("post_id")
//       .notNull()
//       .references(() => post.id, { onDelete: "cascade" })
//       .unique(),

//     channelId: text("channel_id").notNull(),
//     text: text("text"),

//     messageTs: text("message_ts"),

//     status: platformPostStatusEnum("status").notNull().default("pending"),
//     scheduledAt: timestamp("scheduled_at"),
//     publishedAt: timestamp("published_at"),
//     errorMessage: text("error_message"),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     channelIdIdx: index("slack_posts_channel_id_idx").on(table.channelId),
//     statusIdx: index("slack_posts_status_idx").on(table.status),
//     scheduledAtIdx: index("slack_posts_scheduled_at_idx").on(table.scheduledAt),
//   }),
// );

// export const slackPostRelations = relations(slackPosts, ({ one }) => ({
//   post: one(post, {
//     fields: [slackPosts.postId],
//     references: [post.id],
//   }),
// }));

// export const discordPosts = pgTable(
//   "discord_posts",
//   {
//     id: serial("id").primaryKey(),

//     postId: integer("post_id")
//       .notNull()
//       .references(() => post.id, { onDelete: "cascade" })
//       .unique(),

//     channelId: text("channel_id").notNull(),
//     guildId: text("guild_id"),
//     content: text("content"),

//     discordMessageId: text("discord_message_id"),

//     status: platformPostStatusEnum("status").notNull().default("pending"),
//     scheduledAt: timestamp("scheduled_at"),
//     publishedAt: timestamp("published_at"),
//     errorMessage: text("error_message"),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     channelIdIdx: index("discord_posts_channel_id_idx").on(table.channelId),
//     guildIdIdx: index("discord_posts_guild_id_idx").on(table.guildId),
//     statusIdx: index("discord_posts_status_idx").on(table.status),
//     scheduledAtIdx: index("discord_posts_scheduled_at_idx").on(
//       table.scheduledAt,
//     ),
//   }),
// );

// export const discordPostRelations = relations(discordPosts, ({ one }) => ({
//   post: one(post, {
//     fields: [discordPosts.postId],
//     references: [post.id],
//   }),
// }));
