import { workspaceProcedure } from '@/server/trpc'
import { z } from 'zod'
import { b2 } from '@/config/backBlaze'
import { TRPCError } from '@trpc/server'
import { NewPlatformPost, post, postMedia } from '@repo/db'
import { platformPosts } from '@repo/db'
import { NewPostMedia } from '@repo/db'
import { fileInfo } from '@/types/zod/file'
import { InputSchema } from '@/types/zod/platform'
import { getMetaData } from '@/utils/fileFetch'
import { validateMediaForPlatform } from '@/lib/media-validation/validator'
import { queuePlatformJob } from '@/config/cloudflareQueue'
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export const getUploadUrl = workspaceProcedure.query(async () => {
  try {
    await b2.authorize()
    const res = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID!,
    })
    return res.data
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate upload URL',
      cause: error,
    })
  }
})

export const saveMedia = workspaceProcedure
  .input(
    z.object({
      contentType: z.enum(['image', 'video']),
      fileId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    try {
      await b2.authorize()
      const info = await b2
        .getFileInfo({ fileId: input.fileId })
        .then((res) => fileInfo.parse(res.data))
      const typeandExtension = info.contentType.split('/')
      const mediaRecord: NewPostMedia = {
        workspaceId: ctx.workspaceId,
        userId: ctx.user.id,
        url: input.fileId,
        type: typeandExtension[0] as 'image' | 'video',
        size: info.contentLength,
        height: info.fileInfo.height,
        width: info.fileInfo.width,
        duration: info.fileInfo.duration,
        extension: typeandExtension[1],
        aspectRatio: (() => {
          const w = info.fileInfo.width
          const h = info.fileInfo.height
          if (!w || !h) return null
          const g = gcd(w, h)
          return `${w / g}:${h / g}`
        })(),
      }
      await ctx.db.insert(postMedia).values(mediaRecord)
      return { success: true }
    } catch (error) {
      console.log('Error in saveMedia:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save media',
        cause: error,
      })
    }
  })

export const createPost = workspaceProcedure.input(InputSchema).mutation(async ({ ctx, input }) => {
  try {
    // Validate scheduledAt is not too far in the past
    const nowMs = Date.now()
    const scheduledMs = input.scheduledAt.getTime()
    if (scheduledMs < nowMs - 60_000) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Scheduled time cannot be more than 1 minute in the past',
      })
    }

    const allids = [...input.content]
    const metaMap = Object.fromEntries(
      await Promise.all(allids.map(async (id) => [id, await getMetaData(id, ctx.db)])),
    )
    validateMediaForPlatform({
      metaData: metaMap,
      platformData: input.platformdata,
    })
    const [Post] = await ctx.db
      .insert(post)
      .values({
        refName: input.title,
        createdBy: ctx.user.id,
        platforms: input.platforms,
        content: input.content,
        workspaceId: ctx.workspaceId,
        scheduledAt: input.scheduledAt,
        status: 'scheduled',
      })
      .returning()

    // 2. Save platform entries
    const platformEntries: NewPlatformPost[] = input.platformdata.map((p) => ({
      postId: Post.id,
      platform: p.platform,
      metadata: {
        type: p.type,
        caption: 'caption' in p ? p.caption : null,
        description: 'description' in p ? p.description : null,
        hashtags: 'hashtags' in p ? p.hashtags : null,
        title: 'title' in p ? p.title : null,
        fileIds: 'fileIds' in p ? p.fileIds : null,
        channelId: 'channelId' in p ? p.channelId : null,
        embed: 'embed' in p ? p.embed : null,
        workspaceName: 'workspaceName' in p ? p.workspaceName : null,
      },
      status: 'pending' as const,
      scheduledAt: input.scheduledAt,
    }))

    const insertedPlatformPosts = await ctx.db
      .insert(platformPosts)
      .values(platformEntries)
      .returning({ id: platformPosts.id, platform: platformPosts.platform })

    // If scheduledAt is within 12 hours, enqueue now with a delay so the
    // worker fires at the right moment. Posts further out are left for the
    // cron job (runs every 12 h) to enqueue when they fall into range.
    const msUntilScheduled = scheduledMs - nowMs
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
    console.log(insertedPlatformPosts)
    if (msUntilScheduled < TWELVE_HOURS_MS) {
      const delaySeconds = Math.max(0, Math.floor(msUntilScheduled / 1000))

      for (const pp of insertedPlatformPosts) {
        await queuePlatformJob(
          {
            postId: Post.id,
            platformPostId: pp.id,
            platform: pp.platform,
            workspaceId: ctx.workspaceId,
            scheduledAt: input.scheduledAt.toISOString(),
            metadata: platformEntries.find((e) => e.platform === pp.platform)?.metadata,
          },
          delaySeconds,
        )
      }
    }

    return { postId: Post.id, status: 'scheduled' }
  } catch (error) {
    console.log('Error in createPost:', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create post',
      cause: error,
    })
  }
})
