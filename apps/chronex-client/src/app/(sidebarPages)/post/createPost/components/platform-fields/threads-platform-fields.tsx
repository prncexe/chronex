'use client'

import { Type } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BasePlatformFields } from './base-platform-fields'
import { getAllowedMediaTypes, getCaptionLimit } from '../../utils'
import type { PlatformFieldsProps } from '../../types'

export function ThreadsPlatformFields(props: PlatformFieldsProps) {
  return (
    <BasePlatformFields
      {...props}
      ctConfig={props.config.contentTypes.find((item) => item.id === props.formData.contentType)!}
      captionLimit={getCaptionLimit(props.config.id, props.formData.contentType)}
      allowedTypes={getAllowedMediaTypes(props.config.id, props.formData.contentType)}
    >
      {props.formData.contentType === 'text' && (
        <div className="space-y-2">
          <Label className="gap-2">
            <Type className="size-4 text-muted-foreground" /> Description{' '}
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            placeholder="Extended text content..."
            value={props.formData.description || ''}
            onChange={(event) => props.onChange({ description: event.target.value })}
            maxLength={10000}
            rows={3}
            className="resize-none"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {(props.formData.description || '').length}/10,000
          </p>
        </div>
      )}
    </BasePlatformFields>
  )
}
