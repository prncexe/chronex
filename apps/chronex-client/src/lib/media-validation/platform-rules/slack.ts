import z from "zod";

const captionMax4000 = z
  .string()
  .max(4000, "Slack messages cannot exceed 4000 characters");
const descriptionMax3000 = z
  .string()
  .max(3000, "Slack sections cannot exceed 3000 characters");
const multipleFileIds = z
  .array(z.string())
  .min(1, "Provide at least 1 file")
  .max(10, "Slack supports up to 10 files per message");

export const message = z.object({
    platform: z.literal("slack"),
  caption: captionMax4000,
  fileIds: z
    .array(z.string())
    .min(1, "Add at least 1 file when attaching uploads to a Slack message")
    .max(10, "Slack messages can include up to 10 file uploads")
    .optional(),
  type: z.literal("message"),
});

export const section = z.object({
    platform: z.literal("slack"),
  description: descriptionMax3000,
  type: z.literal("block"),
});

export const file = z.object({
    platform: z.literal("slack"),
  caption: captionMax4000.optional(),
  fileIds: multipleFileIds,
  type: z.literal("file"),
});


    const SlackUnion = z.discriminatedUnion("type", [message, section, file])   
    export default SlackUnion;