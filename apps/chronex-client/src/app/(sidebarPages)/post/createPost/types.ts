import type { PlatformId, PlatformConfig, ContentType } from '@/config/platforms'

export type MediaItem = {
  id: number
  name: string
  url: string
  type: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
  downloadToken: string | null
}

export interface PlatformFormData {
  platform: PlatformId
  contentType: string
  caption: string
  description?: string
  fileIds: string[]
  channelId?: string
  embed?: {
    title?: string
    description?: string
    color: number
    footer?: { text: string }
    timestamp: string
    image?: { url: string }
    thumbnail?: { url: string }
  }
}

export type PlatformFormUpdater = (updates: Partial<PlatformFormData>) => void

export type BasePlatformFieldsProps = {
  config: PlatformConfig
  formData: PlatformFormData
  onChange: PlatformFormUpdater
  media: MediaItem[]
  mediaLoading: boolean
  ctConfig: ContentType
  captionLimit: number
  allowedTypes: ('image' | 'video')[] | null
}

export type PlatformFieldsProps = {
  config: PlatformConfig
  formData: PlatformFormData
  onChange: PlatformFormUpdater
  media: MediaItem[]
  mediaLoading: boolean
}
