import { workspaceProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'
import { b2 } from '@/config/backBlaze'
import { postMedia, eq } from '@repo/db'

export const getUser = workspaceProcedure.query(async ({ ctx }) => {
  try {
    const user = await ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ctx.user.id),
      with: {
        authTokens: {
          where: (authToken, { eq }) => eq(authToken.workspaceId, ctx.workspaceId),
          columns: {
            id: true,
            platform: true,
            profileName: true,
          },
        },
        workspaces: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    })
    return user
  } catch (error) {
    console.log(error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get user',
      cause: error,
    })
  }
})

export const getMedia = workspaceProcedure.query(async ({ ctx }) => {
  try {
    const media = await ctx.db.query.postMedia.findMany({
      where: (media, { eq, and }) =>
        and(eq(media.workspaceId, ctx.workspaceId), eq(media.userId, ctx.user.id)),
      columns: {
        id: true,
        name: true,
        url: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        downloadToken: true,
      },
    })

    await b2.authorize()

    const arr = await Promise.all(
      media.map(async (m) => {
        const isTokenFresh = m.expiresAt && m.expiresAt > new Date(Date.now() + 60 * 1000)
        if (isTokenFresh) {
          console.log('Token is cached')
          return {
            ...m,
            url: `${process.env.B2_DOWNLOAD_URL}/file/chronex/${m.name}?Authorization=${m.downloadToken}`,
          }
        }
        console.log("token ain't cached, generating new one")
        const data = await b2.getDownloadAuthorization({
          bucketId: process.env.B2_BUCKET_ID!,
          fileNamePrefix: m.name,
          validDurationInSeconds: 60 * 60 * 24 * 7,
        })
        await ctx.db
          .update(postMedia)
          .set({
            expiresAt: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000),
            downloadToken: data.data.authorizationToken,
          })
          .where(eq(postMedia.id, m.id))
        return {
          ...m,
          url: `${process.env.B2_DOWNLOAD_URL}/file/chronex/${m.name}?Authorization=${data.data.authorizationToken}`,
        }
      }),
    )

    return arr
  } catch (error) {
    console.log(error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get media',
      cause: error,
    })
  }
})
