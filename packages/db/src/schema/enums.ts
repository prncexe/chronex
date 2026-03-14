import { pgEnum } from 'drizzle-orm/pg-core'

// Post status enums
export const postStatusEnum = pgEnum('post_status', [
  'scheduled',
  'published',
  'publishing',
  'failed',
])

export const platformPostStatusEnum = pgEnum('platform_post_status', [
  'pending',
  'processing',
  'published',
  'failed',
])

// Media enums
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video'])

// Platform enum
export const platformEnum = pgEnum('platform', [
  'linkedin',
  'instagram',
  'threads',
  'slack',
  'discord',
])

//use this for future reference if we want to add platform-specific enums

// // LinkedIn enums
// export const linkedinVisibilityEnum = pgEnum("linkedin_visibility", [
//   "PUBLIC",
//   "CONNECTIONS",
// ]);

// export const linkedinMediaTypeEnum = pgEnum("linkedin_media_type", [
//   "NONE",
//   "IMAGE",
//   "VIDEO",
//   "ARTICLE",
// ]);

// // Instagram enum
// export const instagramMediaTypeEnum = pgEnum("instagram_media_type", [
//   "IMAGE",
//   "VIDEO",
//   "REELS",
//   "CAROUSEL",
//   "STORIES",
// ]);

// // Threads enum
// export const threadsMediaTypeEnum = pgEnum("threads_media_type", [
//   "TEXT",
//   "IMAGE",
//   "VIDEO",
// ]);

// // YouTube enum
// export const youtubeVisibilityEnum = pgEnum("youtube_visibility", [
//   "public",
//   "unlisted",
//   "private",
// ]);
