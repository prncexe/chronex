import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { NewAuthToken } from '@repo/db'
import { authToken } from '@repo/db'
import { workspaceProcedure } from '../../trpc'

export const discordOAuthProcedure = workspaceProcedure
  .input(z.object({ guild_id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const datadb: NewAuthToken = {
      accessToken: input.guild_id,
      profileId: input.guild_id,
      platform: 'discord',
      userId: ctx.user.id,
      workspaceId: ctx.workspaceId,
      isRefreshable: false,
    }

    try {
      await ctx.db.insert(authToken).values(datadb)
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save token to database',
        cause: error,
      })
    }

    return { guildId: datadb.profileId }
  })
