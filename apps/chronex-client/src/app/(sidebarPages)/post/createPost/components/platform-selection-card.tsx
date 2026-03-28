'use client'

import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import IconRenderer from '@/lib/logoMapping'
import type { PlatformConfig, PlatformId } from '@/config/platforms'

type Props = {
  userLoading: boolean
  platforms: PlatformConfig[]
  selectedPlatforms: Set<PlatformId>
  onTogglePlatform: (id: PlatformId) => void
}

export function PlatformSelectionCard({
  userLoading,
  platforms,
  selectedPlatforms,
  onTogglePlatform,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </div>
          <div>
            <CardTitle>Select Platforms</CardTitle>
            <CardDescription>Choose from your connected platforms</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {userLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading connected platforms…</span>
          </div>
        ) : platforms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-10">
            <AlertCircle className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No platforms connected</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Connect your social accounts in Dashboard to start posting.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {platforms.map((platform) => {
              const selected = selectedPlatforms.has(platform.id)

              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => onTogglePlatform(platform.id)}
                  className={cn(
                    'group relative flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 px-4 py-4 transition-all duration-200',
                    selected
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-border/50 hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-xl transition-all',
                      selected ? 'bg-primary/10' : 'bg-muted group-hover:bg-accent',
                    )}
                  >
                    <IconRenderer name={platform.id} size={26} />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{platform.label}</span>
                  {selected && (
                    <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary shadow-sm">
                      <Check className="size-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
