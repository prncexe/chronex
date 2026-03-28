'use client'

import { Clock, ImageIcon, Link2, Palette, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PlatformFormData, PlatformFormUpdater } from '../../types'

type Props = {
  formData: PlatformFormData
  onChange: PlatformFormUpdater
}

export function DiscordEmbedFields({ formData, onChange }: Props) {
  const embed = formData.embed ?? { color: 0x5865f2, timestamp: new Date().toISOString() }

  return (
    <Card className="border-border/50 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" /> Embed Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Title</Label>
            <Input
              placeholder="Embed title"
              value={embed.title || ''}
              onChange={(event) => onChange({ embed: { ...embed, title: event.target.value } })}
              maxLength={256}
            />
          </div>
          <div className="space-y-2">
            <Label className="gap-1.5 text-xs">
              <Palette className="size-3" /> Color
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="FF5733"
                value={embed.color.toString(16).toUpperCase().padStart(6, '0')}
                onChange={(event) => {
                  const nextColor = parseInt(event.target.value, 16)
                  if (!Number.isNaN(nextColor) && nextColor <= 0xffffff) {
                    onChange({ embed: { ...embed, color: nextColor } })
                  }
                }}
                maxLength={6}
              />
              <div
                className="size-9 shrink-0 rounded-lg border shadow-sm"
                style={{ backgroundColor: `#${embed.color.toString(16).padStart(6, '0')}` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            placeholder="Embed description..."
            value={embed.description || ''}
            onChange={(event) => onChange({ embed: { ...embed, description: event.target.value } })}
            maxLength={4096}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="gap-1.5 text-xs">
              <Clock className="size-3" /> Timestamp
            </Label>
            <Input
              type="datetime-local"
              value={embed.timestamp ? embed.timestamp.slice(0, 16) : ''}
              onChange={(event) =>
                onChange({
                  embed: {
                    ...embed,
                    timestamp: new Date(event.target.value).toISOString(),
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Footer</Label>
            <Input
              placeholder="Footer text"
              value={embed.footer?.text || ''}
              onChange={(event) =>
                onChange({ embed: { ...embed, footer: { text: event.target.value } } })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="gap-1.5 text-xs">
              <ImageIcon className="size-3" /> Image URL
            </Label>
            <Input
              placeholder="https://..."
              value={embed.image?.url || ''}
              onChange={(event) =>
                onChange({ embed: { ...embed, image: { url: event.target.value } } })
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="gap-1.5 text-xs">
              <Link2 className="size-3" /> Thumbnail URL
            </Label>
            <Input
              placeholder="https://..."
              value={embed.thumbnail?.url || ''}
              onChange={(event) =>
                onChange({ embed: { ...embed, thumbnail: { url: event.target.value } } })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
