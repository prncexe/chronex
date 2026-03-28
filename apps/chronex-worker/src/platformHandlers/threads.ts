import { getAuthToken } from '../utils/getAuthToken'
import { markProcessing, markPublished, markFailed } from '../utils/updatePostStatus'
import { fetchMedia, fetchMediaMany } from '../utils/media'
import type { Env, PlatformJobPayload } from '../index'

export interface ThreadsMetadata {
  caption: string
  fileIds: number[]
  type: 'text' | 'image' | 'video'
}

type AuthToken = Awaited<ReturnType<typeof getAuthToken>>

const THREADS_API = 'https://graph.threads.net/v1.0'

/**
 * Create a media container on Threads.
 *
 * POST /{user-id}/threads
 * Docs: https://developers.facebook.com/docs/threads/posts
 */
async function createContainer(
  token: AuthToken,
  body: Record<string, unknown>,
): Promise<{ id: string }> {
  const res = await fetch(`${THREADS_API}/${token.profileId}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Threads createContainer failed: ${err}`)
  }

  return res.json() as Promise<{ id: string }>
}

/**
 * Publish a previously created Threads container.
 *
 * POST /{user-id}/threads_publish
 */
async function publishContainer(token: AuthToken, creationId: string): Promise<{ id: string }> {
  const res = await fetch(`${THREADS_API}/${token.profileId}/threads_publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.accessToken}`,
    },
    body: JSON.stringify({ creation_id: creationId }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Threads publishContainer failed: ${err}`)
  }

  return res.json() as Promise<{ id: string }>
}

/**
 * Check if a Threads container has finished processing (for video).
 *
 * GET /{container-id}?fields=status
 * Returns: FINISHED | IN_PROGRESS | ERROR
 */
async function checkContainerStatus(token: AuthToken, containerId: string): Promise<string> {
  const res = await fetch(
    `${THREADS_API}/${containerId}?fields=status&access_token=${token.accessToken}`,
  )
  const data = (await res.json()) as { status: string }
  return data.status
}

/**
 * Re-enqueue a job with delay for status polling.
 */
async function enqueueStatusCheck(
  env: Env,
  payload: PlatformJobPayload,
  containerId: string,
  childContainerIds?: string[],
) {
  await env.CHRONEX_QUEUE_PRODUCER.send(
    {
      ...payload,
      phase: 'check_status',
      containerId,
      childContainerIds,
    },
    { delaySeconds: 10 },
  )
}

/**
 * Publish a TEXT-only post to Threads.
 *
 * Flow: create container (media_type=TEXT) → publish
 */
export const ThreadsText = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as ThreadsMetadata

  try {
    await markProcessing(db, payload.platformPostId)

    const token = await getAuthToken(db, payload.workspaceId, 'threads')

    const container = await createContainer(token, {
      media_type: 'TEXT',
      text: data.caption,
    })

    const result = await publishContainer(token, container.id)
    const response = await fetch(
      `${THREADS_API}/${result.id}?fields=permalink&access_token=${token.accessToken}`,
    )
    const res: Record<any, string> = await response.json()
    await markPublished(db, payload.platformPostId, result.id, res.permalink)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

/**
 * Publish an IMAGE post to Threads.
 *
 * Flow: create container (media_type=IMAGE) → publish
 */
export const ThreadsImage = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as ThreadsMetadata

  try {
    await markProcessing(db, payload.platformPostId)

    const token = await getAuthToken(db, payload.workspaceId, 'threads')
    const media = await fetchMedia(db, data.fileIds[0] ?? 0, env)

    const container = await createContainer(token, {
      media_type: 'IMAGE',
      image_url: media.url,
      text: data.caption,
    })

    const result = await publishContainer(token, container.id)
    const response = await fetch(
      `${THREADS_API}/${result.id}?fields=permalink&access_token=${token.accessToken}`,
    )
    const res: Record<any, string> = await response.json()
    await markPublished(db, payload.platformPostId, result.id, res.permalink)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

/**
 * Publish a VIDEO post to Threads.
 *
 * Phase 1 ("create"): create container (media_type=VIDEO) → re-enqueue for status
 * Phase 2 ("check_status"): check status →
 *   - FINISHED → publish → mark published
 *   - IN_PROGRESS → re-enqueue
 *   - ERROR → mark failed
 */
export const ThreadsVideo = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as ThreadsMetadata

  try {
    const token = await getAuthToken(db, payload.workspaceId, 'threads')

    if (payload.phase === 'check_status' && payload.containerId) {
      const status = await checkContainerStatus(token, payload.containerId)

      if (status === 'FINISHED') {
        const result = await publishContainer(token, payload.containerId)
        const response = await fetch(
          `${THREADS_API}/${result.id}?fields=permalink&access_token=${token.accessToken}`,
        )
        const res: Record<any, string> = await response.json()
        await markPublished(db, payload.platformPostId, result.id, res.permalink)
        return
      }

      if (status === 'ERROR') {
        await markFailed(
          db,
          payload.platformPostId,
          `Threads container ${payload.containerId} processing failed`,
        )
        return
      }

      await enqueueStatusCheck(env, payload, payload.containerId)
      return
    }

    await markProcessing(db, payload.platformPostId)

    const media = await fetchMedia(db, data.fileIds[0] ?? 0, env)

    const container = await createContainer(token, {
      media_type: 'VIDEO',
      video_url: media.url,
      text: data.caption,
    })

    await enqueueStatusCheck(env, payload, container.id)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

export const ThreadsCarousel = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as ThreadsMetadata

  try {
    const token = await getAuthToken(db, payload.workspaceId, 'threads')

    if (
      payload.phase === 'check_status' &&
      payload.childContainerIds?.length &&
      !payload.containerId
    ) {
      for (const containerId of payload.childContainerIds) {
        const status = await checkContainerStatus(token, containerId)
        if (status === 'ERROR') {
          await markFailed(db, payload.platformPostId, `Child container ${containerId} failed`)
          return
        }
        if (status === 'IN_PROGRESS') {
          await enqueueStatusCheck(env, payload, '', payload.childContainerIds)
          return
        }
      }

      const parentContainer = await createContainer(token, {
        media_type: 'CAROUSEL',
        text: data.caption,
        children: payload.childContainerIds.join(','),
      })

      await enqueueStatusCheck(env, payload, parentContainer.id, payload.childContainerIds)
      return
    }

    if (payload.phase === 'check_status' && payload.containerId) {
      const status = await checkContainerStatus(token, payload.containerId)
      if (status === 'ERROR') {
        await markFailed(
          db,
          payload.platformPostId,
          `Parent container ${payload.containerId} failed`,
        )
        return
      }
      if (status === 'IN_PROGRESS') {
        await enqueueStatusCheck(env, payload, payload.containerId, payload.childContainerIds)
        return
      }

      const result = await publishContainer(token, payload.containerId)
      const response = await fetch(
        `${THREADS_API}/${result.id}?fields=permalink&access_token=${token.accessToken}`,
      )
      const res: Record<any, string> = await response.json()
      await markPublished(db, payload.platformPostId, result.id, res.permalink)
      return
    }

    await markProcessing(db, payload.platformPostId)
    const media = await fetchMediaMany(db, data.fileIds, env)

    const childContainerIds: string[] = []
    for (const item of media) {
      const isVideo = item.type === 'video'
      const childContainer = await createContainer(token, {
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
        [isVideo ? 'video_url' : 'image_url']: item.url,
        is_carousel_item: true,
      })
      childContainerIds.push(childContainer.id)
    }

    await enqueueStatusCheck(env, payload, '', childContainerIds)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}
