function parseLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const CLIENT_LIMITS = {
  maxWorkspaces: parseLimit(process.env.NEXT_PUBLIC_MAX_WORKSPACE, 999),
  maxPostsPerWorkspace: parseLimit(process.env.NEXT_PUBLIC_MAX_POSTS_PER_WORKSPACE, 999),
  maxMediaPerWorkspace: parseLimit(process.env.NEXT_PUBLIC_MAX_MEDIA_PER_WORKSPACE, 999),
  maxUploadSizeMB: parseLimit(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB, 50),
}
