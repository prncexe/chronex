import { workspaceProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'

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
