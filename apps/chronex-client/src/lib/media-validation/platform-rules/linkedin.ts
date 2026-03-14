import z from 'zod'

const captionMax3000 = z.string().max(3000, 'LinkedIn captions cannot exceed 3000 characters')
const singleMediaId = z
  .array(z.string())
  .length(1, 'LinkedIn supports exactly 1 media asset for this post type')
const multiMediaId = z
  .array(z.string())
  .min(1, 'LinkedIn supports at least 1 media asset for this post type')

export const image = z.object({
  platform: z.literal('linkedin'),
  caption: captionMax3000,
  fileIds: singleMediaId,
  type: z.literal('image'),
})

export const video = z.object({
  platform: z.literal('linkedin'),
  caption: captionMax3000,
  fileIds: singleMediaId,
  type: z.literal('video'),
})

export const multiPost = z.object({
  platform: z.literal('linkedin'),
  caption: captionMax3000,
  fileIds: multiMediaId,
  type: z.literal('MultiPost'),
})

export const text = z.object({
  platform: z.literal('linkedin'),
  caption: captionMax3000,
  type: z.literal('text'),
})

const LinkedInUnion = z.discriminatedUnion('type', [image, video, multiPost, text])
export default LinkedInUnion
