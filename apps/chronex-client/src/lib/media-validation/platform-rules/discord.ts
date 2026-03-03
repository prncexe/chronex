import z from "zod";

const captionMax2000 = z
  .string()
  .max(2000, "Discord messages cannot exceed 2000 characters");
const embedCaptionMax6000 = z
  .string()
  .max(6000, "Discord embeds cannot exceed 6000 combined characters")
  .optional();
const embedTitleMax256 = z
  .string()
  .max(256, "Discord embed titles cannot exceed 256 characters")
  .optional();
const embedDescriptionMax4096 = z
  .string()
  .max(4096, "Discord embed descriptions cannot exceed 4096 characters")
  .optional();
const multipleFileIds = z
  .array(z.string())
  .min(1, "Provide at least 1 file")
  .max(10, "Discord supports up to 10 attachments per message");

export const message = z.object({
    platform: z.literal("discord"),
  caption: captionMax2000,
  fileIds: z
    .array(z.string())
    .min(1, "Provide at least 1 attachment when uploading files in a message")
    .max(10, "Discord supports up to 10 attachments per message")
    .optional(),
  type: z.literal("message"),
});

export const embed = z
  .object({
    platform: z.literal("discord"),
    caption: embedCaptionMax6000,
    title: embedTitleMax256,
    description: embedDescriptionMax4096,
    type: z.literal("embed"),
  })
  .refine(
    (value) => Boolean(value.caption || value.title || value.description),
    {
      message:
        "Provide at least one textual field when creating a Discord embed",
    },
  );

export const file = z.object({
    platform: z.literal("discord"),
  caption: captionMax2000.optional(),
  fileIds: multipleFileIds,
  type: z.literal("file"),
});


 const DiscordUnion = z.discriminatedUnion("type", [message, embed, file])
export default DiscordUnion;
