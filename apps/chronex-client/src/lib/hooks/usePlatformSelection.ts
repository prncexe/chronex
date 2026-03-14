'use client'

import { useState, useCallback } from 'react'
import {
  PLATFORM_CONFIG,
  PLATFORM_MAP,
  type PlatformId,
  type ContentType,
} from '@/config/platforms'

export interface PlatformSelection {
  platform: PlatformId
  contentType: string
}

export interface UsePlatformSelectionReturn {
  /** All available platforms */
  availablePlatforms: typeof PLATFORM_CONFIG
  /** Currently selected platform+type pairs */
  selections: PlatformSelection[]
  /** IDs of selected platforms (for binding to `platforms` field in InputSchema) */
  selectedPlatformIds: PlatformId[]
  /** Toggle a platform on/off. Selecting a platform sets its default content type automatically */
  togglePlatform: (platform: PlatformId) => void
  /** Change the content type for an already-selected platform */
  setContentType: (platform: PlatformId, contentType: string) => void
  /** Whether a platform is currently selected */
  isPlatformSelected: (platform: PlatformId) => boolean
  /** Get the active content type id for a platform (undefined if not selected) */
  getContentType: (platform: PlatformId) => string | undefined
  /** Get the ContentType config for a platform's active selection */
  getContentTypeConfig: (platform: PlatformId) => ContentType | undefined
  /** Remove all selections */
  clearAll: () => void
}

export function usePlatformSelection(): UsePlatformSelectionReturn {
  const [selections, setSelections] = useState<PlatformSelection[]>([])

  const togglePlatform = useCallback((platform: PlatformId) => {
    setSelections((prev) => {
      const exists = prev.some((s) => s.platform === platform)
      if (exists) {
        // deselect
        return prev.filter((s) => s.platform !== platform)
      }
      // select with default content type (first in list)
      const defaultType = PLATFORM_MAP[platform].contentTypes[0].id
      return [...prev, { platform, contentType: defaultType }]
    })
  }, [])

  const setContentType = useCallback((platform: PlatformId, contentType: string) => {
    setSelections((prev) => prev.map((s) => (s.platform === platform ? { ...s, contentType } : s)))
  }, [])

  const isPlatformSelected = useCallback(
    (platform: PlatformId) => selections.some((s) => s.platform === platform),
    [selections],
  )

  const getContentType = useCallback(
    (platform: PlatformId) => selections.find((s) => s.platform === platform)?.contentType,
    [selections],
  )

  const getContentTypeConfig = useCallback(
    (platform: PlatformId): ContentType | undefined => {
      const type = selections.find((s) => s.platform === platform)?.contentType
      if (!type) return undefined
      return PLATFORM_MAP[platform].contentTypes.find((ct) => ct.id === type)
    },
    [selections],
  )

  const clearAll = useCallback(() => setSelections([]), [])

  return {
    availablePlatforms: PLATFORM_CONFIG,
    selections,
    selectedPlatformIds: selections.map((s) => s.platform),
    togglePlatform,
    setContentType,
    isPlatformSelected,
    getContentType,
    getContentTypeConfig,
    clearAll,
  }
}
