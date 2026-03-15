import { CF_BASE } from '../constants/url'
function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const queueId = process.env.CLOUDFLARE_QUEUE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !queueId || !apiToken) {
    throw new Error(
      'Missing Cloudflare Queue env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_QUEUE_ID, CLOUDFLARE_API_TOKEN',
    )
  }

  return { accountId, queueId, apiToken }
}

// ─── Verify Queue Exists ──────────────────────────────────────────────────────
export async function verifyQueueConnection(): Promise<{
  success: boolean
  queueName?: string
  error?: string
}> {
  try {
    const { accountId, queueId, apiToken } = getConfig()
    const url = `${CF_BASE}/accounts/${accountId}/queues/${queueId}`

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = (await res.json()) as {
      success: boolean
      errors: Array<{ code: number; message: string }>
      result?: {
        queue_id: string
        queue_name: string
        consumers_total_count: number
      }
    }

    if (!data.success) {
      console.error('[CloudflareQueue] Queue verification failed', {
        errors: data.errors,
        status: res.status,
      })
      return {
        success: false,
        error: data.errors.map((e) => e.message).join('; '),
      }
    }

    console.log('[CloudflareQueue] Queue verified', {
      queueId: data.result?.queue_id,
      queueName: data.result?.queue_name,
      consumersCount: data.result?.consumers_total_count,
    })

    if (data.result?.consumers_total_count === 0) {
      console.warn(
        '[CloudflareQueue] ⚠️ NO CONSUMERS BOUND TO QUEUE - messages will not be processed!',
      )
    }

    return { success: true, queueName: data.result?.queue_name }
  } catch (error) {
    console.error('[CloudflareQueue] Queue verification error', error)
    return { success: false, error: String(error) }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueMessage<T = unknown> {
  body: T
  /** Optional content type. Default: "json" */
  content_type?: 'json' | 'text' | 'bytes'
  /** Delay in seconds before the message becomes visible to consumers (max 43200 = 12h) */
  delay_seconds?: number
}

export interface PlatformJobPayload {
  postId: number
  platformPostId: number
  platform: string
  workspaceId: number
  scheduledAt: string // ISO string
  metadata: unknown
}

interface CloudflareApiResponse {
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: Array<{ code: number; message: string }>
  result: unknown
}

export async function sendToQueue<T = unknown>(
  messages: QueueMessage<T>[],
): Promise<CloudflareApiResponse> {
  const { accountId, queueId, apiToken } = getConfig()

  const url = `${CF_BASE}/accounts/${accountId}/queues/${queueId}/messages/batch`

  const requestBody = { messages }

  const startTime = performance.now()

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const duration = performance.now() - startTime
  const rawText = await res.text()

  let data: CloudflareApiResponse
  try {
    data = JSON.parse(rawText) as CloudflareApiResponse
  } catch {
    console.error('[CloudflareQueue] Failed to parse response as JSON')
    throw new Error(`Cloudflare Queue error: Invalid JSON response - ${rawText}`)
  }

  console.log('[CloudflareQueue] Response received', {
    success: data.success,
    status: res.status,
    durationMs: Math.round(duration),
    result: data.result,
    timestamp: new Date().toISOString(),
  })

  if (!data.success) {
    const errMsg = data.errors.map((e) => e.message).join('; ')
    console.error('[CloudflareQueue] Queue push failed', {
      errors: data.errors,
      messages: data.messages,
      status: res.status,
      url,
    })
    throw new Error(`Cloudflare Queue error: ${errMsg}`)
  }

  if (data.messages?.length > 0) {
    console.log('[CloudflareQueue] API messages:', data.messages)
  }

  return data
}

export async function queuePlatformJob(
  job: PlatformJobPayload,
  delaySeconds?: number,
): Promise<CloudflareApiResponse> {
  const message: QueueMessage<PlatformJobPayload> = {
    body: job,
    content_type: 'json',
    ...(delaySeconds != null && delaySeconds > 0
      ? { delay_seconds: Math.min(delaySeconds, 43200) }
      : {}),
  }

  try {
    const result = await sendToQueue([message])
    console.log('[CloudflareQueue] Platform job queued successfully', {
      platformPostId: job.platformPostId,
    })
    return result
  } catch (error) {
    console.error('[CloudflareQueue] Failed to queue platform job', {
      postId: job.postId,
      platformPostId: job.platformPostId,
      platform: job.platform,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
