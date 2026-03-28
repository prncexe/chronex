import { NextResponse } from 'next/server'
import { and, authToken, eq, telegramChannels } from '@repo/db'
import { db } from '@/config/drizzle'

type TelegramChat = {
  id: number
  title?: string
  username?: string
  first_name?: string
  last_name?: string
  type: string
}

type TelegramMessage = {
  message_id: number
  chat: TelegramChat
  text?: string
  caption?: string
}

type TelegramUpdate = {
  message?: TelegramMessage
  channel_post?: TelegramMessage
  edited_channel_post?: TelegramMessage
}

function getWebhookSecret(token: string) {
  const envSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  if (envSecret) return envSecret

  const sanitizedToken = token.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `chronex_${sanitizedToken.slice(0, 24)}`
}

function getMessageText(message?: TelegramMessage) {
  return message?.text ?? message?.caption ?? ''
}

function extractRegistrationCode(text: string) {
  const normalized = text.trim()
  const connectMatch = normalized.match(/^\/connect(?:@\w+)?\s+([a-zA-Z0-9_-]+)/)
  if (connectMatch) return connectMatch[1] ?? null

  const startMatch = normalized.match(/^\/start(?:@\w+)?\s+chronex[_-]([a-zA-Z0-9_-]+)/)
  if (startMatch) return startMatch[1] ?? null

  return null
}

function getChatTitle(chat: TelegramChat) {
  return (
    chat.title ||
    chat.username ||
    [chat.first_name, chat.last_name].filter(Boolean).join(' ').trim() ||
    String(chat.id)
  )
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {})
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== getWebhookSecret(botToken)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const update = (await request.json()) as TelegramUpdate
  const message = update.message ?? update.channel_post ?? update.edited_channel_post

  if (!message) {
    return NextResponse.json({ ok: true })
  }

  const text = getMessageText(message)
  const registrationCode = extractRegistrationCode(text)
  const chatId = String(message.chat.id)
  const title = getChatTitle(message.chat)

  if (registrationCode) {
    const tokenRecord = await db.query.authToken.findFirst({
      where: (token, { and, eq }) =>
        and(eq(token.platform, 'telegram'), eq(token.refreshToken, registrationCode)),
    })

    if (!tokenRecord) {
      await sendTelegramMessage(chatId, 'Chronex could not match that workspace code.')
      return NextResponse.json({ ok: true })
    }

    const existing = await db.query.telegramChannels.findFirst({
      where: (channel, { and, eq }) =>
        and(eq(channel.workspaceId, tokenRecord.workspaceId), eq(channel.chatId, chatId)),
    })

    if (existing) {
      await db
        .update(telegramChannels)
        .set({
          title,
          username: message.chat.username ?? null,
          type: message.chat.type,
          isActive: true,
          lastSeenAt: new Date(),
        })
        .where(eq(telegramChannels.id, existing.id))
    } else {
      await db.insert(telegramChannels).values({
        workspaceId: tokenRecord.workspaceId,
        chatId,
        title,
        username: message.chat.username ?? null,
        type: message.chat.type,
        isActive: true,
        lastSeenAt: new Date(),
      })
    }

    await db
      .update(authToken)
      .set({
        profileId: chatId,
        profileName: title,
      })
      .where(eq(authToken.id, tokenRecord.id))

    await sendTelegramMessage(chatId, `Connected "${title}" to Chronex successfully.`)
    return NextResponse.json({ ok: true })
  }

  const knownChannel = await db.query.telegramChannels.findFirst({
    where: (channel, { eq }) => eq(channel.chatId, chatId),
    columns: { id: true },
  })

  if (knownChannel) {
    await db
      .update(telegramChannels)
      .set({
        title,
        username: message.chat.username ?? null,
        type: message.chat.type,
        isActive: true,
        lastSeenAt: new Date(),
      })
      .where(eq(telegramChannels.chatId, chatId))

    await db
      .update(authToken)
      .set({
        profileName: title,
      })
      .where(and(eq(authToken.platform, 'telegram'), eq(authToken.profileId, chatId)))
  }

  return NextResponse.json({ ok: true })
}
