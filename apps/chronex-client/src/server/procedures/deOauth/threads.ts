import { workspaceProcedure } from '@/server/trpc'
import { authToken, eq } from '@repo/db'
import { TRPCError } from '@trpc/server'

export const threadsOAuthProcedure = workspaceProcedure.mutation(async ({ ctx }) => {
  const userId = ctx.user.id
  const token = await ctx.db.query.authToken.findFirst({
    where: (account, { eq, and }) =>
      and(eq(account.userId, userId), eq(account.platform, 'threads')),
  })
  if (!token) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Threads token not found',
    })
  }

  await ctx.db.delete(authToken).where(eq(authToken.id, token.id))

  return { success: true }
})
