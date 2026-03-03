import { z } from "zod";

// ─── Constants (in MB) ────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10; // 10 MB (free tier cap)

// ─── Shared file item ─────────────────────────────────────────────────────────
const discordFileItem = z.object({
  url: z.string().min(1),
  type: z.enum(["image", "video"]),
  size: z
    .number()
    .positive()
    .max(MAX_FILE_SIZE, "Discord attachments cannot exceed 10MB"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().nullish(),
  extension: z.string().min(1),
  aspectRatio: z.string().optional(),
});

// ─── Per-type rules ───────────────────────────────────────────────────────────



/** File-only upload (1–10 files) */
const file = z
  .array(discordFileItem)

// ─── Exported map ─────────────────────────────────────────────────────────────
export const discord = { file };
