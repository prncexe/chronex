import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { NewAuthToken } from '@repo/db'
import { authToken } from '@repo/db'
import { workspaceProcedure } from '../../trpc'
import { DISCORD_TOKEN_URL } from '@/constants/url'
export const discordOAuthProcedure = workspaceProcedure
  .input(z.object({ code: z.string() }))
  .mutation(async ({ input, ctx }) => {
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!;

  
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code:input.code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();
      const datadb: NewAuthToken = {
        accessToken: '',
        profileId: data.guild.id,
        profileName:data.guild.name,
        platform: 'discord',
        userId: ctx.user.id,
        workspaceId: ctx.workspaceId,
        isRefreshable: false,
      }
      await ctx.db.insert(authToken).values(datadb)
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save token to database',
        cause: error,
      })
    }

    return { success: true }
  })
