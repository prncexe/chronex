import { TRPCError } from '@trpc/server'

/**
 * Base procedure for all OAuth routes - requires authentication + workspace
 */

interface ShortLivedTokenParams {
  url: string
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}

interface LongLivedTokenParams {
  url: string
  clientSecret: string
  accessToken: string
  grantType: string
}

interface ShortLivedTokenResponse {
  access_token: string
  user_id: string
}

interface LongLivedTokenResponse {
  access_token: string
  expires_in: number
}

export async function exchangeCodeForShortLivedToken(
  params: ShortLivedTokenParams,
): Promise<ShortLivedTokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: params.redirectUri,
    code: params.code,
  })

  const res = await fetch(params.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Failed to exchange code for token: ${errorBody}`,
    })
  }

  return res.json()
}

export async function exchangeForLongLivedToken(
  params: LongLivedTokenParams,
): Promise<LongLivedTokenResponse> {
  const url = new URL(params.url)
  url.searchParams.set('grant_type', params.grantType)
  url.searchParams.set('client_secret', params.clientSecret)
  url.searchParams.set('access_token', params.accessToken)

  const res = await fetch(url.toString())

  if (!res.ok) {
    const errorBody = await res.text()
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Failed to exchange short-lived token for long-lived token: ${errorBody}`,
    })
  }
  console.log('Long-lived token response:', await res.clone().json())
  return res.json()
}
