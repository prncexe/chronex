import { z } from 'zod'

const PHOTO_MAX_SIZE_MB = 10
const VIDEO_MAX_SIZE_MB = 50

const telegramImageItem = z.object({
  url: z.string().min(1),
  type: z.literal('image'),
  size: z.number().positive().max(PHOTO_MAX_SIZE_MB, 'Telegram photos cannot exceed 10MB'),
  width: z.number().int().positive().min(100, 'Images must be at least 100px wide'),
  height: z.number().int().positive().min(100, 'Images must be at least 100px tall'),
  duration: z.number().nullish(),
  extension: z.enum(['jpg', 'jpeg', 'png', 'webp']),
  aspectRatio: z.string().optional(),
})

const telegramVideoItem = z.object({
  url: z.string().min(1),
  type: z.literal('video'),
  size: z.number().positive().max(VIDEO_MAX_SIZE_MB, 'Telegram videos cannot exceed 50MB'),
  width: z.number().int().positive().min(160, 'Videos must be at least 160px wide'),
  height: z.number().int().positive().min(160, 'Videos must be at least 160px tall'),
  duration: z
    .number()
    .positive()
    .min(1, 'Telegram videos must be at least 1 second')
    .max(600, 'Telegram videos must be at most 10 minutes'),
  extension: z.enum(['mp4', 'mov', 'webm', 'm4v']),
  aspectRatio: z.string().optional(),
})

const photo = z.array(telegramImageItem).length(1, 'Telegram photo posts require exactly 1 image')
const video = z.array(telegramVideoItem).length(1, 'Telegram video posts require exactly 1 video')
const mediaGroup = z
  .array(z.union([telegramImageItem, telegramVideoItem]))
  .min(2, 'Telegram albums require at least 2 files')
  .max(10, 'Telegram albums support up to 10 files')

export const telegram = { photo, video, mediaGroup }
