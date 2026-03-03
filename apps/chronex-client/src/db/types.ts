import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { workspace } from "./schema/workspace";
import { authToken } from "./schema/auth-token";
import { post, postMedia } from "./schema/posts";
import {
 platformPosts
} from "./schema/platform-posts";

// Type exports for better type inference
export type Workspace = InferSelectModel<typeof workspace>;
export type NewWorkspace = InferInsertModel<typeof workspace>;

export type AuthToken = InferSelectModel<typeof authToken>;
export type NewAuthToken = InferInsertModel<typeof authToken>;

export type Post = InferSelectModel<typeof post>;
export type NewPost = InferInsertModel<typeof post>;

export type PostMedia = InferSelectModel<typeof postMedia>;
export type NewPostMedia = InferInsertModel<typeof postMedia>;

export type PlatformPost = InferSelectModel<typeof platformPosts>;
export type NewPlatformPost = InferInsertModel<typeof platformPosts>;





// use these types in your application for better type safety and autocompletion when working with the database models.

// export type YoutubePost = InferSelectModel<typeof youtubePosts>;
// export type NewYoutubePost = InferInsertModel<typeof youtubePosts>;

// export type LinkedinPost = InferSelectModel<typeof linkedinPosts>;
// export type NewLinkedinPost = InferInsertModel<typeof linkedinPosts>;

// export type InstagramPost = InferSelectModel<typeof instagramPosts>;
// export type NewInstagramPost = InferInsertModel<typeof instagramPosts>;

// export type ThreadsPost = InferSelectModel<typeof threadsPosts>;
// export type NewThreadsPost = InferInsertModel<typeof threadsPosts>;

// export type SlackPost = InferSelectModel<typeof slackPosts>;
// export type NewSlackPost = InferInsertModel<typeof slackPosts>;

// export type DiscordPost = InferSelectModel<typeof discordPosts>;
// export type NewDiscordPost = InferInsertModel<typeof discordPosts>;
