'use client'

import { BasePlatformFields } from './base-platform-fields'
import { ChannelSelectField } from './channel-select-field'
import { DiscordEmbedFields } from './discord-embed-fields'
import { getAllowedMediaTypes, getCaptionLimit } from '../../utils'
import type { PlatformFieldsProps } from '../../types'

export function DiscordPlatformFields(props: PlatformFieldsProps) {
  return (
    <BasePlatformFields
      {...props}
      ctConfig={props.config.contentTypes.find((item) => item.id === props.formData.contentType)!}
      captionLimit={getCaptionLimit(props.config.id, props.formData.contentType)}
      allowedTypes={getAllowedMediaTypes(props.config.id, props.formData.contentType)}
    >
      <ChannelSelectField
        platform="discord"
        value={props.formData.channelId}
        onChange={props.onChange}
      />
      {props.formData.contentType === 'embed' && (
        <DiscordEmbedFields formData={props.formData} onChange={props.onChange} />
      )}
    </BasePlatformFields>
  )
}
