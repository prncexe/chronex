import z from "zod";

const captionMax4000 = z
  .string()
  .max(4000, "Slack messages cannot exceed 4000 characters");

const multipleFileIds = z
  .array(z.string())
  .min(1, "Provide at least 1 file")
  .max(10, "Slack supports up to 10 files per message");

export const message = z.object({
    platform: z.literal("slack"),
  caption: captionMax4000,
  type: z.literal("message"),
  channelId: z.string(),
  workspaceName:z.string(),
});


export const file = z.object({
    platform: z.literal("slack"),
  caption: captionMax4000.optional(),
  fileIds: multipleFileIds,
  type: z.literal("file"),
  channelId: z.string(),
  workspaceName:z.string(),
});


    const SlackUnion = z.discriminatedUnion("type", [message, file])   
    export default SlackUnion;