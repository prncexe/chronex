import { TRPCError } from '@trpc/server'
import { authToken, eq, type NewAuthToken } from '@repo/db'
import { workspaceProcedure } from '../../trpc'

type TelegramWebhookInfo = {
  ok: boolean
  result?: { url: string }
  description?: string
}

type TelegramBotInfo = {
  ok: boolean
  result?: { id: number; username?: string; first_name?: string }
  description?: string
}

function createRegistrationCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function getWebhookSecret(token: string) {
  const envSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  if (envSecret) return envSecret

  const sanitizedToken = token.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `chronex_${sanitizedToken.slice(0, 24)}`
}

export const telegramOAuthProcedure = workspaceProcedure.mutation(async ({ ctx }) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!botToken) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'TELEGRAM_BOT_TOKEN is not configured',
    })
  }

  if (!appUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'NEXT_PUBLIC_APP_URL is not configured',
    })
  }

  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/oauth/telegram`
  const secretToken = getWebhookSecret(botToken)

  const webhookRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ['message', 'channel_post', 'edited_channel_post', 'my_chat_member'],
    }),
  })
  const webhookData = (await webhookRes.json()) as TelegramWebhookInfo

  if (!webhookRes.ok || !webhookData.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: webhookData.description ?? 'Failed to register Telegram webhook',
    })
  }

  const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
  const meData = (await meRes.json()) as TelegramBotInfo

  if (!meRes.ok || !meData.ok || !meData.result) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: meData.description ?? 'Failed to fetch Telegram bot profile',
    })
  }

  const registrationCode = createRegistrationCode()
  const datadb: NewAuthToken = {
    accessToken: botToken,
    refreshToken: registrationCode,
    profileId: String(meData.result.id),
    profileName:
      meData.result.username || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Telegram Bot',
    platform: 'telegram',
    userId: ctx.user.id,
    workspaceId: ctx.workspaceId,
    isRefreshable: false,
  }

  const existing = await ctx.db.query.authToken.findFirst({
    where: (token, { and, eq }) =>
      and(eq(token.workspaceId, ctx.workspaceId), eq(token.platform, 'telegram')),
  })

  if (existing) {
    await ctx.db
      .update(authToken)
      .set({
        accessToken: datadb.accessToken,
        refreshToken: datadb.refreshToken,
        profileId: datadb.profileId,
        profileName: datadb.profileName,
      })
      .where(eq(authToken.id, existing.id))
  } else {
    await ctx.db.insert(authToken).values(datadb)
  }

  return {
    success: true,
    botUsername: datadb.profileName,
    registrationCode,
  }
})
