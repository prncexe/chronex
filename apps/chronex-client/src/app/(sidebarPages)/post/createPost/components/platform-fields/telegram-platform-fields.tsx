'use client'

import { BasePlatformFields } from './base-platform-fields'
import { getAllowedMediaTypes, getCaptionLimit } from '../../utils'
import type { PlatformFieldsProps } from '../../types'

export function TelegramPlatformFields(props: PlatformFieldsProps) {
  return (
    <BasePlatformFields
      {...props}
      ctConfig={props.config.contentTypes.find((item) => item.id === props.formData.contentType)!}
      captionLimit={getCaptionLimit(props.config.id, props.formData.contentType)}
      allowedTypes={getAllowedMediaTypes(props.config.id, props.formData.contentType)}
    />
  )
}
