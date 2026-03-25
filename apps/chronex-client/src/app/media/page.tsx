'use client'

import * as React from 'react'
import { trpc } from '@/utils/trpc'
import Image from 'next/image'
import FileUpload from '@/components/fileUpload'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ImageIcon,
  Film,
  LayoutGrid,
  List,
  Search,
  X,
  Upload,
  Play,
  Calendar,
  HardDrive,
  Eye,
  ChevronDown,
  Loader2,
  FileWarning,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() || 'FILE'
}

function truncateName(name: string, maxLen = 28): string {
  if (name.length <= maxLen) return name
  const ext = name.split('.').pop() || ''
  const base = name.slice(0, maxLen - ext.length - 4)
  return `${base}...${ext}`
}

/**
 * Custom hook: debounce a value by `delay` ms.
 * Avoids filtering the entire media list on every keystroke.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/**
 * IntersectionObserver-based hook for lazy rendering.
 * Returns a ref and a boolean indicating whether the element is (or was) visible.
 * Once visible, stays visible (no unmounting).
 */
function useLazyVisible(rootMargin = '200px') {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // once visible, stop observing
        }
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, isVisible }
}

// ─── Preview Modal ────────────────────────────────────────────────────
function PreviewModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 animate-in bg-black/80 backdrop-blur-sm duration-200 fade-in" />

      {/* content */}
      <div
        className="relative z-10 flex max-h-[90vh] max-w-[90vw] animate-in flex-col items-center gap-4 duration-200 zoom-in-95 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20"
          aria-label="Close preview"
        >
          <X className="size-5" />
        </button>

        {/* media */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          {item.type === 'video' ? (
            <video
              src={item.url}
              controls
              autoPlay
              className="max-h-[78vh] max-w-[88vw] object-contain"
            />
          ) : (
            <Image
              src={item.url}
              alt={item.name}
              width={1200}
              height={800}
              className="max-h-[78vh] max-w-[88vw] object-contain"
              unoptimized
            />
          )}
        </div>

        {/* info bar */}
        <div className="flex w-full items-center justify-between rounded-xl bg-white/5 px-5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                item.type === 'video'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-violet-500/20 text-violet-400',
              )}
            >
              {item.type === 'video' ? (
                <Film className="size-4" />
              ) : (
                <ImageIcon className="size-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{truncateName(item.name, 50)}</p>
              <p className="text-xs text-white/50">
                {getFileExtension(item.name)} · {formatDate(item.createdAt)}
              </p>
            </div>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Media Card (Grid) ────────────────────────────────────────────────
const MediaCard = React.memo(function MediaCard({
  item,
  onPreview,
}: {
  item: MediaItem
  onPreview: (item: MediaItem) => void
}) {
  const { ref, isVisible } = useLazyVisible('300px')
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const isVideo = item.type === 'video'

  return (
    <div
      ref={ref}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      onClick={() => onPreview(item)}
    >
      {/* thumbnail area */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!isVisible ? (
          /* Placeholder before intersection */
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {isVideo ? (
              <Film className="size-8 text-muted-foreground/40" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground/40" />
            )}
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="flex flex-col items-center gap-2">
                  {isVideo ? (
                    <Film className="size-8 text-muted-foreground/40" />
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground/40" />
                  )}
                </div>
              </div>
            )}

            {isVideo ? (
              <>
                <video
                  src={item.url}
                  preload="metadata"
                  className={cn(
                    'size-full object-cover transition-all duration-500 group-hover:scale-105',
                    !imageLoaded && 'opacity-0',
                  )}
                  onLoadedData={() => setImageLoaded(true)}
                  muted
                />
                {/* play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-300 group-hover:bg-black/30">
                  <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                    <Play className="ml-0.5 size-5 text-white" fill="white" />
                  </div>
                </div>
              </>
            ) : (
              <Image
                src={item.url}
                alt={item.name}
                fill
                className={cn(
                  'object-cover transition-all duration-500 group-hover:scale-105',
                  !imageLoaded && 'opacity-0',
                )}
                onLoad={() => setImageLoaded(true)}
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            )}
          </>
        )}

        {/* hover overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* hover action */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            <Eye className="size-3.5" />
            Preview
          </div>
        </div>

        {/* type badge */}
        <div
          className={cn(
            'absolute top-2 left-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium backdrop-blur-md',
            isVideo ? 'bg-rose-500/20 text-rose-200' : 'bg-violet-500/20 text-violet-200',
          )}
        >
          {isVideo ? <Film className="size-3" /> : <ImageIcon className="size-3" />}
          {getFileExtension(item.name)}
        </div>
      </div>

      {/* info */}
      <div className="p-3">
        <p className="truncate text-sm font-medium text-foreground">{truncateName(item.name)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  )
})

// ─── Media Row (List) ────────────────────────────────────────────────
const MediaRow = React.memo(function MediaRow({
  item,
  onPreview,
}: {
  item: MediaItem
  onPreview: (item: MediaItem) => void
}) {
  const { ref, isVisible } = useLazyVisible('200px')
  const isVideo = item.type === 'video'

  return (
    <div
      ref={ref}
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:bg-accent/30"
      onClick={() => onPreview(item)}
    >
      {/* thumbnail */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {isVisible ? (
          isVideo ? (
            <>
              <video src={item.url} preload="metadata" className="size-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="size-4 text-white" fill="white" />
              </div>
            </>
          ) : (
            <Image
              src={item.url}
              alt={item.name}
              fill
              className="object-cover"
              unoptimized
              sizes="56px"
              loading="lazy"
            />
          )
        ) : (
          <div className="flex size-full items-center justify-center">
            {isVideo ? (
              <Film className="size-5 text-muted-foreground/40" />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground/40" />
            )}
          </div>
        )}
      </div>

      {/* info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        <div className="mt-1 flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
              isVideo ? 'bg-rose-500/10 text-rose-500' : 'bg-violet-500/10 text-violet-500',
            )}
          >
            {isVideo ? <Film className="size-3" /> : <ImageIcon className="size-3" />}
            {item.type}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {formatDate(item.createdAt)}
          </span>
        </div>
      </div>

      {/* action */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onPreview(item)
        }}
      >
        <Eye className="size-4" />
      </Button>
    </div>
  )
})

// ─── Empty State ──────────────────────────────────────────────────────
function EmptyState({ filter }: { filter: FilterType }) {
  const messages: Record<FilterType, { title: string; desc: string }> = {
    all: {
      title: 'No media files yet',
      desc: 'Upload your first image or video to get started',
    },
    image: {
      title: 'No images found',
      desc: 'Upload some images to see them here',
    },
    video: {
      title: 'No videos found',
      desc: 'Upload some videos to see them here',
    },
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
        <FileWarning className="size-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{messages[filter].title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{messages[filter].desc}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function MediaPage() {
  const { data, isLoading } = trpc.user.getMedia.useQuery()
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [search, setSearch] = React.useState('')
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = React.useState(false)

  // Debounce search to avoid filtering on every keystroke
  const debouncedSearch = useDebouncedValue(search, 200)

  // Stable callback to avoid re-renders of memoized children
  const handlePreview = React.useCallback((item: MediaItem) => {
    setPreviewItem(item)
  }, [])

  // filter & search
  const filteredMedia = React.useMemo(() => {
    if (!data) return []
    return data.filter((item) => {
      const matchesType = filter === 'all' || item.type === filter
      const matchesSearch =
        !debouncedSearch || item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [data, filter, debouncedSearch])

  // counts
  const counts = React.useMemo(() => {
    if (!data) return { all: 0, image: 0, video: 0 }
    return {
      all: data.length,
      image: data.filter((m) => m.type === 'image').length,
      video: data.filter((m) => m.type === 'video').length,
    }
  }, [data])

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="border-b border-border/50 bg-linear-to-b from-accent/30 to-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <HardDrive className="size-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Media Library
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {counts.all} file{counts.all !== 1 ? 's' : ''} · {counts.image} image
                      {counts.image !== 1 ? 's' : ''} · {counts.video} video
                      {counts.video !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              <Button className="cursor-pointer gap-2" onClick={() => setShowUpload(!showUpload)}>
                {showUpload ? (
                  <>
                    <ChevronDown className="size-4" />
                    Hide uploader
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload files
                  </>
                )}
              </Button>
            </div>

            {/* upload area — centered on x-axis */}
            <div
              className={cn(
                'grid transition-all duration-300',
                showUpload ? 'mt-6 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="flex justify-center overflow-hidden">
                <FileUpload />
              </div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            {/* filter tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/50 p-1">
              {(
                [
                  { key: 'all', label: 'All', icon: LayoutGrid },
                  { key: 'image', label: 'Images', icon: ImageIcon },
                  { key: 'video', label: 'Videos', icon: Film },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                    filter === key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                  <span
                    className={cn(
                      'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                      filter === key
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>

            {/* spacer */}
            <div className="flex-1" />

            {/* search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search media..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-48 rounded-lg border border-border/50 bg-muted/50 pr-3 pl-9 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground/60 focus:w-64 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* view mode */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border/50 p-0.5">
              {(
                [
                  { key: 'grid' as ViewMode, icon: LayoutGrid },
                  { key: 'list' as ViewMode, icon: List },
                ] as const
              ).map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-all',
                    viewMode === key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading media...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <EmptyState filter={filter} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMedia.map((item) => (
                <MediaCard key={item.id} item={item as MediaItem} onPreview={handlePreview} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map((item) => (
                <MediaRow key={item.id} item={item as MediaItem} onPreview={handlePreview} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Preview Modal ─────────────────────────────────────────── */}
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
    </>
  )
}
