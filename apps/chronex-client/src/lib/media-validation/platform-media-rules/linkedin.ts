import { z } from 'zod'

// ─── Constants (in MB) ────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 20 // 20 MB
const MAX_VIDEO_SIZE = 200 // 200 MB

// ─── Aspect Ratios (official LinkedIn docs) ───────────────────────────────────
// Source: https://www.linkedin.com/help/lms/answer/a424737
// Images: no explicit API constraint
// Videos: 9:16 (0.5625) to 16:9 (1.7778)
const LI_VIDEO_MIN_RATIO = 9 / 16 // 0.5625 — 9:16 vertical
const LI_VIDEO_MAX_RATIO = 16 / 9 // 1.7778 — 16:9 horizontal

/** Parse an "x:y" aspect-ratio string into a decimal (x / y). */
function parseRatio(ar: string): number {
  const [w, h] = ar.split(':').map(Number)
  return w / h
}

// ─── Per-type rules ───────────────────────────────────────────────────────────

/** Single image post */
const image = z
  .array(
    z.object({
      url: z.string().min(1),
      type: z.literal('image'),
      size: z.number().positive().max(MAX_IMAGE_SIZE, 'LinkedIn images cannot exceed 20MB'),
      width: z
        .number()
        .int()
        .positive()
        .min(200, 'Minimum width is 200px')
        .max(7680, 'Maximum width is 7680px'),
      height: z
        .number()
        .int()
        .positive()
        .min(200, 'Minimum height is 200px')
        .max(4320, 'Maximum height is 4320px'),
      extension: z.enum(['jpg', 'jpeg', 'png', 'gif', 'webp']),
      aspectRatio: z
        .string()
        .regex(/^([1-9]\d*):([1-9]\d*)$/, 'Aspect ratio must be in W:H format'),
      duration: z.number().nullish(),
    }),
  )
  .length(1, 'LinkedIn image posts require exactly 1 image')

/** Single video post */
const video = z
  .array(
    z
      .object({
        url: z.string().min(1),
        type: z.literal('video'),
        size: z.number().positive().max(MAX_VIDEO_SIZE, 'LinkedIn videos cannot exceed 200MB'),
        width: z
          .number()
          .int()
          .positive()
          .min(256, 'Minimum width is 256px')
          .max(4096, 'Maximum width is 4096px'),
        height: z
          .number()
          .int()
          .positive()
          .min(144, 'Minimum height is 144px')
          .max(2304, 'Maximum height is 2304px'),
        duration: z
          .number()
          .positive()
          .min(3, 'LinkedIn videos must be at least 3 seconds')
          .max(600, 'LinkedIn videos must be at most 10 minutes'),
        extension: z.enum(['mp4', 'mov', 'avi', 'mkv', 'webm']),
        aspectRatio: z
          .string()
          .regex(/^([1-9]\d*):([1-9]\d*)$/, 'Aspect ratio must be in W:H format'),
      })
      .refine(
        (d) => {
          const ratio = parseRatio(d.aspectRatio)
          return ratio >= LI_VIDEO_MIN_RATIO && ratio <= LI_VIDEO_MAX_RATIO
        },
        {
          message: 'LinkedIn video aspect ratio must be between 9:16 and 16:9',
          path: ['aspectRatio'],
        },
      ),
  )
  .length(1, 'LinkedIn video posts require exactly 1 video')

/** Multi-asset post */
const MultiPost = z
  .array(
    z.discriminatedUnion('type', [
      z.object({
        url: z.string().min(1),
        type: z.literal('image'),
        size: z.number().positive().max(MAX_IMAGE_SIZE, 'LinkedIn images cannot exceed 20MB'),
        width: z.number().int().positive().min(200),
        height: z.number().int().positive().min(200),
        extension: z.enum(['jpg', 'jpeg', 'png', 'gif', 'webp']),
        aspectRatio: z.string().optional(),
        duration: z.number().nullish(),
      }),
      z.object({
        url: z.string().min(1),
        type: z.literal('video'),
        size: z.number().positive().max(MAX_VIDEO_SIZE, 'LinkedIn videos cannot exceed 200MB'),
        width: z.number().int().positive().min(256),
        height: z.number().int().positive().min(144),
        extension: z.enum(['mp4', 'mov', 'avi', 'mkv', 'webm']),
        aspectRatio: z.string().optional(),
        duration: z.number().positive().min(3).max(600),
      }),
    ]),
  )
  .min(1, 'LinkedIn multi-posts require at least 1 media item')
  .max(20, 'LinkedIn multi-posts support up to 20 media items')

// ─── Exported map ─────────────────────────────────────────────────────────────
export const linkedin = { image, video, MultiPost }
