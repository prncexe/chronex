'use client'

import * as React from 'react'
import Image from 'next/image'
import { Check, ImageIcon, Info, Loader2, Play, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ContentType } from '@/config/platforms'
import type { MediaItem } from '../types'

type MediaPickerProps = {
  media: MediaItem[]
  isLoading: boolean
  selectedIds: string[]
  onToggle: (id: string) => void
  allowedTypes: ('image' | 'video')[] | null
  ctConfig: ContentType
}

export const MediaPicker = React.memo(function MediaPicker({
  media,
  isLoading,
  selectedIds,
  onToggle,
  allowedTypes,
  ctConfig,
}: MediaPickerProps) {
  const [search, setSearch] = React.useState('')
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds])

  const filtered = React.useMemo(() => {
    return media.filter((item) => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
      const matchesAllowed = !allowedTypes || allowedTypes.includes(item.type as 'image' | 'video')
      return matchesSearch && matchesAllowed
    })
  }, [allowedTypes, media, search])

  if (!ctConfig.requiresMedia && ctConfig.maxMedia === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="gap-2 text-muted-foreground">
          <ImageIcon className="size-4" /> Media files
        </Label>
        {selectedSet.size > 0 && (
          <Badge
            variant={
              selectedSet.size >= ctConfig.minMedia && selectedSet.size <= ctConfig.maxMedia
                ? 'default'
                : 'destructive'
            }
            className="text-[11px]"
          >
            {selectedSet.size}/{ctConfig.maxMedia}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        {ctConfig.minMedia === ctConfig.maxMedia
          ? `Exactly ${ctConfig.minMedia} file${ctConfig.minMedia > 1 ? 's' : ''} required`
          : `${ctConfig.minMedia}-${ctConfig.maxMedia} files`}
        {allowedTypes && <span className="ml-1">· {allowedTypes.join(' or ')} only</span>}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-9 pl-9 text-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No matching media found</p>
      ) : (
        <ScrollArea className="h-50">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {filtered.map((item) => {
              const id = String(item.id)
              const selected = selectedSet.has(id)
              const disabled = !selected && selectedSet.size >= ctConfig.maxMedia
              const isVideo = item.type === 'video'

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(id)}
                  className={cn(
                    'group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200',
                    selected
                      ? 'scale-[0.97] border-primary ring-2 ring-primary/20'
                      : disabled
                        ? 'cursor-not-allowed border-border/20 opacity-30'
                        : 'border-transparent hover:scale-[0.98] hover:border-primary/40',
                  )}
                >
                  <div className="relative size-full bg-muted">
                    {isVideo ? (
                      <>
                        <video
                          src={item.url}
                          className="size-full object-cover"
                          preload="metadata"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="size-3.5 text-white" fill="white" />
                        </div>
                      </>
                    ) : (
                      <Image
                        src={item.url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="80px"
                      />
                    )}
                  </div>

                  {selected && (
                    <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary shadow-sm">
                      <Check className="size-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
})
