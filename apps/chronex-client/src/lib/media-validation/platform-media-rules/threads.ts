import { z } from "zod";

// ─── Constants (in MB) ────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 8; // 8 MB per image
const MAX_VIDEO_SIZE = 100; // 100 MB

// ─── Per-type rules ───────────────────────────────────────────────────────────

/** 1–10 images */
const image = z
  .array(
    z.object({
      url: z.string().min(1),
      type: z.literal("image"),
      size: z
        .number()
        .positive()
        .max(MAX_IMAGE_SIZE, "Threads images cannot exceed 8MB"),
      width: z
        .number()
        .int()
        .positive()
        .min(320, "Minimum width is 320px")
        .max(4096, "Maximum width is 4096px"),
      height: z
        .number()
        .int()
        .positive()
        .min(320, "Minimum height is 320px")
        .max(4096, "Maximum height is 4096px"),
      extension: z.enum(["jpg", "jpeg", "png", "webp"]),
      aspectRatio: z.string(),
      duration: z.number().nullish(),
    }),
  )


/** Single video */
const video = z
  .array(
    z.object({
      url: z.string().min(1),
      type: z.literal("video"),
      size: z
        .number()
        .positive()
        .max(MAX_VIDEO_SIZE, "Threads videos cannot exceed 100MB"),
      width: z
        .number()
        .int()
        .positive()
        .min(360, "Minimum width is 360px")
        .max(1920, "Maximum width is 1920px"),
      height: z
        .number()
        .int()
        .positive()
        .min(360, "Minimum height is 360px")
        .max(1920, "Maximum height is 1920px"),
      duration: z
        .number()
        .positive()
        .min(1, "Threads videos must be at least 1 second")
        .max(300, "Threads videos must be at most 5 minutes"),
      extension: z.enum(["mp4", "mov"]),
      aspectRatio: z.string(),
    }),
  )
 

// ─── Exported map ─────────────────────────────────────────────────────────────
export const threads = { image, video };
