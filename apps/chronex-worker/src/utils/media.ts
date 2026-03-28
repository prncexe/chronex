import { DB } from '@repo/db'
import { eq, postMedia } from '@repo/db'
import { getBackblazeSignedUrl, getBackblazeSignedUrlForFileName } from '../config/backBlaze'
import type { Env } from '../index'

function buildCachedMediaUrl(
  name: string,
  downloadToken: string,
  env: Pick<Env, 'B2_DOWNLOAD_URL'>,
) {
  const rawBaseUrl = env.B2_DOWNLOAD_URL

  if (!rawBaseUrl) {
    return null
  }

  try {
    const baseUrl = new URL(rawBaseUrl).toString().replace(/\/$/, '')
    return `${baseUrl}/file/chronex/${name}?Authorization=${encodeURIComponent(downloadToken)}`
  } catch {
    return null
  }
}

export async function fetchMedia(
  db: DB,
  fileId: number,
  env: Pick<Env, 'B2_BUCKET_ID' | 'B2_DOWNLOAD_URL'>,
) {
  const media = await db.query.postMedia.findFirst({
    where: (m, { eq }) => eq(m.id, fileId),
    columns: {
      id: true,
      name: true,
      url: true,
      type: true,
      size: true,
      extension: true,
      downloadToken: true,
      expiresAt: true,
    },
  })

  if (!media) {
    throw new Error(`Media not found for fileId ${fileId}`)
  }

  const isCachedTokenFresh =
    Boolean(media.downloadToken) &&
    Boolean(media.expiresAt) &&
    media.expiresAt!.getTime() > Date.now() + 60 * 1000

  if (isCachedTokenFresh) {
    const cachedUrl = buildCachedMediaUrl(media.name, media.downloadToken!, env)
    if (cachedUrl) {
      return { ...media, url: cachedUrl }
    }
  }

  let signedUrl: string
  let downloadToken: string

  try {
    const signed = await getBackblazeSignedUrl(media.url, env.B2_BUCKET_ID, env)
    signedUrl = signed.url
    downloadToken = signed.downloadToken
  } catch {
    const signed = await getBackblazeSignedUrlForFileName(media.name, env.B2_BUCKET_ID, env)
    signedUrl = signed.url
    downloadToken = signed.downloadToken
  }

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await db
    .update(postMedia)
    .set({
      downloadToken,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(postMedia.id, media.id))

  return { ...media, url: signedUrl, downloadToken, expiresAt }
}

export async function fetchMediaMany(
  db: DB,
  fileIds: number[],
  env: Pick<Env, 'B2_BUCKET_ID' | 'B2_DOWNLOAD_URL'>,
) {
  const mediaItems = await Promise.all(fileIds.map((id) => fetchMedia(db, id, env)))
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
