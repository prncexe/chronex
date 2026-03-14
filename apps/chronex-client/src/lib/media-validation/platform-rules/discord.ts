import z from 'zod'

const captionMax2000 = z.string().max(2000, 'Discord messages cannot exceed 2000 characters')
const embedCaptionMax6000 = z
  .string()
  .max(6000, 'Discord embeds cannot exceed 6000 combined characters')
  .optional()
const embedTitleMax256 = z
  .string()
  .max(256, 'Discord embed titles cannot exceed 256 characters')
  .optional()
const embedDescriptionMax4096 = z
  .string()
  .max(4096, 'Discord embed descriptions cannot exceed 4096 characters')
  .optional()
const multipleFileIds = z
  .array(z.string())
  .min(1, 'Provide at least 1 file')
  .max(10, 'Discord supports up to 10 attachments per message')

export const message = z.object({
  platform: z.literal('discord'),
  caption: captionMax2000,
  type: z.literal('message'),
  channelId: z.string(),
})

export const embed = z.object({
  platform: z.literal('discord'),
  embed: z.object({
    title: embedTitleMax256,
    description: embedDescriptionMax4096,
    color: z
      .number()
      .int()
      .nonnegative()
      .refine((val) => val <= 0xffffff, {
        message: 'Color must be a valid hex code (0 to 0xFFFFFF)',
      }),
    footer: z.object({ text: captionMax2000 }).optional(),
    timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Timestamp must be a valid ISO 8601 date string',
    }),
    image: z.object({ url: z.url() }).optional(),
    thumbnail: z.object({ url: z.url() }).optional(),
  }),
  type: z.literal('embed'),
  channelId: z.string(),
})

export const file = z.object({
  platform: z.literal('discord'),
  caption: captionMax2000.optional(),
  fileIds: multipleFileIds,
  type: z.literal('file'),
  channelId: z.string(),
})

const DiscordUnion = z.discriminatedUnion('type', [message, embed, file])
export default DiscordUnion
