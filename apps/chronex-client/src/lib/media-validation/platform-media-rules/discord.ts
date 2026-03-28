import { z } from 'zod'

// ─── Constants (in MB) ────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 25 // 25 MB (free tier cap)

// ─── Shared file item ─────────────────────────────────────────────────────────
const discordFileItem = z.object({
  url: z.string().min(1),
  type: z.enum(['image', 'video']),
  size: z.number().positive().max(MAX_FILE_SIZE, 'Discord attachments cannot exceed 25MB'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().nullish(),
  extension: z.string().min(1),
  aspectRatio: z.string().optional(),
})

// ─── Aspect Ratio ─────────────────────────────────────────────────────────────
// Discord: No official aspect ratio restrictions for file uploads (free tier).

// ─── Per-type rules ───────────────────────────────────────────────────────────

/** File-only upload (1–10 files) */
const file = z
  .array(discordFileItem)
  .min(1, 'Discord file uploads require at least 1 file')
  .max(10, 'Discord supports up to 10 attachments')

// ─── Exported map ─────────────────────────────────────────────────────────────
export const discord = { file }
