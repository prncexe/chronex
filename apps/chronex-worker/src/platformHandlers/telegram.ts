import { fetchMediaMany } from '../utils/media'
import { getAuthToken } from '../utils/getAuthToken'
import { markFailed, markProcessing, markPublished } from '../utils/updatePostStatus'
import type { Env, PlatformJobPayload } from '../index'

type TelegramMetadata = {
  caption?: string
  fileIds?: number[]
  type: 'message' | 'photo' | 'video' | 'mediaGroup'
}

type TelegramResponse<T = { message_id: number }> = {
  ok: boolean
  result?: T
  description?: string
}

const TELEGRAM_API = 'https://api.telegram.org'

async function telegramRequest<T>(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as TelegramResponse<T>
  if (!response.ok || !data.ok || !data.result) {
    throw new Error(data.description ?? `Telegram ${method} failed`)
  }

  return data.result
}

function getTelegramPostUrl(chatId: string, messageId: number) {
  const normalizedChatId = chatId.startsWith('-100') ? chatId.slice(4) : chatId.replace(/^-/, '')
  return `https://t.me/c/${normalizedChatId}/${messageId}`
}

export const TelegramMessage = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)
  const data = payload.metadata as TelegramMetadata

  try {
    await markProcessing(db, payload.platformPostId)
    const token = await getAuthToken(db, payload.workspaceId, 'telegram')
    const chatId = token.profileId
    if (!chatId) throw new Error('No Telegram channel is registered for this workspace')
    const result = await telegramRequest<{ message_id: number }>(token.accessToken, 'sendMessage', {
      chat_id: chatId,
      text: data.caption ?? '',
    })

    await markPublished(
      db,
      payload.platformPostId,
      String(result.message_id),
      getTelegramPostUrl(chatId, result.message_id),
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

export const TelegramPhoto = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)
  const data = payload.metadata as TelegramMetadata

  try {
    await markProcessing(db, payload.platformPostId)
    const token = await getAuthToken(db, payload.workspaceId, 'telegram')
    const chatId = token.profileId
    if (!chatId) throw new Error('No Telegram channel is registered for this workspace')
    const [media] = await fetchMediaMany(db, data.fileIds ?? [], env)
    const result = await telegramRequest<{ message_id: number }>(token.accessToken, 'sendPhoto', {
      chat_id: chatId,
      photo: media.url,
      caption: data.caption || undefined,
    })

    await markPublished(
      db,
      payload.platformPostId,
      String(result.message_id),
      getTelegramPostUrl(chatId, result.message_id),
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

export const TelegramVideo = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)
  const data = payload.metadata as TelegramMetadata

  try {
    await markProcessing(db, payload.platformPostId)
    const token = await getAuthToken(db, payload.workspaceId, 'telegram')
    const chatId = token.profileId
    if (!chatId) throw new Error('No Telegram channel is registered for this workspace')
    const [media] = await fetchMediaMany(db, data.fileIds ?? [], env)
    const result = await telegramRequest<{ message_id: number }>(token.accessToken, 'sendVideo', {
      chat_id: chatId,
      video: media.url,
      caption: data.caption || undefined,
    })

    await markPublished(
      db,
      payload.platformPostId,
      String(result.message_id),
      getTelegramPostUrl(chatId, result.message_id),
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}

export const TelegramMediaGroup = async (payload: PlatformJobPayload, env: Env): Promise<void> => {
  const db = (await import('@repo/db')).createDb(env.DATABASE_URL)
  const data = payload.metadata as TelegramMetadata

  try {
    await markProcessing(db, payload.platformPostId)
    const token = await getAuthToken(db, payload.workspaceId, 'telegram')
    const chatId = token.profileId
    if (!chatId) throw new Error('No Telegram channel is registered for this workspace')
    const mediaItems = await fetchMediaMany(db, data.fileIds ?? [], env)

    const media = mediaItems.map((item, index) => ({
      type: item.type === 'video' ? 'video' : 'photo',
      media: item.url,
      caption: index === 0 ? data.caption || undefined : undefined,
    }))

    const result = await telegramRequest<Array<{ message_id: number }>>(
      token.accessToken,
      'sendMediaGroup',
      {
        chat_id: chatId,
        media,
      },
    )

    const firstMessage = result[0]
    if (!firstMessage) {
      throw new Error('Telegram did not return any messages for media group')
    }

    await markPublished(
      db,
      payload.platformPostId,
      String(firstMessage.message_id),
      getTelegramPostUrl(chatId, firstMessage.message_id),
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await markFailed(db, payload.platformPostId, msg)
    throw error
  }
}
