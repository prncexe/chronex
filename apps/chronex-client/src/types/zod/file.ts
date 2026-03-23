import { z } from 'zod'
export const fileInfo = z.object({
  contentLength: z.number(),
  contentType: z.string(),
  fileId: z.string(),
  fileInfo: z.object({
    height: z.string(),
    width: z.string(),
    duration: z.string().optional(),
    fileName: z.string(),
  }),
})
export type FileInfo = z.infer<typeof fileInfo>
