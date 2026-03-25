import { workspaceProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getChannels = workspaceProcedure
  .input(z.object({ platform: z.enum(['slack', 'discord']) }))
  .query(async ({ ctx, input }) => {
    try {
      const token = await ctx.db.query.authToken.findFirst({
        where: (authToken, { eq, and }) =>
          and(
            eq(authToken.workspaceId, ctx.workspaceId),
            eq(authToken.platform, input.platform),
            eq(authToken.userId, ctx.user.id),
          ),
      })

      if (!token) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Token not found' })
      }

      if (input.platform === 'slack') {
        const res = await fetch(
          'https://slack.com/api/conversations.list?types=public_channel,private_channel',
          {
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
            },
          },
        )
        const data = (await res.json()) as {
          ok: boolean
          error?: string
          channels?: { id: string; name: string }[]
        }
        if (!data.ok) throw new Error(data.error)

        return (data.channels || []).map((c) => ({
          id: c.id,
          name: c.name,
        }))
      }

      if (input.platform === 'discord') {
        console.log(process.env.DISCORD_BOT_TOKEN)
        const res = await fetch(`https://discord.com/api/v10/guilds/${token.profileId}/channels`, {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        })
        const data = (await res.json()) as { id: string; name: string; type: number }[]
        console.log(data)
        // Discord returns an array of channels
        return data
          .filter((c) => c.type === 0 || c.type === 5)
          .map((c) => ({
            id: c.id,
            name: c.name,
          }))
      }

      return []
    } catch (error) {
      console.error(error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch channels',
        cause: error,
      })
    }
  })
