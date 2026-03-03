import { z } from "zod";

// ─── Constants (in MB) ────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 1024; // 1 GB per file

// ─── Shared file item ─────────────────────────────────────────────────────────
const slackFileItem = z.object({
  url: z.string().min(1),
  type: z.enum(["image", "video"]),
  size: z
    .number()
    .positive()
    .max(MAX_FILE_SIZE, "Slack files cannot exceed 1GB"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().nullish(),
  extension: z.enum([
    // Images
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
    // Videos
    "mp4",
    "mov",
    "avi",
    "mkv",
    "webm",
    "m4v",
    "flv",
    // Documents (Slack supports file uploads)
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "csv",
    "zip",
    "rar",
  ]),
  aspectRatio: z.string().optional(),
});

// ─── Per-type rules ───────────────────────────────────────────────────────────

/** Message with optional file attachments (1–10) */

/** File-only upload (1–10 files) */
const file = z.array(slackFileItem);

// ─── Exported map ─────────────────────────────────────────────────────────────
export const slack = { file };
