import { z } from 'zod'
export const fileInfo = z.object({
  contentLength: z.number(),
  contentType: z.string(),
  fileId: z.string(),
  fileInfo: z.object({
    height: z.number(),
    width: z.number(),
    duration: z.number().optional(),
  }),
})
export type FileInfo = z.infer<typeof fileInfo>
