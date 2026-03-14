import type { platformSchema } from '@/types/zod/platform'
import type { FileMetaData } from '@/utils/fileFetch'
import * as MediaRules from '@/lib/media-validation/platform-media-rules/combined'
import type { ZodTypeAny } from 'zod'

export const validateMediaForPlatform = ({
  metaData,
  platformData,
}: {
  metaData: Record<string, FileMetaData>
  platformData: platformSchema
}) => {
  for (const platformEntry of platformData) {
    if ('fileIds' in platformEntry && platformEntry.fileIds && platformEntry.fileIds.length > 0) {
      const platform = platformEntry.platform
      const type = platformEntry.type
      const fileIds = platformEntry.fileIds
      const platformKey = platform as keyof typeof MediaRules
      const mediaRules = MediaRules[platformKey]
      if (!mediaRules) {
        throw new Error(`No media rules defined for platform: ${platform}`)
      }
      const rule = mediaRules[type as keyof typeof mediaRules] as ZodTypeAny | undefined
      if (!rule) {
        throw new Error(`No media rules defined for type: ${type} on platform: ${platform}`)
      }

      const mediaMetaData = fileIds
        .map((id) => metaData[id])
        .filter((m): m is NonNullable<FileMetaData> => m != null)
      try {
        rule.parse(mediaMetaData)
      } catch (error) {
        console.log(
          `Validation failed for platform: ${platform} with error: ${(error as Error).message}`,
        )
        throw new Error(
          `Media validation failed for platform: ${platform} with error: ${(error as Error).message}`,
        )
      }
      // item is now narrowed to variants that have fileIds
    }
  }
}
