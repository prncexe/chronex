import { z } from "zod";

// ─── Constants (in MB) ────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 5; // 5 MB
const MAX_VIDEO_SIZE = 200; // 200 MB
const MAX_DOCUMENT_SIZE = 100; // 100 MB

// ─── Per-type rules ───────────────────────────────────────────────────────────

/** Single image post */
const image = z
  .array(
    z.object({
      url: z.string().min(1),
      type: z.literal("image"),
      size: z
        .number()
        .positive()
        .max(MAX_IMAGE_SIZE, "LinkedIn images cannot exceed 5MB"),
      width: z
        .number()
        .int()
        .positive()
        .min(200, "Minimum width is 200px")
        .max(7680, "Maximum width is 7680px"),
      height: z
        .number()
        .int()
        .positive()
        .min(200, "Minimum height is 200px")
        .max(4320, "Maximum height is 4320px"),
      extension: z.enum(["jpg", "jpeg", "png", "gif"]),
      aspectRatio: z.string(),
      duration: z.number().nullish(),
    }),
  )
  

/** Single video post */
const video = z
  .array(
    z.object({
      url: z.string().min(1),
      type: z.literal("video"),
      size: z
        .number()
        .positive()
        .max(MAX_VIDEO_SIZE, "LinkedIn videos cannot exceed 200MB"),
      width: z
        .number()
        .int()
        .positive()
        .min(256, "Minimum width is 256px")
        .max(4096, "Maximum width is 4096px"),
      height: z
        .number()
        .int()
        .positive()
        .min(144, "Minimum height is 144px")
        .max(2304, "Maximum height is 2304px"),
      duration: z
        .number()
        .positive()
        .min(3, "LinkedIn videos must be at least 3 seconds")
        .max(600, "LinkedIn videos must be at most 10 minutes"),
      extension: z.enum(["mp4", "mov", "avi", "mkv", "webm"]),
      aspectRatio: z.string(),
    }),
  )
  

/** Multi-image / document post */
const MultiPost = z
  .array(
    z.object({
      url: z.string().min(1),
      type: z.enum(["image", "video"]),
      size: z
        .number()
        .positive()
        .max(MAX_DOCUMENT_SIZE, "LinkedIn document files cannot exceed 100MB"),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      extension: z.enum([
        "jpg",
        "jpeg",
        "png",
        "gif",
        "pdf",
        "ppt",
        "pptx",
        "doc",
        "docx",
      ]),
      aspectRatio: z.string().optional(),
      duration: z.number().nullish(),
    }),
  )

// ─── Exported map ─────────────────────────────────────────────────────────────
export const linkedin = { image, video, MultiPost };
