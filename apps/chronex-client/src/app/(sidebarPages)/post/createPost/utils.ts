import { PLATFORM_MAP, type PlatformId } from '@/config/platforms'
import type { platformSchema } from '@/types/zod/platform'
import type { PlatformFormData } from './types'

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return combined
}

export function getAllowedMediaTypes(
  platform: PlatformId,
  contentTypeId: string,
): ('image' | 'video')[] | null {
  if (platform === 'instagram') {
    if (contentTypeId === 'image' || contentTypeId === 'story') return ['image']
    if (contentTypeId === 'reel') return ['video']
    if (contentTypeId === 'carousel') return ['image', 'video']
  }

  if (platform === 'linkedin') {
    if (contentTypeId === 'image') return ['image']
    if (contentTypeId === 'video') return ['video']
    if (contentTypeId === 'MultiPost') return ['image', 'video']
    if (contentTypeId === 'text') return null
  }

  if (platform === 'threads') {
    if (contentTypeId === 'text') return null
    if (contentTypeId === 'image') return ['image']
    if (contentTypeId === 'video') return ['video']
  }

  if (platform === 'slack' || platform === 'discord') {
    if (['message', 'embed'].includes(contentTypeId)) return null
    return ['image', 'video']
  }

  if (platform === 'telegram') {
    if (contentTypeId === 'message') return null
    if (contentTypeId === 'photo') return ['image']
    if (contentTypeId === 'video') return ['video']
    if (contentTypeId === 'mediaGroup') return ['image', 'video']
    return null
  }

  return ['image', 'video']
}

export function getCaptionLimit(platformId: PlatformId, contentType: string): number {
  if (platformId === 'instagram') return contentType === 'story' ? 125 : 2200
  if (platformId === 'linkedin') return 3000
  if (platformId === 'threads') return 500
  if (platformId === 'slack') return 4000
  if (platformId === 'discord') return 2000
  if (platformId === 'telegram') return contentType === 'message' ? 4096 : 1024
  return 2000
}

export function createDefaultPlatformData(
  platformId: PlatformId,
  unifiedCaption: string,
): PlatformFormData {
  const config = PLATFORM_MAP[platformId]
  const defaultData: PlatformFormData = {
    platform: platformId,
    contentType: config.contentTypes[0]?.id ?? '',
    caption: unifiedCaption,
    fileIds: [],
  }

  if (platformId === 'discord') {
    defaultData.embed = { color: 0x5865f2, timestamp: new Date().toISOString() }
  }

  return defaultData
}

export function buildPlatformPayload(pd: PlatformFormData): Record<string, unknown> {
  const platform = pd.platform
  const type = pd.contentType

  if (platform === 'instagram') {
    return { platform, type, caption: pd.caption || '', fileIds: pd.fileIds }
  }

  if (platform === 'linkedin') {
    if (type === 'text') return { platform, type, caption: pd.caption || '' }
    return { platform, type, caption: pd.caption || '', fileIds: pd.fileIds }
  }

  if (platform === 'threads') {
    if (type === 'text') {
      const payload: Record<string, unknown> = { platform, type, caption: pd.caption || '' }
      if (pd.description) payload.description = pd.description
      return payload
    }

    return { platform, type, caption: pd.caption || '', fileIds: pd.fileIds }
  }

  if (platform === 'slack') {
    if (type === 'message') {
      return {
        platform,
        type,
        caption: pd.caption || '',
        channelId: pd.channelId || '',
      }
    }

    const payload: Record<string, unknown> = {
      platform,
      type,
      fileIds: pd.fileIds,
      channelId: pd.channelId || '',
    }

    if (pd.caption) payload.caption = pd.caption
    return payload
  }

  if (platform === 'discord') {
    if (type === 'message') {
      return {
        platform,
        type,
        caption: pd.caption || '',
        channelId: pd.channelId || '',
      }
    }

    if (type === 'embed') {
      return {
        platform,
        type,
        embed: pd.embed || { color: 0x5865f2, timestamp: new Date().toISOString() },
        channelId: pd.channelId || '',
      }
    }

    const payload: Record<string, unknown> = {
      platform,
      type,
      fileIds: pd.fileIds,
      channelId: pd.channelId || '',
    }

    if (pd.caption) payload.caption = pd.caption
    return payload
  }

  if (platform === 'telegram') {
    if (type === 'message') {
      return {
        platform,
        type,
        caption: pd.caption || '',
      }
    }

    const payload: Record<string, unknown> = {
      platform,
      type,
      fileIds: pd.fileIds,
    }

    if (pd.caption) payload.caption = pd.caption
    return payload
  }

  return { platform, type, caption: pd.caption || '' }
}

export function validateCreatePostForm({
  title,
  scheduledDate,
  scheduledTime,
  selectedPlatforms,
  platformData,
}: {
  title: string
  scheduledDate?: Date
  scheduledTime: string
  selectedPlatforms: Set<PlatformId>
  platformData: Map<PlatformId, PlatformFormData>
}): string[] {
  const errors: string[] = []

  if (!title.trim()) errors.push('Post title is required')

  if (!scheduledDate) {
    errors.push('Schedule date is required')
  } else {
    const scheduledAt = combineDateAndTime(scheduledDate, scheduledTime)
    if (scheduledAt < new Date(Date.now() - 60000)) {
      errors.push('Schedule date cannot be in the past')
    }
  }

  if (selectedPlatforms.size === 0) errors.push('Select at least one platform')

  for (const platformId of selectedPlatforms) {
    const formData = platformData.get(platformId)
    const config = PLATFORM_MAP[platformId]
    const label = config?.label || platformId

    if (!formData) {
      errors.push(`${label}: configuration missing`)
      continue
    }

    const contentType = config?.contentTypes.find((item) => item.id === formData.contentType)
    if (contentType?.requiresMedia) {
      if (formData.fileIds.length < contentType.minMedia) {
        errors.push(
          `${label} (${contentType.label}): needs at least ${contentType.minMedia} file${contentType.minMedia > 1 ? 's' : ''}`,
        )
      }

      if (formData.fileIds.length > contentType.maxMedia) {
        errors.push(
          `${label} (${contentType.label}): max ${contentType.maxMedia} file${contentType.maxMedia > 1 ? 's' : ''}`,
        )
      }
    }

    if (['instagram', 'linkedin', 'threads'].includes(platformId) && !formData.caption.trim()) {
      errors.push(`${label}: Caption is required`)
    }

    if (
      (platformId === 'slack' || platformId === 'discord') &&
      formData.contentType === 'message' &&
      !formData.caption.trim()
    ) {
      errors.push(`${label}: Message is required`)
    }

    if ((platformId === 'slack' || platformId === 'discord') && !formData.channelId?.trim()) {
      errors.push(`${label}: Channel ID is required`)
    }

    if (
      platformId === 'telegram' &&
      formData.contentType === 'message' &&
      !formData.caption.trim()
    ) {
      errors.push(`${label}: Message is required`)
    }

    if (platformId === 'discord' && formData.contentType === 'embed') {
      if (!formData.embed?.timestamp) errors.push(`${label}: Embed timestamp is required`)
      if (formData.embed?.color === undefined) errors.push(`${label}: Embed color is required`)
    }
  }

  return errors
}

export function isPlatformReady(platformId: PlatformId, platformData?: PlatformFormData): boolean {
  if (!platformData) return false

  const config = PLATFORM_MAP[platformId]
  const contentType = config.contentTypes.find((item) => item.id === platformData.contentType)

  if (contentType?.requiresMedia && platformData.fileIds.length < contentType.minMedia) return false
  if (['instagram', 'linkedin', 'threads'].includes(platformId) && !platformData.caption.trim()) {
    return false
  }

  if (
    platformId === 'telegram' &&
    platformData.contentType === 'message' &&
    !platformData.caption.trim()
  ) {
    return false
  }

  return true
}

export function buildPlatformDataPayload(
  selectedPlatforms: Set<PlatformId>,
  platformData: Map<PlatformId, PlatformFormData>,
) {
  const allFileIds = new Set<string>()
  const payload = Array.from(selectedPlatforms).map((platformId) => {
    const data = platformData.get(platformId)!
    data.fileIds.forEach((id) => allFileIds.add(id))
    return buildPlatformPayload(data)
  })

  return {
    allFileIds: Array.from(allFileIds),
    platformPayload: payload as platformSchema,
  }
}
