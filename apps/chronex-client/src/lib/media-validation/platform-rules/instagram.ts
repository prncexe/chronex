import z from "zod";

const captionMax2200 = z
  .string()
  .max(2200, "Caption cannot exceed 2200 characters");
const captionMax125 = z
  .string()
  .max(125, "Stories can include up to 125 characters in the caption");
const hashtagsMax30 = z
  .array(z.string())
  .max(30, "You can include up to 30 hashtags")
  .optional();
const singleMediaId = z
  .array(z.string())
  .length(1, "This format supports exactly 1 media file");

export const image = z.object({
    platform: z.literal("instagram"),
  caption: captionMax2200,
  hashtags: hashtagsMax30,
  fileIds: singleMediaId,
  type: z.literal("image"),
});

export const reel = z.object({
    platform: z.literal("instagram"),
  caption: captionMax2200,
  hashtags: hashtagsMax30,
  fileIds: z
    .array(z.string())
    .length(1, "Reels must have exactly 1 media file"),
  type: z.literal("reel"),
});

export const carousel = z.object({
    platform: z.literal("instagram"),
  caption: captionMax2200,
  hashtags: hashtagsMax30,
  fileIds: z
    .array(z.string())
    .min(2, "Carousels require at least 2 media files")
    .max(10, "Carousels can include up to 10 media files"),
  type: z.literal("carousel"),
});

export const story = z.object({
    platform: z.literal("instagram"),
  caption: captionMax125,
  hashtags: hashtagsMax30,
  fileIds: singleMediaId,
  type: z.literal("story"),
});


 const InstagramUnion = z.discriminatedUnion("type", [image, reel, carousel, story])
 export default InstagramUnion;