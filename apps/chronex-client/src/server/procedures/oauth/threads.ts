import { workspaceProcedure } from '@/server/trpc'
import z from 'zod'
import type { NewAuthToken } from '@repo/db'
import { authToken } from '@repo/db'

import {
  THREADS_LONG_LIVED_TOKEN_URL,
  THREADS_PROFILE_URL,
  THREADS_SHORT_LIVED_TOKEN_URL,
} from '@/constants/url'
import { exchangeCodeForShortLivedToken, exchangeForLongLivedToken } from './types'

export const threadsOAuthProcedure = workspaceProcedure
  .input(z.object({ code: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const shortLivedToken = await exchangeCodeForShortLivedToken({
      url: THREADS_SHORT_LIVED_TOKEN_URL,
      clientId: process.env.NEXT_PUBLIC_THREADS_APP_ID!,
      clientSecret: process.env.THREADS_CLIENT_SECRET!,
      redirectUri: process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI!,
      code: input.code,
    })

    const longLivedToken = await exchangeForLongLivedToken({
      url: THREADS_LONG_LIVED_TOKEN_URL,
      clientSecret: process.env.THREADS_CLIENT_SECRET!,
      accessToken: shortLivedToken.access_token,
      grantType: 'th_exchange_token',
    })
    const url = `${THREADS_PROFILE_URL}/v1.0/me?fields=id,username&access_token=${longLivedToken.access_token}`

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch user ID: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const datadb: NewAuthToken = {
      accessToken: longLivedToken.access_token,
      expiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000),
      platform: 'threads',
      userId: ctx.user.id,
      workspaceId: ctx.workspaceId,
      profileId: data.id,
      profileName: data.username,
      isRefreshable: true,
    }
    await ctx.db.insert(authToken).values(datadb)
    return { access_token: longLivedToken.access_token }
  })
