import { workspaceProcedure } from '@/server/trpc'
import { authToken, eq, telegramChannels } from '@repo/db'
import { TRPCError } from '@trpc/server'

export const telegramOAuthProcedure = workspaceProcedure.mutation(async ({ ctx }) => {
  const token = await ctx.db.query.authToken.findFirst({
    where: (account, { and, eq }) =>
      and(
        eq(account.userId, ctx.user.id),
        eq(account.workspaceId, ctx.workspaceId),
        eq(account.platform, 'telegram'),
      ),
  })

  if (!token) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Telegram token not found',
    })
  }

  await ctx.db.delete(telegramChannels).where(eq(telegramChannels.workspaceId, ctx.workspaceId))
  await ctx.db.delete(authToken).where(eq(authToken.id, token.id))

  return { success: true }
})
