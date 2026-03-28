import { createDb, workspace, platformPosts, post, eq, and, lte, inArray } from '@repo/db'

export interface PlatformJobPayload {
  postId: number
  platformPostId: number
  platform: 'instagram' | 'linkedin' | 'threads' | 'discord' | 'slack' | 'telegram'
  workspaceId: number
  scheduledAt: string
  metadata?: unknown
  phase?: 'create' | 'check_status'
  containerId?: string
  childContainerIds?: string[]
}

export interface Env {
  ENVIRONMENT: string
  DATABASE_URL: string
  DISCORD_BOT_TOKEN: string
  CHRONEX_QUEUE_PRODUCER: Queue
  DISCORD_WEBHOOK_NAME: string
  DISCORD_WEBHOOK_AVATAR_URL: string
  B2_BUCKET_ID: string
  B2_DOWNLOAD_URL: string
}

import {
  InstagramImage,
  InstagramReel,
  InstagramCarousel,
  InstagramStory,
} from './platformHandlers/instagram'

import {
  LinkedInText,
  LinkedInImage,
  LinkedInVideo,
  LinkedInMultiPost,
} from './platformHandlers/linkedin'

import {
  ThreadsText,
  ThreadsImage,
  ThreadsVideo,
  ThreadsCarousel,
} from './platformHandlers/threads'

import { DiscordMessage, DiscordEmbed, DiscordFile } from './platformHandlers/discord'

import { SlackMessage, SlackFile } from './platformHandlers/slack'
import {
  TelegramMessage,
  TelegramPhoto,
  TelegramVideo,
  TelegramMediaGroup,
} from './platformHandlers/telegram'
import { decideStatus } from './decideStatus'

type PostHandler = (payload: PlatformJobPayload, env: Env) => Promise<void>

const handlerRegistry: Record<string, Record<string, PostHandler>> = {
  instagram: {
    image: InstagramImage,
    reel: InstagramReel,
    carousel: InstagramCarousel,
    story: InstagramStory,
  },
  linkedin: {
    text: LinkedInText,
    image: LinkedInImage,
    video: LinkedInVideo,
    MultiPost: LinkedInMultiPost,
  },
  threads: {
    text: ThreadsText,
    image: ThreadsImage,
    video: ThreadsVideo,
    carousel: ThreadsCarousel,
  },
  discord: {
    message: DiscordMessage,
    embed: DiscordEmbed,
    file: DiscordFile,
  },
  slack: {
    message: SlackMessage,
    file: SlackFile,
  },
  telegram: {
    message: TelegramMessage,
    photo: TelegramPhoto,
    video: TelegramVideo,
    mediaGroup: TelegramMediaGroup,
  },
}

async function processJob(job: PlatformJobPayload, env: Env): Promise<void> {
  const platformHandlers = handlerRegistry[job.platform]
  if (!platformHandlers) {
    throw new Error(`Unsupported platform: ${job.platform}`)
  }

  const contentType = (job.metadata as { type?: string })?.type ?? ''
  const handler = platformHandlers[contentType]
  if (!handler) {
    throw new Error(`Unsupported content type "${contentType}" for platform "${job.platform}"`)
  }

  await handler(job, env)
}

export default {
  async queue(
    batch: MessageBatch<PlatformJobPayload>,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    for (const message of batch.messages) {
      const job = message.body
      try {
        await processJob(job, env)
        console.log(`process finish acknowledgement`)
        message.ack()
      } catch (error) {
        console.error(`Failed to process job postId=${job.postId} platform=${job.platform}:`, error)
      } finally {
        await decideStatus(createDb(env.DATABASE_URL), job.postId, job.platform)
      }
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const db = createDb(env.DATABASE_URL)

    const now = new Date()
    const horizon = new Date(now.getTime() + 12 * 60 * 60 * 1000)

    const rows = await db
      .select({
        platformPostId: platformPosts.id,
        postId: platformPosts.postId,
        platform: platformPosts.platform,
        scheduledAt: platformPosts.scheduledAt,
        metadata: platformPosts.metadata,
      })
      .from(platformPosts)
      .innerJoin(post, eq(platformPosts.postId, post.id))
      .where(and(eq(platformPosts.status, 'pending'), lte(platformPosts.scheduledAt, horizon)))

    if (rows.length === 0) {
      console.log('Cron: no posts to enqueue.')
      return
    }

    const postIds = [...new Set(rows.map((r) => r.postId))]
    const posts = await db
      .select({ id: post.id, workspaceId: post.workspaceId })
      .from(post)
      .where(inArray(post.id, postIds))
    const workspaceMap = new Map(posts.map((p) => [p.id, p.workspaceId]))

    let enqueued = 0

    for (const row of rows) {
      const workspaceId = workspaceMap.get(row.postId)
      if (!workspaceId) {
        console.warn(`Cron: no workspace found for postId=${row.postId}, skipping.`)
        continue
      }

      const payload: PlatformJobPayload = {
        postId: row.postId,
        platformPostId: row.platformPostId,
        platform: row.platform,
        workspaceId,
        scheduledAt: row.scheduledAt?.toISOString() ?? new Date().toISOString(),
        metadata: row.metadata ?? undefined,
        phase: 'create',
      }

      const delaySeconds = Math.max(
        0,
        Math.floor((row.scheduledAt!.getTime() - now.getTime()) / 1000),
      )

      await env.CHRONEX_QUEUE_PRODUCER.send(payload, { delaySeconds })
      await db
        .update(platformPosts)
        .set({ status: 'processing' })
        .where(and(eq(platformPosts.id, row.platformPostId), eq(platformPosts.status, 'pending')))
      enqueued++
    }

    console.log(`Cron: enqueued ${enqueued} platform post(s).`)
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/test-job') {
      console.log('Sending test job to queue...')
      await env.CHRONEX_QUEUE_PRODUCER.send({
        postId: 123,
        platformPostId: 456,
      })
    }
    if (url.pathname === '/health') {
      try {
        const db = createDb(env.DATABASE_URL)
        const data = await db.select().from(workspace).limit(1)
        console.log('Database connection successful:', data)
        return new Response(
          JSON.stringify({
            status: 'ok',
            environment: env.ENVIRONMENT,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      } catch (error) {
        console.error('Error in fetch handler:', error)
        return new Response('Error processing request', { status: 500 })
      }
    } else {
    }

    return new Response('Chronex Queue Worker', { status: 200 })
  },
}
