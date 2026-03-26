import { TRPCError } from '@trpc/server'
import z from 'zod'
import type { NewAuthToken } from '@repo/db'
import { authToken } from '@repo/db'
import { workspaceProcedure } from '../../trpc'
import { authClient } from '@/config/linkedinClient'
import { RestliClient } from 'linkedin-api-client'
export const linkedinOAuthProcedure = workspaceProcedure
  .input(z.object({ code: z.string() }))
  .mutation(async ({ input, ctx }) => {
    let tokenData
    try {
      tokenData = await authClient.exchangeAuthCodeForAccessToken(input.code)
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Failed to exchange code for token',
        cause: error,
      })
    }
    const client = new RestliClient()
    let response
    try {
      response = await client.get({
        resourcePath: '/userinfo',
        accessToken: tokenData.access_token,
      })
    } catch (err) {
      throw err
    }
    const datadb: NewAuthToken = {
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      profileId: response.data.sub,
      profileName: response.data.name,
      platform: 'linkedin',
      userId: ctx.user.id,
      workspaceId: ctx.workspaceId,
      isRefreshable: true,
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

    return { access_token: tokenData.access_token }
  })
