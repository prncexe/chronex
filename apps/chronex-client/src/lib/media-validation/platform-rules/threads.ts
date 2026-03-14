import z from 'zod'

const captionMax500 = z.string().max(500, 'Threads captions cannot exceed 500 characters')
const descriptionMax10000 = z
  .string()
  .max(10000, 'Threads text attachments cannot exceed 10,000 characters')
  .optional()

const mediaIdsOneToTen = z
  .array(z.string())
  .min(1, 'Threads posts must include at least 1 media file')
  .max(10, 'Threads supports up to 10 media files per post')
const singleMediaId = z
  .array(z.string())
  .length(1, 'Threads videos must include exactly 1 media file')

export const text = z.object({
  platform: z.literal('threads'),
  caption: captionMax500,
  description: descriptionMax10000,
  type: z.literal('text'),
})

export const image = z.object({
  platform: z.literal('threads'),
  caption: captionMax500,
  fileIds: mediaIdsOneToTen,
  type: z.literal('image'),
})

export const video = z.object({
  platform: z.literal('threads'),
  caption: captionMax500,
  fileIds: singleMediaId,
  type: z.literal('video'),
})

export const carousel = z.object({
  platform: z.literal('threads'),
  caption: captionMax500,
  fileIds: mediaIdsOneToTen,
  type: z.literal('carousel'),
})

const ThreadsUnion = z.discriminatedUnion('type', [text, image, video, carousel])
export default ThreadsUnion
