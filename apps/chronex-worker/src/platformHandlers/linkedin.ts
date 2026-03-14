import { getAuthToken } from '../utils/getAuthToken'
import { markProcessing, markPublished, markFailed } from '../utils/updatePostStatus'
import { fetchMedia, fetchMediaMany, streamMedia } from '../utils/media'
import type { Env, PlatformJobPayload } from '../index'

export interface LinkedInMetadata {
  caption: string
  fileIds: number[]
  type: 'text' | 'image' | 'video' | 'MultiPost'
}

type AuthToken = Awaited<ReturnType<typeof getAuthToken>>

const LI_API = 'https://api.linkedin.com/rest'

function authHeaders(token: AuthToken) {
  return {
    Authorization: `Bearer ${token.accessToken}`,
    'LinkedIn-Version': '202602',
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

/**
 * Initialize an image upload via LinkedIn's Vector Assets API.
 * Returns the uploadUrl and the image asset URN.
 *
 * POST https://api.linkedin.com/rest/images?action=initializeUpload
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
 */
async function initImageUpload(token: AuthToken) {
  const res = await fetch(`${LI_API}/images?action=initializeUpload`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: `urn:li:person:${token.profileId}`,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn initImageUpload failed: ${err}`)
  }

  const data = (await res.json()) as {
    value: { uploadUrl: string; image: string; uploadToken: string }
  }

  return {
    uploadUrl: data.value.uploadUrl,
    imageUrn: data.value.image,
    uploadToken: data.value.uploadToken,
  }
}

/**
 * Initialize a video upload via LinkedIn's Video API.
 * Returns the uploadUrl(s) and the video asset URN.
 *
 * POST https://api.linkedin.com/rest/videos?action=initializeUpload
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api
 */
async function initVideoUpload(token: AuthToken, fileSizeBytes: number) {
  const res = await fetch(`${LI_API}/videos?action=initializeUpload`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: `urn:li:person:${token.profileId}`,
        fileSizeBytes,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn initVideoUpload failed: ${err}`)
  }

  const data = (await res.json()) as {
    value: {
      uploadInstructions: Array<{ uploadUrl: string }>
      video: string
      uploadToken: string
    }
  }

  return {
    uploadUrl: data.value.uploadInstructions[0]?.uploadUrl ?? '',
    videoUrn: data.value.video,
    uploadToken: data.value.uploadToken ?? '',
  }
}

async function uploadBinaryStream(
  uploadUrl: string,
  mediaUrl: string,
  token: AuthToken,
): Promise<string | null> {
  const { body, contentType, contentLength } = await streamMedia(mediaUrl)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token.accessToken}`,
    'Content-Type': contentType,
  }
  if (contentLength) {
    headers['Content-Length'] = String(contentLength)
  }

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body,
    // @ts-expect-error — duplex required for streaming request body in fetch

    duplex: 'half',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn binary upload failed: ${err}`)
  }

  return res.headers.get('etag')
}

/**
 * Finalize a video upload on LinkedIn.
 *
 * This MUST be called after all parts have been uploaded. Without this step,
 * LinkedIn never processes the video and any post referencing it will be invisible.
 *
 * POST https://api.linkedin.com/rest/videos?action=finalizeUpload
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api
 */
async function finalizeVideoUpload(
  token: AuthToken,
  videoUrn: string,
  uploadToken: string,
  uploadedPartIds: string[],
) {
  const res = await fetch(`${LI_API}/videos?action=finalizeUpload`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      finalizeUploadRequest: {
        video: videoUrn,
        uploadToken,
        uploadedPartIds,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn finalizeVideoUpload failed: ${err}`)
  }
}

/**
 * Create a UGC post on LinkedIn.
 *
 * POST https://api.linkedin.com/rest/posts
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
 */
async function createPost(token: AuthToken, body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${LI_API}/posts`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn createPost failed: ${err}`)
  }

  const postUrn = res.headers.get('x-restli-id') ?? ''
  return postUrn
}

/**
 * Publish a TEXT-only post on LinkedIn.
 *
 * Flow: POST /posts with commentary only.
 */
export const LinkedInText = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as LinkedInMetadata

  try {
    await markProcessing(db, payload.platformPostId)

    const token = await getAuthToken(db, payload.workspaceId, 'linkedin')

    const postUrn = await createPost(token, {
      author: `urn:li:person:${token.profileId}`,
      commentary: data.caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
      },
      lifecycleState: 'PUBLISHED',
    })

    await markPublished(
      db,
      payload.platformPostId,
      postUrn,
      `https://www.linkedin.com/feed/update/${postUrn}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

/**
 * Publish a single IMAGE post on LinkedIn.
 *
 * Flow: initImageUpload → stream binary to uploadUrl → createPost with image URN.
 */
export const LinkedInImage = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as LinkedInMetadata

  try {
    await markProcessing(db, payload.platformPostId)

    const token = await getAuthToken(db, payload.workspaceId, 'linkedin')
    const media = await fetchMedia(db, data.fileIds[0] ?? 0)

    const { uploadUrl, imageUrn } = await initImageUpload(token)

    await uploadBinaryStream(uploadUrl, media.url, token)

    const postUrn = await createPost(token, {
      author: `urn:li:person:${token.profileId}`,
      commentary: data.caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
      },
      content: {
        media: {
          id: imageUrn,
        },
      },
      lifecycleState: 'PUBLISHED',
    })

    await markPublished(
      db,
      payload.platformPostId,
      postUrn,
      `https://www.linkedin.com/feed/update/${postUrn}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

export const LinkedInVideo = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as LinkedInMetadata

  try {
    await markProcessing(db, payload.platformPostId)

    const token = await getAuthToken(db, payload.workspaceId, 'linkedin')

    const media = await fetchMedia(db, data.fileIds[0] ?? 0)

    const headRes = await fetch(media.url, { method: 'HEAD' })

    const contentLength = parseInt(headRes.headers.get('content-length') ?? '0', 10)

    if (!contentLength) {
      throw new Error('Could not determine video file size from media URL')
    }

    const { uploadUrl, videoUrn, uploadToken } = await initVideoUpload(token, contentLength)

    const etag = await uploadBinaryStream(uploadUrl, media.url, token)

    await finalizeVideoUpload(token, videoUrn, uploadToken, etag ? [etag] : [])

    const postUrn = await createPost(token, {
      author: `urn:li:person:${token.profileId}`,
      commentary: data.caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
      },
      content: {
        media: {
          id: videoUrn,
        },
      },
      lifecycleState: 'PUBLISHED',
    })

    await markPublished(
      db,
      payload.platformPostId,
      postUrn,
      `https://www.linkedin.com/feed/update/${postUrn}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[LinkedInVideo] failed', {
      platformPostId: payload.platformPostId,
      workspaceId: payload.workspaceId,
      error: msg,
      stack: error instanceof Error ? error.stack : undefined,
    })
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

/**
 * Publish a MULTI-IMAGE post on LinkedIn.
 *
 * Flow: For each image → initImageUpload + stream binary.
 *       Then createPost with multiple image URNs in content.multiImage.
 *
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/multiimage-post-api
 */
export const LinkedInMultiPost = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as LinkedInMetadata

  try {
    await markProcessing(db, payload.platformPostId)

    const token = await getAuthToken(db, payload.workspaceId, 'linkedin')
    const mediaItems = await fetchMediaMany(db, data.fileIds)

    const imageUrns: string[] = []
    for (const item of mediaItems) {
      const { uploadUrl, imageUrn } = await initImageUpload(token)
      await uploadBinaryStream(uploadUrl, item.url, token)
      imageUrns.push(imageUrn)
    }

    const postUrn = await createPost(token, {
      author: `urn:li:person:${token.profileId}`,
      commentary: data.caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
      },
      content: {
        multiImage: {
          images: imageUrns.map((urn) => ({ id: urn })),
        },
      },
      lifecycleState: 'PUBLISHED',
    })

    await markPublished(
      db,
      payload.platformPostId,
      postUrn,
      `https://www.linkedin.com/feed/update/${postUrn}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}
