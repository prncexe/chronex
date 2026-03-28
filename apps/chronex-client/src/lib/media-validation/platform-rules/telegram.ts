import z from 'zod'

const messageCaption = z.string().max(4096, 'Telegram messages cannot exceed 4096 characters')
const mediaCaption = z
  .string()
  .max(1024, 'Telegram media captions cannot exceed 1024 characters')
  .optional()
const singleFileId = z.array(z.string()).length(1, 'Provide exactly 1 file')
const mediaGroupFileIds = z
  .array(z.string())
  .min(2, 'Provide at least 2 files')
  .max(10, 'Telegram albums support up to 10 files')

export const message = z.object({
  platform: z.literal('telegram'),
  caption: messageCaption,
  type: z.literal('message'),
})

export const photo = z.object({
  platform: z.literal('telegram'),
  caption: mediaCaption,
  fileIds: singleFileId,
  type: z.literal('photo'),
})

export const video = z.object({
  platform: z.literal('telegram'),
  caption: mediaCaption,
  fileIds: singleFileId,
  type: z.literal('video'),
})

export const mediaGroup = z.object({
  platform: z.literal('telegram'),
  caption: mediaCaption,
  fileIds: mediaGroupFileIds,
  type: z.literal('mediaGroup'),
})

const TelegramUnion = z.discriminatedUnion('type', [message, photo, video, mediaGroup])
export default TelegramUnion
