'use client'

import type { ComponentType } from 'react'
import type { PlatformId } from '@/config/platforms'
import type { PlatformFieldsProps } from '../../types'
import { DiscordPlatformFields } from './discord-platform-fields'
import { InstagramPlatformFields } from './instagram-platform-fields'
import { LinkedinPlatformFields } from './linkedin-platform-fields'
import { SlackPlatformFields } from './slack-platform-fields'
import { TelegramPlatformFields } from './telegram-platform-fields'
import { ThreadsPlatformFields } from './threads-platform-fields'

const platformFieldsRegistry: Record<PlatformId, ComponentType<PlatformFieldsProps>> = {
  instagram: InstagramPlatformFields,
  linkedin: LinkedinPlatformFields,
  threads: ThreadsPlatformFields,
  slack: SlackPlatformFields,
  discord: DiscordPlatformFields,
  telegram: TelegramPlatformFields,
}

export function PlatformFieldsRenderer(props: PlatformFieldsProps) {
  const Component = platformFieldsRegistry[props.config.id]
  return <Component {...props} />
}
