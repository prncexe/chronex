import { z } from "zod";

// ─── Constants (in MB) ────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 8; // 8 MB
const MAX_STORY_IMAGE = 30; // 30 MB
const MAX_REEL_SIZE = 100; // 100 MB
const MAX_STORY_VIDEO = 4096; // 4 GB

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gcd(a: number, b: number): number {
  a = Math.abs(Math.trunc(a));
  b = Math.abs(Math.trunc(b));
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}
export function normalizeAspectRatio(w: number, h: number): string {
  const g = gcd(w, h);
  return `${Math.trunc(w / g)}:${Math.trunc(h / g)}`;
}

// ─── Shared base object schemas (no refinements — safe to .omit()/.extend()) ──
const instagramImageBase = z.object({
  url: z.string().min(1),
  type: z.literal("image"),
  size: z
    .number()
    .positive()
    .max(MAX_IMAGE_SIZE, "Instagram images cannot exceed 8MB"),
  width: z
    .number()
    .int()
    .positive()
    .min(320, "Minimum width is 320px")
    .max(1440, "Maximum width is 1440px"),
  height: z.number().int().positive().min(320, "Minimum height is 320px"),
  extension: z.enum(["jpg", "jpeg", "png", "webp"]),
  aspectRatio: z
    .string()
    .regex(/^([1-9]\d*):([1-9]\d*)$/, "Aspect ratio must be in W:H format"),
  duration: z.number().nullish(),
});

const instagramVideoBase = z.object({
  url: z.string().min(1),
  type: z.literal("video"),
  size: z
    .number()
    .positive()
    .max(MAX_REEL_SIZE, "Instagram videos cannot exceed 100MB"),
  width: z
    .number()
    .int()
    .positive()
    .min(500, "Minimum width is 500px")
    .max(1920, "Maximum width is 1920px"),
  height: z.number().int().positive().min(889, "Minimum height is 889px"),
  duration: z
    .number()
    .positive()
    .min(3, "Must be at least 3 seconds")
    .max(120, "Must be at most 120 seconds"),
  extension: z.enum(["mp4", "mov"]),
  aspectRatio: z
    .string()
    .regex(/^([1-9]\d*):([1-9]\d*)$/, "Aspect ratio must be in W:H format"),
});

// ─── Refined items (used for single-item validation) ─────────────────────────
const instagramImageItem = instagramImageBase.refine(
  (d) => normalizeAspectRatio(d.width, d.height) === d.aspectRatio,
  { message: "aspectRatio does not match width/height", path: ["aspectRatio"] },
);

const instagramVideoItem = instagramVideoBase
  .refine((d) => normalizeAspectRatio(d.width, d.height) === d.aspectRatio, {
    message: "aspectRatio does not match width/height",
    path: ["aspectRatio"],
  })
  .refine((d) => d.aspectRatio === "9:16", {
    message: "Instagram reels must have a 9:16 aspect ratio",
    path: ["aspectRatio"],
  });

// ─── Per-type rules (each validates the array of file metadata) ───────────────

/** Single image post */
const image = z
  .array(instagramImageItem)

/** Reel — single 9:16 video */
const reel = z
  .array(instagramVideoItem)

/** Carousel — 2–10 images or videos (no strict 9:16 requirement) */
const carousel = z
  .array(z.union([instagramImageBase, instagramVideoBase]))


/** Story — single image or short video */
const story = z
  .array(
    z.discriminatedUnion("type", [
      z.object({
        url: z.string().min(1),
        type: z.literal("image"),
        size: z
          .number()
          .positive()
          .max(MAX_STORY_IMAGE, "Story images cannot exceed 30MB"),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        extension: z.enum(["jpg", "jpeg", "png", "webp"]),
        aspectRatio: z.string(),
        duration: z.number().nullish(),
      }),
      z.object({
        url: z.string().min(1),
        type: z.literal("video"),
        size: z
          .number()
          .positive()
          .max(MAX_STORY_VIDEO, "Story videos cannot exceed 4GB"),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        duration: z
          .number()
          .positive()
          .min(1, "Story videos must be at least 1 second")
          .max(60, "Story videos must be at most 60 seconds"),
        extension: z.enum(["mp4", "mov"]),
        aspectRatio: z.string(),
      }),
    ]),
  )
  .length(1, "Instagram stories require exactly 1 media file");

// ─── Exported map ─────────────────────────────────────────────────────────────
export const instagram = { image, reel, carousel, story };
