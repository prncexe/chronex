'use client'

import { Hash } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/utils/trpc'
import type { PlatformFormUpdater } from '../../types'

type Props = {
  platform: 'slack' | 'discord' | 'telegram'
  value?: string
  onChange: PlatformFormUpdater
}

export function ChannelSelectField({ platform, value, onChange }: Props) {
  const { data: channels, isLoading } = trpc.user.getChannels.useQuery({ platform })

  return (
    <div className="space-y-2">
      <Label className="gap-2">
        <Hash className="size-4 text-muted-foreground" /> Channel{' '}
        <span className="text-destructive">*</span>
      </Label>
      <Select value={value || ''} onValueChange={(channelId) => onChange({ channelId })}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Loading channels...' : 'Select a channel'} />
        </SelectTrigger>
        <SelectContent>
          {channels?.map((channel) => (
            <SelectItem key={channel.id} value={channel.id}>
              #{channel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
