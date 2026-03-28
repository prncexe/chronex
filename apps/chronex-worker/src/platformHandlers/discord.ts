import { getAuthToken } from '../utils/getAuthToken'
import { markProcessing, markPublished, markFailed } from '../utils/updatePostStatus'
import { fetchMediaMany } from '../utils/media'
import type { Env, PlatformJobPayload } from '../index'

export interface DiscordMetadata {
  caption: string
  fileIds: number[]
  channelId: string
  type: 'message' | 'embed' | 'file'
  embed?: DiscordEmbed
}

interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  image?: { url: string }
  thumbnail?: { url: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}

interface DiscordWebhookResponse {
  id: string
  token?: string
}

interface DiscordWebhookCreateResponse {
  id: string
  token: string
}

type AuthToken = Awaited<ReturnType<typeof getAuthToken>>

const DISCORD_API = 'https://discord.com/api/v10'

async function fetchAvatarAsDataURI(avatarUrl: string): Promise<string> {
  const res = await fetch(avatarUrl)
  if (!res.ok) throw new Error(`Failed to fetch avatar: ${res.statusText}`)

  const contentType = res.headers.get('content-type') ?? 'image/png'
  const buffer = await res.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))

  return `data:${contentType};base64,${base64}`
}

async function createWebhook(
  botToken: string,
  channelId: string,
  name: string,
  avatarUrl?: string,
): Promise<{ webhookUrl: string; webhookId: string; webhookToken: string }> {
  const avatar = avatarUrl ? await fetchAvatarAsDataURI(avatarUrl) : undefined

  const res = await fetch(`${DISCORD_API}/channels/${channelId}/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, avatar }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to create Discord webhook: ${err}`)
  }

  const data = (await res.json()) as DiscordWebhookCreateResponse
  return {
    webhookUrl: `${DISCORD_API}/webhooks/${data.id}/${data.token}`,
    webhookId: data.id,
    webhookToken: data.token,
  }
}

async function deleteWebhook(webhookId: string, webhookToken: string): Promise<void> {
  await fetch(`${DISCORD_API}/webhooks/${webhookId}/${webhookToken}`, {
    method: 'DELETE',
  })
}

async function executeWebhookJson(
  webhookUrl: string,
  body: Record<string, unknown>,
): Promise<DiscordWebhookResponse> {
  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Discord webhook (JSON) failed: ${err}`)
  }

  return res.json() as Promise<DiscordWebhookResponse>
}

async function executeWebhookMultipart(
  webhookUrl: string,
  jsonPayload: Record<string, unknown>,
  files: Array<{ name: string; mediaUrl: string }>,
): Promise<DiscordWebhookResponse> {
  const boundary = `----ChronexBoundary${Date.now()}`
  const encoder = new TextEncoder()

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  // Produce the multipart body asynchronously while fetch consumes it
  const writePromise = (async () => {
    try {
      // ── payload_json part ──────────────────────────────────────────────
      await writer.write(
        encoder.encode(
          `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="payload_json"\r\n` +
            `Content-Type: application/json\r\n\r\n` +
            JSON.stringify(jsonPayload) +
            `\r\n`,
        ),
      )

      // ── file parts — streamed from source ─────────────────────────────
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!

        // Fetch the file — read Content-Type from response headers, then
        // stream the body without ever buffering the whole file in memory.
        const res = await fetch(file.mediaUrl)
        if (!res.ok || !res.body) {
          throw new Error(
            `Failed to fetch file "${file.name}" from ${file.mediaUrl}: ${res.status}`,
          )
        }

        const contentType = res.headers.get('content-type') ?? 'application/octet-stream'

        // Part header
        await writer.write(
          encoder.encode(
            `--${boundary}\r\n` +
              `Content-Disposition: form-data; name="files[${i}]"; filename="${file.name}"\r\n` +
              `Content-Type: ${contentType}\r\n\r\n`,
          ),
        )

        // Pipe file body through
        const reader = res.body.getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }

        // CRLF after part body
        await writer.write(encoder.encode(`\r\n`))
      }

      // Closing boundary
      await writer.write(encoder.encode(`--${boundary}--\r\n`))
      await writer.close()
    } catch (err) {
      await writer.abort(err)
      throw err
    }
  })()

  // fetch consumes the readable stream concurrently with the writer
  const [res] = await Promise.all([
    fetch(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: readable,
      // @ts-expect-error — duplex required for streaming request body in Workers
      duplex: 'half',
    }),
    writePromise,
  ])

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Discord webhook (multipart) failed: ${err}`)
  }

  return res.json() as Promise<DiscordWebhookResponse>
}

export const DiscordMessage = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as DiscordMetadata

  let webhookId: string | undefined
  let webhookToken: string | undefined

  try {
    await markProcessing(db, payload.platformPostId)
    const token = await getAuthToken(db, payload.workspaceId, 'discord')

    const webhook = await createWebhook(
      env.DISCORD_BOT_TOKEN,
      data.channelId,
      env.DISCORD_WEBHOOK_NAME,
      env.DISCORD_WEBHOOK_AVATAR_URL,
    )
    webhookId = webhook.webhookId
    webhookToken = webhook.webhookToken

    const result = await executeWebhookJson(webhook.webhookUrl, {
      content: data.caption,
    })
    await markPublished(
      db,
      payload.platformPostId,
      result.id,
      `https://discord.com/channels/${token.profileId}/${data.channelId}/${result.id}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  } finally {
    if (webhookId && webhookToken) {
      await deleteWebhook(webhookId, webhookToken).catch(() => {})
    }
  }
}

export const DiscordEmbed = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as DiscordMetadata

  let webhookId: string | undefined
  let webhookToken: string | undefined

  try {
    await markProcessing(db, payload.platformPostId)
    const token = await getAuthToken(db, payload.workspaceId, 'discord')

    const webhook = await createWebhook(
      env.DISCORD_BOT_TOKEN,
      data.channelId,
      env.DISCORD_WEBHOOK_NAME,
      env.DISCORD_WEBHOOK_AVATAR_URL,
    )
    webhookId = webhook.webhookId
    webhookToken = webhook.webhookToken

    const embed: Record<string, unknown> = { ...data.embed }

    const result = await executeWebhookJson(webhook.webhookUrl, {
      embeds: [embed],
    })

    await markPublished(
      db,
      payload.platformPostId,
      result.id,
      `https://discord.com/channels/${token.profileId}/${data.channelId}/${result.id}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  } finally {
    if (webhookId && webhookToken) {
      await deleteWebhook(webhookId, webhookToken).catch(() => {})
    }
  }
}

export const DiscordFile = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)

  const data = payload.metadata as DiscordMetadata

  let webhookId: string | undefined
  let webhookToken: string | undefined

  try {
    await markProcessing(db, payload.platformPostId)
    const token = await getAuthToken(db, payload.workspaceId, 'discord')
    const webhook = await createWebhook(
      env.DISCORD_BOT_TOKEN,
      data.channelId,
      env.DISCORD_WEBHOOK_NAME,
      env.DISCORD_WEBHOOK_AVATAR_URL,
    )
    webhookId = webhook.webhookId
    webhookToken = webhook.webhookToken

    const mediaItems = await fetchMediaMany(db, data.fileIds, env)

    // Build lightweight file descriptors — no binary download, just URLs
    const files = mediaItems.map((item, idx) => {
      const urlPath = new URL(item.url).pathname
      let name = urlPath.split('/').pop() ?? `file_${idx}`
      // Ensure the filename has a proper extension so Discord renders it inline
      const ext = item.extension ?? 'bin'
      if (!name.includes('.')) {
        name = `${name}.${ext}`
      }
      return { name, mediaUrl: item.url }
    })

    const result = await executeWebhookMultipart(
      webhook.webhookUrl,
      { content: data.caption || undefined },
      files,
    )

    await markPublished(
      db,
      payload.platformPostId,
      result.id,
      `https://discord.com/channels/${token.profileId}/${data.channelId}/${result.id}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  } finally {
    if (webhookId && webhookToken) {
      await deleteWebhook(webhookId, webhookToken).catch(() => {})
    }
  }
}
