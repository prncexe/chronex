'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Calendar,
  Eye,
  Film,
  Grid2X2,
  HardDrive,
  ImageIcon,
  List,
  Loader2,
  Play,
  Search,
  Upload,
  X,
} from 'lucide-react'
import FileUpload from '@/components/fileUpload'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type MediaItem = {
  id: number
  name: string
  url: string
  type: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
  downloadToken: string | null
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'image' | 'video'

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getFileExtension(name: string) {
  return name.split('.').pop()?.toUpperCase() || 'FILE'
}

function truncateName(name: string, maxLen = 32) {
  if (name.length <= maxLen) return name
  const ext = name.split('.').pop() || ''
  const base = name.slice(0, maxLen - ext.length - 4)
  return `${base}...${ext}`
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

function PreviewModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-5xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate">{item.name}</CardTitle>
            <CardDescription>
              {getFileExtension(item.name)} · {formatDate(item.createdAt)}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close preview">
            <X />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border bg-muted/40">
            {item.type === 'video' ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="max-h-[72vh] w-full object-contain"
              />
            ) : (
              <div className="relative h-[72vh] w-full">
                <Image src={item.url} alt={item.name} fill unoptimized className="object-contain" />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                Open file
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MediaCard({ item, onPreview }: { item: MediaItem; onPreview: (item: MediaItem) => void }) {
  const isVideo = item.type === 'video'

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-colors hover:border-border/80 hover:bg-muted/20"
      onClick={() => onPreview(item)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted/40">
          {isVideo ? (
            <>
              <video src={item.url} preload="metadata" className="size-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className="flex size-10 items-center justify-center rounded-full bg-background/80">
                  <Play className="text-foreground" fill="currentColor" />
                </div>
              </div>
            </>
          ) : (
            <Image
              src={item.url}
              alt={item.name}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
            />
          )}

          <div className="absolute top-3 left-3">
            <Badge variant="secondary">{isVideo ? 'Video' : 'Image'}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <p className="truncate font-medium">{truncateName(item.name)}</p>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{getFileExtension(item.name)}</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MediaRow({ item, onPreview }: { item: MediaItem; onPreview: (item: MediaItem) => void }) {
  const isVideo = item.type === 'video'

  return (
    <Card className="transition-colors hover:border-border/80 hover:bg-muted/20">
      <CardContent className="flex items-center gap-4 p-4">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted/40"
        >
          {isVideo ? (
            <>
              <video src={item.url} preload="metadata" className="size-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <Play className="text-white" fill="currentColor" />
              </div>
            </>
          ) : (
            <Image
              src={item.url}
              alt={item.name}
              fill
              unoptimized
              className="object-cover"
              sizes="64px"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {isVideo ? <Film className="size-4" /> : <ImageIcon className="size-4" />}
              {isVideo ? 'Video' : 'Image'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-4" />
              {formatDate(item.createdAt)}
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => onPreview(item)}>
          <Eye data-icon="inline-start" />
          Preview
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState({ filter }: { filter: FilterType }) {
  const text =
    filter === 'all'
      ? 'Upload your first image or video to get started.'
      : filter === 'image'
        ? 'No images match the current filter.'
        : 'No videos match the current filter.'

  return (
    <Alert className="border-border/60 bg-card">
      <AlertTitle>No media found</AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  )
}

export default function MediaPage() {
  const { data, isLoading } = trpc.user.getMedia.useQuery()
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [search, setSearch] = React.useState('')
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = React.useState(false)

  const debouncedSearch = useDebouncedValue(search, 200)

  const filteredMedia = React.useMemo(() => {
    if (!data) return []

    return data.filter((item) => {
      const matchesType = filter === 'all' || item.type === filter
      const matchesSearch =
        !debouncedSearch || item.name.toLowerCase().includes(debouncedSearch.toLowerCase())

      return matchesType && matchesSearch
    })
  }, [data, filter, debouncedSearch])

  const counts = React.useMemo(() => {
    if (!data) return { all: 0, image: 0, video: 0 }

    return {
      all: data.length,
      image: data.filter((item) => item.type === 'image').length,
      video: data.filter((item) => item.type === 'video').length,
    }
  }, [data])

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <HardDrive />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>Media Library</CardTitle>
                <CardDescription>
                  Manage your uploaded images and videos in one place.
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="secondary">{counts.all} total</Badge>
                  <Badge variant="outline">{counts.image} images</Badge>
                  <Badge variant="outline">{counts.video} videos</Badge>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowUpload((value) => !value)}>
              <Upload data-icon="inline-start" />
              {showUpload ? 'Hide uploader' : 'Upload files'}
            </Button>
          </CardHeader>
          {showUpload ? (
            <CardContent>
              <FileUpload />
            </CardContent>
          ) : null}
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search media..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(value) => {
                  if (value) setFilter(value as FilterType)
                }}
                variant="outline"
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="image">Images</ToggleGroupItem>
                <ToggleGroupItem value="video">Videos</ToggleGroupItem>
              </ToggleGroup>

              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => {
                  if (value) setViewMode(value as ViewMode)
                }}
                variant="outline"
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <Grid2X2 />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" />
              Loading media...
            </CardContent>
          </Card>
        ) : filteredMedia.length === 0 ? (
          <EmptyState filter={filter} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {filteredMedia.map((item) => (
              <MediaCard key={item.id} item={item as MediaItem} onPreview={setPreviewItem} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMedia.map((item) => (
              <MediaRow key={item.id} item={item as MediaItem} onPreview={setPreviewItem} />
            ))}
          </div>
        )}
      </div>

      {previewItem ? (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      ) : null}
    </>
  )
}
