import { DB } from '@repo/db'
import { getBackblazeSignedUrl } from '../config/backBlaze'

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

export async function fetchMediaMany(db: DB, fileIds: number[]) {
  const mediaItems = await Promise.all(fileIds.map((id) => fetchMedia(db, id)))
  return mediaItems
}

export async function downloadMediaBinary(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download media from ${url}: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = await res.arrayBuffer()

  return { buffer, contentType, size: buffer.byteLength }
}

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
