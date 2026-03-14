import z from 'zod'
import {
  instagram,
  linkedin,
  threads,
  slack,
  discord,
} from '@/lib/media-validation/platform-rules/combined'
export const platformSchema = z.enum(['discord', 'slack', 'linkedin', 'instagram', 'threads'])
const platformDataSchema = z.discriminatedUnion('platform', [
  instagram,
  linkedin,
  threads,
  slack,
  discord,
])
const PlatformDataArraySchema = z.array(platformDataSchema)

export const InputSchema = z
  .object({
    title: z.string(),
    content: z.array(z.string()),
    platforms: z
      .array(platformSchema)
      .min(1)
      .refine((arr) => new Set(arr).size === arr.length, {
        message: 'Duplicate platforms are not allowed',
      }),
    scheduledAt: z.date(),
    platformdata: PlatformDataArraySchema.min(
      1,
      'Provide at least one platform data entry',
    ).superRefine((arr, ctx) => {
      const seen = new Set<string>()

      arr.forEach((item, index) => {
        if (seen.has(item.platform)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate platform: ${item.platform}`,
            path: [index, 'platform'],
          })
        }
        seen.add(item.platform)
      })
    }),
  })
  .superRefine((data, ctx) => {
    const selected = new Set(data.platforms)

    for (const item of data.platformdata) {
      if (!selected.has(item.platform)) {
        ctx.addIssue({
          code: 'custom',
          message: `Platform data provided for unselected platform: ${item.platform}`,
        })
      }
    }
  })

export type platformSchema = z.infer<typeof PlatformDataArraySchema>
