'use client'
import { toast } from 'sonner'
import * as React from 'react'
import { trpc } from '@/utils/trpc'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'

import IconRenderer from '@/lib/logoMapping'
import {
  PLATFORM_CONFIG,
  PLATFORM_MAP,
  type PlatformId,
  type PlatformConfig,
  type ContentType,
} from '@/config/platforms'
import type { platformSchema } from '@/types/zod/platform'
import {
  CalendarDays,
  ImageIcon,
  Play,
  Check,
  X,
  AlertCircle,
  Search,
  Loader2,
  Info,
  Send,
  Hash,
  MessageSquare,
  Type,
  Palette,
  Clock,
  Link2,
  Pencil,
  Sparkles,
  FileText,
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

interface PlatformFormData {
  platform: PlatformId
  contentType: string
  caption: string
  description?: string
  fileIds: string[]
  channelId?: string
  embed?: {
    title?: string
    description?: string
    color: number
    footer?: { text: string }
    timestamp: string
    image?: { url: string }
    thumbnail?: { url: string }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────
function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return combined
}

function getAllowedMediaTypes(
  platform: PlatformId,
  contentTypeId: string,
): ('image' | 'video')[] | null {
  if (platform === 'instagram') {
    if (contentTypeId === 'image' || contentTypeId === 'story') return ['image']
    if (contentTypeId === 'reel') return ['video']
    if (contentTypeId === 'carousel') return ['image', 'video']
  }
  if (platform === 'linkedin') {
    if (contentTypeId === 'image') return ['image']
    if (contentTypeId === 'video') return ['video']
    if (contentTypeId === 'MultiPost') return ['image', 'video']
    if (contentTypeId === 'text') return null
  }
  if (platform === 'threads') {
    if (contentTypeId === 'text') return null
    if (contentTypeId === 'image') return ['image']
    if (contentTypeId === 'video') return ['video']
  }
  if (platform === 'slack' || platform === 'discord') {
    if (['message', 'embed'].includes(contentTypeId)) return null
    return ['image', 'video']
  }
  return ['image', 'video']
}

function getCaptionLimit(platformId: PlatformId, contentType: string): number {
  if (platformId === 'instagram') return contentType === 'story' ? 125 : 2200
  if (platformId === 'linkedin') return 3000
  if (platformId === 'threads') return 500
  if (platformId === 'slack') return 4000
  if (platformId === 'discord') return 2000
  return 2000
}

// ─── Media Picker ─────────────────────────────────────────────────────
const MediaPicker = React.memo(function MediaPicker({
  media,
  isLoading,
  selectedIds,
  onToggle,
  allowedTypes,
  ctConfig,
}: {
  media: MediaItem[]
  isLoading: boolean
  selectedIds: string[]
  onToggle: (id: string) => void
  allowedTypes: ('image' | 'video')[] | null
  ctConfig: ContentType
}) {
  const [search, setSearch] = React.useState('')
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds])
  const filtered = React.useMemo(() => {
    if (!media) return []
    return media.filter((m) => {
      const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
      const matchesAllowed = !allowedTypes || allowedTypes.includes(m.type as 'image' | 'video')
      return matchesSearch && matchesAllowed
    })
  }, [media, search, allowedTypes])

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
          : `${ctConfig.minMedia}–${ctConfig.maxMedia} files`}
        {allowedTypes && <span className="ml-1">· {allowedTypes.join(' or ')} only</span>}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <ScrollArea className="h-[200px]">
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

// ─── Platform Tab Content ─────────────────────────────────────────────
const PlatformTabContent = React.memo(function PlatformTabContent({
  config,
  formData,
  onChange,
  media,
  mediaLoading,
}: {
  config: PlatformConfig
  formData: PlatformFormData
  onChange: (updates: Partial<PlatformFormData>) => void
  media: MediaItem[]
  mediaLoading: boolean
}) {
  const ctConfig = config.contentTypes.find((ct) => ct.id === formData.contentType)!
  const allowedTypes = getAllowedMediaTypes(config.id, formData.contentType)
  const captionLimit = getCaptionLimit(config.id, formData.contentType)

  const { data: channels, isLoading: channelsLoading } = trpc.user.getChannels.useQuery(
    { platform: config.id as 'slack' | 'discord' },
    { enabled: config.id === 'slack' || config.id === 'discord' },
  )

  const toggleMedia = React.useCallback(
    (id: string) => {
      const current = new Set(formData.fileIds)
      if (current.has(id)) {
        current.delete(id)
      } else {
        current.add(id)
      }
      onChange({ fileIds: Array.from(current) })
    },
    [formData.fileIds, onChange],
  )

  return (
    <div className="space-y-6">
      {/* Content type selector */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Content Type
        </Label>
        <div className="flex flex-wrap gap-2">
          {config.contentTypes.map((ct) => (
            <button
              key={ct.id}
              type="button"
              onClick={() => onChange({ contentType: ct.id, fileIds: [] })}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200',
                formData.contentType === ct.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Platform-specific caption (override) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            {config.id === 'slack' || config.id === 'discord' ? 'Message' : 'Caption'}
            {config.id === 'slack' && formData.contentType === 'file' && (
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            )}
          </Label>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formData.caption.length}/{captionLimit}
          </span>
        </div>
        <Textarea
          placeholder={`Write your ${config.label} ${config.id === 'slack' || config.id === 'discord' ? 'message' : 'caption'}...`}
          value={formData.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          maxLength={captionLimit}
          rows={3}
          className="resize-none"
        />
        <Progress value={(formData.caption.length / captionLimit) * 100} className="h-1" />
      </div>

      {/* Threads description */}
      {config.id === 'threads' && formData.contentType === 'text' && (
        <div className="space-y-2">
          <Label className="gap-2">
            <Type className="size-4 text-muted-foreground" /> Description{' '}
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            placeholder="Extended text content..."
            value={formData.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            maxLength={10000}
            rows={3}
            className="resize-none"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {(formData.description || '').length}/10,000
          </p>
        </div>
      )}

      {/* Media selector */}
      <MediaPicker
        media={media}
        isLoading={mediaLoading}
        selectedIds={formData.fileIds}
        onToggle={toggleMedia}
        allowedTypes={allowedTypes}
        ctConfig={ctConfig}
      />

      {/* Slack fields */}
      {config.id === 'slack' && (
        <div className="space-y-2">
          <Label className="gap-2">
            <Hash className="size-4 text-muted-foreground" /> Channel{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.channelId || ''}
            onValueChange={(val) => onChange({ channelId: val })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={channelsLoading ? 'Loading channels...' : 'Select a channel'}
              />
            </SelectTrigger>
            <SelectContent>
              {channels?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  #{c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Discord channel */}
      {config.id === 'discord' && (
        <div className="space-y-2">
          <Label className="gap-2">
            <Hash className="size-4 text-muted-foreground" /> Channel{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.channelId || ''}
            onValueChange={(val) => onChange({ channelId: val })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={channelsLoading ? 'Loading channels...' : 'Select a channel'}
              />
            </SelectTrigger>
            <SelectContent>
              {channels?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  #{c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Discord embed */}
      {config.id === 'discord' && formData.contentType === 'embed' && (
        <Card className="border-border/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-primary" /> Embed Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Title</Label>
                <Input
                  placeholder="Embed title"
                  value={formData.embed?.title || ''}
                  onChange={(e) =>
                    onChange({ embed: { ...formData.embed!, title: e.target.value } })
                  }
                  maxLength={256}
                />
              </div>
              <div className="space-y-2">
                <Label className="gap-1.5 text-xs">
                  <Palette className="size-3" /> Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="FF5733"
                    value={
                      formData.embed?.color !== undefined
                        ? formData.embed.color.toString(16).toUpperCase().padStart(6, '0')
                        : ''
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 16)
                      if (!isNaN(val) && val <= 0xffffff)
                        onChange({ embed: { ...formData.embed!, color: val } })
                    }}
                    maxLength={6}
                  />
                  {formData.embed?.color !== undefined && (
                    <div
                      className="size-9 shrink-0 rounded-lg border shadow-sm"
                      style={{
                        backgroundColor: `#${formData.embed.color.toString(16).padStart(6, '0')}`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                placeholder="Embed description..."
                value={formData.embed?.description || ''}
                onChange={(e) =>
                  onChange({ embed: { ...formData.embed!, description: e.target.value } })
                }
                maxLength={4096}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="gap-1.5 text-xs">
                  <Clock className="size-3" /> Timestamp
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.embed?.timestamp ? formData.embed.timestamp.slice(0, 16) : ''}
                  onChange={(e) =>
                    onChange({
                      embed: {
                        ...formData.embed!,
                        timestamp: new Date(e.target.value).toISOString(),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Footer</Label>
                <Input
                  placeholder="Footer text"
                  value={formData.embed?.footer?.text || ''}
                  onChange={(e) =>
                    onChange({ embed: { ...formData.embed!, footer: { text: e.target.value } } })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="gap-1.5 text-xs">
                  <ImageIcon className="size-3" /> Image URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={formData.embed?.image?.url || ''}
                  onChange={(e) =>
                    onChange({ embed: { ...formData.embed!, image: { url: e.target.value } } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="gap-1.5 text-xs">
                  <Link2 className="size-3" /> Thumbnail URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={formData.embed?.thumbnail?.url || ''}
                  onChange={(e) =>
                    onChange({ embed: { ...formData.embed!, thumbnail: { url: e.target.value } } })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

// ─── Build Payload ────────────────────────────────────────────────────
function buildPlatformPayload(pd: PlatformFormData): Record<string, unknown> {
  const p = pd.platform,
    t = pd.contentType
  if (p === 'instagram')
    return { platform: p, type: t, caption: pd.caption || '', fileIds: pd.fileIds }
  if (p === 'linkedin') {
    if (t === 'text') return { platform: p, type: t, caption: pd.caption || '' }
    return { platform: p, type: t, caption: pd.caption || '', fileIds: pd.fileIds }
  }
  if (p === 'threads') {
    if (t === 'text') {
      const payload: Record<string, unknown> = { platform: p, type: t, caption: pd.caption || '' }
      if (pd.description) payload.description = pd.description
      return payload
    }
    return { platform: p, type: t, caption: pd.caption || '', fileIds: pd.fileIds }
  }
  if (p === 'slack') {
    if (t === 'message')
      return {
        platform: p,
        type: t,
        caption: pd.caption || '',
        channelId: pd.channelId || '',
      }
    const payload: Record<string, unknown> = {
      platform: p,
      type: t,
      fileIds: pd.fileIds,
      channelId: pd.channelId || '',
    }
    if (pd.caption) payload.caption = pd.caption
    return payload
  }
  if (p === 'discord') {
    if (t === 'message')
      return { platform: p, type: t, caption: pd.caption || '', channelId: pd.channelId || '' }
    if (t === 'embed')
      return {
        platform: p,
        type: t,
        embed: pd.embed || { color: 0x5865f2, timestamp: new Date().toISOString() },
        channelId: pd.channelId || '',
      }
    const payload: Record<string, unknown> = {
      platform: p,
      type: t,
      fileIds: pd.fileIds,
      channelId: pd.channelId || '',
    }
    if (pd.caption) payload.caption = pd.caption
    return payload
  }
  return { platform: p, type: t, caption: pd.caption || '' }
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function CreatePostForm() {
  const router = useRouter()

  const { data: media, isLoading: mediaLoading } = trpc.user.getMedia.useQuery()
  const { data: userData, isLoading: userLoading } = trpc.user.getUser.useQuery()
  const createPost = trpc.post.createPost.useMutation()

  const [title, setTitle] = React.useState('')
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(() => new Date())

  // Custom manual time state
  const [timeHour, setTimeHour] = React.useState(() => {
    const h = new Date().getHours() % 12
    return String(h === 0 ? 12 : h).padStart(2, '0')
  })
  const [timeMinute, setTimeMinute] = React.useState(() =>
    String(new Date().getMinutes()).padStart(2, '0'),
  )
  const [timeAmPm, setTimeAmPm] = React.useState<'AM' | 'PM'>(() =>
    new Date().getHours() >= 12 ? 'PM' : 'AM',
  )

  const scheduledTime = React.useMemo(() => {
    let h = parseInt(timeHour, 10) || 0
    if (timeAmPm === 'PM' && h < 12) h += 12
    if (timeAmPm === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(timeMinute || '0').padStart(2, '0')}`
  }, [timeHour, timeMinute, timeAmPm])

  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Set<PlatformId>>(new Set())
  const [platformData, setPlatformData] = React.useState<Map<PlatformId, PlatformFormData>>(
    new Map(),
  )
  const [errors, setErrors] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<string>('')
  const [unifiedCaption, setUnifiedCaption] = React.useState('')

  // Filter platforms to only those the user has connected
  const connectedPlatforms = React.useMemo(() => {
    if (!userData?.authTokens) return new Set<string>()
    return new Set(userData.authTokens.map((t) => t.platform))
  }, [userData])

  const availablePlatformConfigs = React.useMemo(() => {
    return PLATFORM_CONFIG.filter((p) => connectedPlatforms.has(p.id))
  }, [connectedPlatforms])

  // ── platform toggle
  const togglePlatform = (id: PlatformId) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setPlatformData((pd) => {
          const m = new Map(pd)
          m.delete(id)
          return m
        })
      } else {
        next.add(id)
        const config = PLATFORM_MAP[id]
        const defaultCt = config.contentTypes[0]
        const defaultData: PlatformFormData = {
          platform: id,
          contentType: defaultCt.id,
          caption: unifiedCaption,
          fileIds: [],
        }
        if (id === 'discord') {
          defaultData.embed = { color: 0x5865f2, timestamp: new Date().toISOString() }
        }
        setPlatformData((pd) => new Map(pd).set(id, defaultData))
        if (!activeTab) setActiveTab(id)
      }
      return next
    })
  }

  // Sync unified caption to all platforms
  const handleUnifiedCaptionChange = React.useCallback((value: string) => {
    setUnifiedCaption(value)
    setPlatformData((prev) => {
      const m = new Map(prev)
      for (const [pid, pd] of m) {
        m.set(pid, { ...pd, caption: value })
      }
      return m
    })
  }, [])

  const updatePlatform = React.useCallback((id: PlatformId, updates: Partial<PlatformFormData>) => {
    setPlatformData((prev) => {
      const m = new Map(prev)
      const current = m.get(id)
      if (current) m.set(id, { ...current, ...updates })
      return m
    })
  }, [])

  // ── validation
  const validate = (): string[] => {
    const errs: string[] = []
    if (!title.trim()) errs.push('Post title is required')
    if (!scheduledDate) errs.push('Schedule date is required')
    else {
      const full = combineDateAndTime(scheduledDate, scheduledTime)
      if (full < new Date(Date.now() - 60000)) errs.push('Schedule date cannot be in the past')
    }
    if (selectedPlatforms.size === 0) errs.push('Select at least one platform')

    for (const pid of selectedPlatforms) {
      const pd = platformData.get(pid)
      const config = PLATFORM_MAP[pid]
      const label = config?.label || pid
      if (!pd) {
        errs.push(`${label}: configuration missing`)
        continue
      }

      const ct = config?.contentTypes.find((c) => c.id === pd.contentType)
      if (ct?.requiresMedia) {
        if (pd.fileIds.length < ct.minMedia)
          errs.push(
            `${label} (${ct.label}): needs at least ${ct.minMedia} file${ct.minMedia > 1 ? 's' : ''}`,
          )
        if (pd.fileIds.length > ct.maxMedia)
          errs.push(`${label} (${ct.label}): max ${ct.maxMedia} file${ct.maxMedia > 1 ? 's' : ''}`)
      }
      if (['instagram', 'linkedin', 'threads'].includes(pid) && !pd.caption.trim())
        errs.push(`${label}: Caption is required`)
      if (
        (pid === 'slack' || pid === 'discord') &&
        pd.contentType === 'message' &&
        !pd.caption.trim()
      )
        errs.push(`${label}: Message is required`)
      if ((pid === 'slack' || pid === 'discord') && !pd.channelId?.trim())
        errs.push(`${label}: Channel ID is required`)
      if (pid === 'discord' && pd.contentType === 'embed') {
        if (!pd.embed?.timestamp) errs.push(`${label}: Embed timestamp is required`)
        if (pd.embed?.color === undefined) errs.push(`${label}: Embed color is required`)
      }
    }
    return errs
  }

  // ── submit
  const handleSubmit = async () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setIsSubmitting(true)
    try {
      const allFileIds = new Set<string>()
      const platformdata = Array.from(selectedPlatforms).map((pid) => {
        const pd = platformData.get(pid)!
        pd.fileIds.forEach((id) => allFileIds.add(id))
        return buildPlatformPayload(pd)
      })
      const fullScheduledAt = combineDateAndTime(scheduledDate!, scheduledTime)
      await createPost.mutateAsync({
        title,
        content: Array.from(allFileIds),
        platforms: Array.from(selectedPlatforms),
        scheduledAt: fullScheduledAt,
        platformdata: platformdata as platformSchema,
      })
      toast.success('Post created successfully')
      // setTitle('')
      // setScheduledAt(formatDateForInput(new Date(Date.now())))
      // setSelectedPlatforms(new Set())
      // setPlatformData(new Map())
      // setErrors([])
      // setUnifiedCaption('')
      router.push('/post')
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to create post'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const orderedPlatforms = React.useMemo(
    () => availablePlatformConfigs.filter((p) => selectedPlatforms.has(p.id)),
    [availablePlatformConfigs, selectedPlatforms],
  )
  const completionCount = React.useMemo(
    () =>
      orderedPlatforms.filter((p) => {
        const pd = platformData.get(p.id)
        if (!pd) return false
        const ct = p.contentTypes.find((c) => c.id === pd.contentType)
        if (ct?.requiresMedia && pd.fileIds.length < ct.minMedia) return false
        if (['instagram', 'linkedin', 'threads'].includes(p.id) && !pd.caption.trim()) return false
        return true
      }).length,
    [orderedPlatforms, platformData],
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ── */}
      <div className="border-b border-border/50 bg-linear-to-b from-primary/3 to-transparent">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Post</h1>
                <p className="text-sm text-muted-foreground">
                  Compose and schedule across all your platforms
                </p>
              </div>
            </div>
          </div>
          <Button
            className="cursor-pointer gap-2 px-6 shadow-sm"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPlatforms.size === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Send className="size-4" /> Schedule Post
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        {/* ── Errors ── */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              <p className="mb-1 font-medium">Please fix the following errors:</p>
              <ul className="space-y-0.5">
                {errors.map((e, i) => (
                  <li key={i} className="text-xs">
                    • {e}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Step 1: Platforms ── */}
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
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading connected platforms…
                </span>
              </div>
            ) : availablePlatformConfigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-10">
                <AlertCircle className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No platforms connected</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Connect your social accounts in Dashboard to start posting.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {availablePlatformConfigs.map((p) => {
                  const selected = selectedPlatforms.has(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
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
                        <IconRenderer name={p.id} size={26} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{p.label}</span>
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

        {/* ── Step 2: Basic Info + Unified Caption ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </div>
              <div>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>
                  Set title, schedule, and a shared caption across platforms
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="post-title">Internal Title</Label>
              <Input
                id="post-title"
                placeholder="e.g. Spring Campaign Launch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label className="gap-2">
                <CalendarDays className="size-4 text-muted-foreground" /> Schedule
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="scheduled-at"
                        variant="outline"
                        className={cn(
                          'w-full justify-start gap-2 text-left font-normal',
                          !scheduledDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarDays className="size-4" />
                        {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={(date) => {
                          setScheduledDate(date)
                          setCalendarOpen(false)
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scheduled-time" className="text-xs text-muted-foreground">
                    <Clock className="size-3" /> Time (Local)
                  </Label>
                  <div className="flex h-9 items-center gap-1 rounded-md border border-input shadow-sm">
                    <Input
                      className="h-8 w-12 border-none px-1 text-center shadow-none focus-visible:ring-0"
                      maxLength={2}
                      placeholder="12"
                      value={timeHour}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        if (val.length <= 2) setTimeHour(val)
                      }}
                      onBlur={() => {
                        let h = parseInt(timeHour, 10)
                        if (isNaN(h) || h < 1) h = 12
                        if (h > 12) h = 12
                        setTimeHour(String(h).padStart(2, '0'))
                      }}
                    />
                    <span className="font-medium text-muted-foreground">:</span>
                    <Input
                      className="h-8 w-12 border-none px-1 text-center shadow-none focus-visible:ring-0"
                      maxLength={2}
                      placeholder="00"
                      value={timeMinute}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        if (val.length <= 2) setTimeMinute(val)
                      }}
                      onBlur={() => {
                        let m = parseInt(timeMinute, 10)
                        if (isNaN(m) || m < 0) m = 0
                        if (m > 59) m = 59
                        setTimeMinute(String(m).padStart(2, '0'))
                      }}
                    />
                    <div className="mr-1 flex flex-col border-l border-input">
                      <button
                        type="button"
                        onClick={() => setTimeAmPm('AM')}
                        className={cn(
                          'cursor-pointer rounded-tr-sm px-1.5 py-[3px] text-[9px] leading-none font-bold',
                          timeAmPm === 'AM'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeAmPm('PM')}
                        className={cn(
                          'cursor-pointer rounded-br-sm px-1.5 py-[3px] text-[9px] leading-none font-bold',
                          timeAmPm === 'PM'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {scheduledDate
                  ? `${combineDateAndTime(scheduledDate, scheduledTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })} (local)`
                  : 'No date selected'}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="gap-2">
                  <FileText className="size-4 text-muted-foreground" /> Unified Caption
                </Label>
                {selectedPlatforms.size > 0 && (
                  <Badge variant="secondary" className="text-[11px]">
                    Applies to {selectedPlatforms.size} platform
                    {selectedPlatforms.size > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <Textarea
                placeholder="Write a caption that will be shared across all selected platforms. You can customize per-platform below."
                value={unifiedCaption}
                onChange={(e) => handleUnifiedCaptionChange(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                This caption syncs to all platforms. Override individually in the platform tabs
                below.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Step 3: Platform Tabs ── */}
        {orderedPlatforms.length > 0 && (
          <section className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Platform Configuration
                  </h2>
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
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Tab triggers as styled horizontal bar */}
              <div className="w-full rounded-xl border border-border/60 bg-card">
                <div className="border-b border-border/40 px-2 pt-2">
                  <TabsList
                    variant="line"
                    className="flex h-auto w-full justify-start gap-0 bg-transparent p-0"
                  >
                    {orderedPlatforms.map((config) => {
                      const pd = platformData.get(config.id)
                      const ct = pd
                        ? config.contentTypes.find((c) => c.id === pd.contentType)
                        : null
                      const isReady =
                        pd && (!ct?.requiresMedia || pd.fileIds.length >= (ct?.minMedia ?? 0))

                      return (
                        <TabsTrigger
                          key={config.id}
                          value={config.id}
                          className="relative flex-initial gap-2 rounded-none rounded-t-lg border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                          <div className="flex size-6 items-center justify-center rounded-md bg-accent/50">
                            <IconRenderer name={config.id} size={16} />
                          </div>
                          <span className="text-sm font-medium">{config.label}</span>
                          {isReady ? (
                            <div className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15">
                              <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          ) : ct?.requiresMedia ? (
                            <div className="size-1.5 rounded-full bg-amber-500" />
                          ) : null}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>

                {/* Tab content */}
                <div className="p-5 sm:p-6">
                  {orderedPlatforms.map((config) => {
                    const pd = platformData.get(config.id)
                    if (!pd) return null
                    const ctLabel = config.contentTypes.find(
                      (ct) => ct.id === pd.contentType,
                    )?.label
                    return (
                      <TabsContent key={config.id} value={config.id} className="mt-0">
                        {/* Platform header inside content */}
                        <div className="mb-6 flex items-center justify-between rounded-lg bg-accent/30 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/50">
                              <IconRenderer name={config.id} size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {config.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {ctLabel}
                                {pd.fileIds.length > 0 && ` · ${pd.fileIds.length} media`}
                                {pd.caption && ` · ${pd.caption.length} chars`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => togglePlatform(config.id)}
                          >
                            <X className="size-3.5" /> Remove
                          </Button>
                        </div>

                        <PlatformTabContent
                          config={config}
                          formData={pd}
                          onChange={(updates) => updatePlatform(config.id, updates)}
                          media={(media as MediaItem[]) || []}
                          mediaLoading={mediaLoading}
                        />
                      </TabsContent>
                    )
                  })}
                </div>
              </div>
            </Tabs>
          </section>
        )}

        {/* ── Bottom Action ── */}
        <div className="flex items-center justify-between border-t border-border/50 pt-6 pb-8">
          <p className="text-sm text-muted-foreground">
            {selectedPlatforms.size > 0
              ? `${selectedPlatforms.size} platform${selectedPlatforms.size > 1 ? 's' : ''} selected`
              : 'No platforms selected'}
          </p>
          <Button
            className="cursor-pointer gap-2 px-6 shadow-sm"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPlatforms.size === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Send className="size-4" /> Schedule Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
