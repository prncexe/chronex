/**
 * Static config that maps each platform to its available content types.
 * Used to drive platform & content-type selection UI.
 */

export type PlatformId = 'instagram' | 'linkedin' | 'threads' | 'slack' | 'discord' | 'telegram'

export interface ContentType {
  id: string
  label: string
  requiresMedia: boolean
  /** min number of media files required (0 = optional) */
  minMedia: number
  maxMedia: number
}

export interface PlatformConfig {
  id: PlatformId
  label: string
  contentTypes: ContentType[]
}

export const PLATFORM_CONFIG: PlatformConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    contentTypes: [
      {
        id: 'image',
        label: 'Image',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
      {
        id: 'reel',
        label: 'Reel',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
      {
        id: 'carousel',
        label: 'Carousel',
        requiresMedia: true,
        minMedia: 2,
        maxMedia: 10,
      },
      {
        id: 'story',
        label: 'Story',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    contentTypes: [
      {
        id: 'image',
        label: 'Image',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
      {
        id: 'video',
        label: 'Video',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
      {
        id: 'MultiPost',
        label: 'Multi-post',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 20,
      },
      {
        id: 'text',
        label: 'Text',
        requiresMedia: false,
        minMedia: 0,
        maxMedia: 0,
      },
    ],
  },
  {
    id: 'threads',
    label: 'Threads',
    contentTypes: [
      {
        id: 'text',
        label: 'Text',
        requiresMedia: false,
        minMedia: 0,
        maxMedia: 0,
      },
      {
        id: 'image',
        label: 'Image',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 10,
      },
      {
        id: 'video',
        label: 'Video',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
    ],
  },
  {
    id: 'slack',
    label: 'Slack',
    contentTypes: [
      {
        id: 'message',
        label: 'Message',
        requiresMedia: false,
        minMedia: 0,
        maxMedia: 0,
      },
      {
        id: 'file',
        label: 'File upload',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 10,
      },
    ],
  },
  {
    id: 'discord',
    label: 'Discord',
    contentTypes: [
      {
        id: 'message',
        label: 'Message',
        requiresMedia: false,
        minMedia: 0,
        maxMedia: 0,
      },
      {
        id: 'embed',
        label: 'Embed',
        requiresMedia: false,
        minMedia: 0,
        maxMedia: 0,
      },
      {
        id: 'file',
        label: 'File upload',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 10,
      },
    ],
  },
  {
    id: 'telegram',
    label: 'Telegram',
    contentTypes: [
      {
        id: 'message',
        label: 'Message',
        requiresMedia: false,
        minMedia: 0,
        maxMedia: 0,
      },
      {
        id: 'photo',
        label: 'Photo',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
      {
        id: 'video',
        label: 'Video',
        requiresMedia: true,
        minMedia: 1,
        maxMedia: 1,
      },
      {
        id: 'mediaGroup',
        label: 'Album',
        requiresMedia: true,
        minMedia: 2,
        maxMedia: 10,
      },
    ],
  },
]

/** Lookup map: platform id → config */
export const PLATFORM_MAP = Object.fromEntries(PLATFORM_CONFIG.map((p) => [p.id, p])) as Record<
  PlatformId,
  PlatformConfig
>

/** Returns the content-type config for a given platform + type pair */
export function getContentTypeConfig(platform: PlatformId, type: string): ContentType | undefined {
  return PLATFORM_MAP[platform]?.contentTypes.find((ct) => ct.id === type)
}
