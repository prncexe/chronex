'use client'

import * as React from 'react'
import { MessageSquare } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MediaPicker } from '../media-picker'
import type { BasePlatformFieldsProps } from '../../types'

type Props = BasePlatformFieldsProps & {
  children?: React.ReactNode
}

export function BasePlatformFields({
  config,
  formData,
  onChange,
  media,
  mediaLoading,
  ctConfig,
  captionLimit,
  allowedTypes,
  children,
}: Props) {
  const toggleMedia = React.useCallback(
    (id: string) => {
      const current = new Set(formData.fileIds)
      if (current.has(id)) current.delete(id)
      else current.add(id)
      onChange({ fileIds: Array.from(current) })
    },
    [formData.fileIds, onChange],
  )

  const captionLabel =
    config.id === 'slack' || config.id === 'discord' || config.id === 'telegram'
      ? 'Message'
      : 'Caption'

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Content Type
        </Label>
        <div className="flex flex-wrap gap-2">
          {config.contentTypes.map((contentType) => (
            <button
              key={contentType.id}
              type="button"
              onClick={() => onChange({ contentType: contentType.id, fileIds: [] })}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200',
                formData.contentType === contentType.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {contentType.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            {captionLabel}
            {((config.id === 'slack' && formData.contentType === 'file') ||
              (config.id === 'telegram' &&
                ['photo', 'video', 'file', 'mediaGroup'].includes(formData.contentType))) && (
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            )}
          </Label>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formData.caption.length}/{captionLimit}
          </span>
        </div>
        <Textarea
          placeholder={`Write your ${config.label} ${captionLabel.toLowerCase()}...`}
          value={formData.caption}
          onChange={(event) => onChange({ caption: event.target.value })}
          maxLength={captionLimit}
          rows={3}
          className="resize-none"
        />
        <Progress value={(formData.caption.length / captionLimit) * 100} className="h-1" />
      </div>

      {children}

      <MediaPicker
        media={media}
        isLoading={mediaLoading}
        selectedIds={formData.fileIds}
        onToggle={toggleMedia}
        allowedTypes={allowedTypes}
        ctConfig={ctConfig}
      />
    </div>
  )
}
