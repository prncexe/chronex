import { DB } from '@repo/db'
import { getBackblazeSignedUrl } from '../config/backBlaze'

/**
 * Fetch a single media row from DB by id.
 * Replaces raw URL with a temporary signed URL.
 */
export async function fetchMedia(db: DB, fileId: number) {
  const media = await db.query.postMedia.findFirst({
    where: (m, { eq }) => eq(m.id, fileId),
    columns: { url: true, type: true, size: true, extension: true },
  })

  if (!media) {
    throw new Error(`Media not found for fileId ${fileId}`)
  }

  const signedUrl = await getBackblazeSignedUrl(media.url, 'bf1f4b8f41d7955d97cc051c')
  return { ...media, url: signedUrl }
}

/**
 * Fetch multiple media rows by ids (preserves order).
 * Replaces raw URLs with temporary signed URLs.
 */
export async function fetchMediaMany(db: DB, fileIds: number[]) {
  const mediaItems = await Promise.all(fileIds.map((id) => fetchMedia(db, id)))
  return mediaItems
}

/**
 * Download media from its URL and return it as an ArrayBuffer + metadata.
 * This is used by platforms that require binary upload (LinkedIn, Discord, Slack).
 */
export async function downloadMediaBinary(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download media from ${url}: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = await res.arrayBuffer()

  return { buffer, contentType, size: buffer.byteLength }
}

/**
 * Download media from URL and return a ReadableStream for streamed uploading.
 * Uses the response body directly without buffering the whole file in memory.
 */
export async function streamMedia(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download media from ${url}: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const contentLength = res.headers.get('content-length')

  if (!res.body) {
    throw new Error('No response body available for streaming')
  }

  return {
    body: res.body,
    contentType,
    contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
  }
}
