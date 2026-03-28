'use client'

import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlatformConfig, PlatformId } from '@/config/platforms'
import IconRenderer from '@/lib/logoMapping'
import type { MediaItem, PlatformFormData } from '../types'
import { PlatformFieldsRenderer } from './platform-fields'

type Props = {
  orderedPlatforms: PlatformConfig[]
  activeTab: string
  onActiveTabChange: (value: string) => void
  completionCount: number
  platformData: Map<PlatformId, PlatformFormData>
  onUpdatePlatform: (id: PlatformId, updates: Partial<PlatformFormData>) => void
  onTogglePlatform: (id: PlatformId) => void
  media: MediaItem[]
  mediaLoading: boolean
  isPlatformReady: (platformId: PlatformId, formData?: PlatformFormData) => boolean
}

export function PlatformTabsSection({
  orderedPlatforms,
  activeTab,
  onActiveTabChange,
  completionCount,
  platformData,
  onUpdatePlatform,
  onTogglePlatform,
  media,
  mediaLoading,
  isPlatformReady,
}: Props) {
  if (orderedPlatforms.length === 0) return null

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            3
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Platform Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Configure content type, media, and settings for each platform
            </p>
          </div>
        </div>
        {orderedPlatforms.length > 1 && (
          <Badge
            variant={completionCount === orderedPlatforms.length ? 'default' : 'secondary'}
            className="text-xs"
          >
            {completionCount}/{orderedPlatforms.length} ready
          </Badge>
        )}
      </div>

      {orderedPlatforms.length > 1 && (
        <Progress value={(completionCount / orderedPlatforms.length) * 100} className="h-1" />
      )}

      <Tabs
        value={activeTab || orderedPlatforms[0]?.id || ''}
        onValueChange={onActiveTabChange}
        className="w-full"
      >
        <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border/40 px-2 pt-2">
            <div className="-mx-2 overflow-x-auto px-2 pb-0">
              <TabsList
                variant="line"
                className="inline-flex h-auto min-w-full justify-start gap-1 bg-transparent p-0"
              >
                {orderedPlatforms.map((config) => {
                  const data = platformData.get(config.id)
                  const ready = isPlatformReady(config.id, data)

                  return (
                    <TabsTrigger
                      key={config.id}
                      value={config.id}
                      className="relative shrink-0 gap-2 rounded-none rounded-t-lg border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-5"
                    >
                      <div className="flex size-6 items-center justify-center rounded-md bg-accent/50">
                        <IconRenderer name={config.id} size={16} />
                      </div>
                      <span className="text-sm font-medium">{config.label}</span>
                      {ready ? (
                        <div className="flex size-4 items-center justify-center rounded-full bg-primary/15">
                          <Check className="size-2.5 text-primary" />
                        </div>
                      ) : (
                        <div className="size-1.5 rounded-full bg-muted-foreground" />
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {orderedPlatforms.map((config) => {
              const data = platformData.get(config.id)
              if (!data) return null

              const contentTypeLabel = config.contentTypes.find(
                (contentType) => contentType.id === data.contentType,
              )?.label

              return (
                <TabsContent key={config.id} value={config.id} className="mt-0">
                  <div className="mb-6 flex items-center justify-between rounded-lg bg-accent/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/50">
                        <IconRenderer name={config.id} size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {contentTypeLabel}
                          {data.fileIds.length > 0 && ` · ${data.fileIds.length} media`}
                          {data.caption && ` · ${data.caption.length} chars`}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => onTogglePlatform(config.id)}
                    >
                      <X className="size-3.5" /> Remove
                    </Button>
                  </div>

                  <PlatformFieldsRenderer
                    config={config}
                    formData={data}
                    onChange={(updates) => onUpdatePlatform(config.id, updates)}
                    media={media}
                    mediaLoading={mediaLoading}
                  />
                </TabsContent>
              )
            })}
          </div>
        </div>
      </Tabs>
    </section>
  )
}
