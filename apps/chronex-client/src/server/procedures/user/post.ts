import { workspaceProcedure } from '@/server/trpc'
import { z } from 'zod'
import { b2 } from '@/config/backBlaze'
import { TRPCError } from '@trpc/server'
import { post, postMedia, platformPosts } from '@repo/db'
import type { NewPlatformPost } from '@repo/db'
import type { NewPostMedia } from '@repo/db'
import { InputSchema } from '@/types/zod/platform'
import { getMetaData } from '@/utils/fileFetch'
import { validateMediaForPlatform } from '@/lib/media-validation/validator'
import { queuePlatformJob } from '@/config/cloudflareQueue'
import { and, count, eq } from 'drizzle-orm'
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function getValidatedB2DownloadUrl(): string {
  const rawBaseUrl = process.env.B2_DOWNLOAD_URL

  if (!rawBaseUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'B2_DOWNLOAD_URL is not configured',
    })
  }

  try {
    const normalized = new URL(rawBaseUrl)
    return normalized.toString().replace(/\/$/, '')
  } catch {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `B2_DOWNLOAD_URL is invalid: ${rawBaseUrl}`,
    })
  }
}

export const getUploadUrl = workspaceProcedure.query(async ({ ctx }) => {
  try {
    const media = await ctx.db.query.postMedia.findMany({
      where: (media, { eq }) => eq(media.workspaceId, ctx.workspaceId),
      columns: {
        id: true,
      },
    })
    const mediaCount = media.length
    if (mediaCount >= Number(process.env.NEXT_PUBLIC_MAX_MEDIA_PER_WORKSPACE)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Media limit of ${process.env.NEXT_PUBLIC_MAX_MEDIA_PER_WORKSPACE} per workspace exceeded`,
      })
    }
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
      const info = await b2.getFileInfo({ fileId: input.fileId }).then((res) => res.data)
      const b2DownloadUrl = getValidatedB2DownloadUrl()
      const fileUrl = `${b2DownloadUrl}/b2api/v3/b2_download_file_by_id?fileId=${input.fileId}`
      const typeandExtension = info.contentType.split('/')
      const mediaRecord: NewPostMedia = {
        workspaceId: ctx.workspaceId,
        name: info.fileName,
        userId: ctx.user.id,
        url: fileUrl,
        type: typeandExtension[0] as 'image' | 'video',
        size: info.contentLength,
        height: Number(info.fileInfo.height),
        width: Number(info.fileInfo.width),
        duration: info.fileInfo.duration ? Number(info.fileInfo.duration) : null,
        extension: typeandExtension[1],
        aspectRatio: (() => {
          const w = Number(info.fileInfo.width)
          const h = Number(info.fileInfo.height)
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
    const posts = await ctx.db.query.post.findMany({
      where: (post, { eq }) => eq(post.workspaceId, ctx.workspaceId),
      columns: {
        id: true,
      },
    })
    const postCount = posts.length
    if (postCount >= Number(process.env.NEXT_PUBLIC_MAX_POSTS_PER_WORKSPACE)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Post limit of ${process.env.NEXT_PUBLIC_MAX_POSTS_PER_WORKSPACE} per workspace exceeded`,
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

    const msUntilScheduled = input.scheduledAt.getTime() - Date.now()
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

export const getUserPosts = workspaceProcedure
  .input(
    z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(20).default(5),
    }),
  )
  .query(async ({ ctx, input }) => {
    try {
      const page = input.page
      const pageSize = input.pageSize
      const whereClause = and(
        eq(post.workspaceId, ctx.workspaceId),
        eq(post.createdBy, ctx.user.id),
      )

      const [{ totalItems }] = await ctx.db
        .select({ totalItems: count() })
        .from(post)
        .where(whereClause)

      const posts = await ctx.db.query.post.findMany({
        where: (posts, { and, eq }) =>
          and(eq(posts.workspaceId, ctx.workspaceId), eq(posts.createdBy, ctx.user.id)),
        with: {
          platformPosts: {
            columns: {
              id: true,
              platform: true,
              status: true,
              scheduledAt: true,
              publishedAt: true,
              postUrl: true,
              errorMessage: true,
              metadata: true,
            },
            orderBy: (platformPost, { asc }) => [asc(platformPost.platform)],
          },
        },
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        columns: {
          id: true,
          refName: true,
          status: true,
          platforms: true,
          content: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return {
        items: posts.map((item) => ({
          ...item,
          mediaCount: item.content.length,
          platformCount: item.platformPosts.length,
        })),
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      }
    } catch (error) {
      console.log('Error in getUserPosts:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user posts',
        cause: error,
      })
    }
  })

export const getUserPostById = workspaceProcedure
  .input(
    z.object({
      id: z.number().int().positive(),
    }),
  )
  .query(async ({ ctx, input }) => {
    try {
      const postRecord = await ctx.db.query.post.findFirst({
        where: (posts, { and, eq }) =>
          and(
            eq(posts.id, input.id),
            eq(posts.workspaceId, ctx.workspaceId),
            eq(posts.createdBy, ctx.user.id),
          ),
        with: {
          platformPosts: {
            columns: {
              id: true,
              platform: true,
              status: true,
              scheduledAt: true,
              publishedAt: true,
              postUrl: true,
              errorMessage: true,
              metadata: true,
            },
            orderBy: (platformPost, { asc }) => [asc(platformPost.platform)],
          },
        },
        columns: {
          id: true,
          refName: true,
          status: true,
          platforms: true,
          content: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!postRecord) {
        return null
      }

      const mediaRecords =
        postRecord.content.length > 0
          ? await ctx.db.query.postMedia.findMany({
              where: (media, { and, eq, inArray }) =>
                and(
                  inArray(
                    media.id,
                    postRecord.content.map((value) => Number(value)).filter(Boolean),
                  ),
                  eq(media.workspaceId, ctx.workspaceId),
                  eq(media.userId, ctx.user.id),
                ),
              columns: {
                id: true,
                name: true,
                url: true,
                type: true,
                size: true,
                width: true,
                height: true,
                duration: true,
                extension: true,
                aspectRatio: true,
                createdAt: true,
                expiresAt: true,
                downloadToken: true,
              },
            })
          : []

      const authorizedMedia =
        mediaRecords.length > 0
          ? await (async () => {
              await b2.authorize()

              return Promise.all(
                mediaRecords.map(async (mediaItem) => {
                  const isTokenFresh =
                    mediaItem.expiresAt && mediaItem.expiresAt > new Date(Date.now() + 60 * 1000)

                  if (isTokenFresh && mediaItem.downloadToken) {
                    return {
                      ...mediaItem,
                      url: `${process.env.B2_DOWNLOAD_URL}/file/chronex/${mediaItem.name}?Authorization=${mediaItem.downloadToken}`,
                    }
                  }

                  const data = await b2.getDownloadAuthorization({
                    bucketId: process.env.B2_BUCKET_ID!,
                    fileNamePrefix: mediaItem.name,
                    validDurationInSeconds: 60 * 60 * 24 * 7,
                  })

                  await ctx.db
                    .update(postMedia)
                    .set({
                      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000),
                      downloadToken: data.data.authorizationToken,
                    })
                    .where(eq(postMedia.id, mediaItem.id))

                  return {
                    ...mediaItem,
                    url: `${process.env.B2_DOWNLOAD_URL}/file/chronex/${mediaItem.name}?Authorization=${data.data.authorizationToken}`,
                  }
                }),
              )
            })()
          : []

      const mediaById = new Map(authorizedMedia.map((item) => [String(item.id), item]))
      const orderedMedia = postRecord.content
        .map((mediaId) => mediaById.get(String(mediaId)))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))

      return {
        ...postRecord,
        media: orderedMedia,
        mediaCount: orderedMedia.length,
        platformCount: postRecord.platformPosts.length,
      }
    } catch (error) {
      console.log('Error in getUserPostById:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get post details',
        cause: error,
      })
    }
  })
