'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { AlertCircle, Loader2, Pencil, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PLATFORM_CONFIG, type PlatformId } from '@/config/platforms'
import { trpc } from '@/utils/trpc'
import { PlatformSelectionCard } from './components/platform-selection-card'
import { PlatformTabsSection } from './components/platform-tabs-section'
import { PostDetailsCard } from './components/post-details-card'
import type { PlatformFormData } from './types'
import { getErrorMessage } from '@/lib/client-errors'
import { CLIENT_LIMITS } from '@/lib/client-limits'
import {
  buildPlatformDataPayload,
  combineDateAndTime,
  createDefaultPlatformData,
  isPlatformReady,
  validateCreatePostForm,
} from './utils'

const platformBlacklist = (process.env.NEXT_PUBLIC_PLATFORM_BLACKLIST ?? '')
  .split(',')
  .map((platform) => platform.trim().toLowerCase())
  .filter(Boolean)

export default function CreatePostForm() {
  const utils = trpc.useUtils()
  const router = useRouter()

  const { data: media, isLoading: mediaLoading } = trpc.user.getMedia.useQuery()
  const { data: userData, isLoading: userLoading } = trpc.user.getUser.useQuery()
  const { data: postsSummary, isLoading: postsSummaryLoading } = trpc.post.getUserPosts.useQuery({
    page: 1,
    pageSize: 1,
  })
  const createPost = trpc.post.createPost.useMutation()

  const [title, setTitle] = React.useState('')
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(() => new Date())
  const [timeHour, setTimeHour] = React.useState(() => {
    const hours = new Date().getHours() % 12
    return String(hours === 0 ? 12 : hours).padStart(2, '0')
  })
  const [timeMinute, setTimeMinute] = React.useState(() =>
    String(new Date().getMinutes()).padStart(2, '0'),
  )
  const [timeAmPm, setTimeAmPm] = React.useState<'AM' | 'PM'>(() =>
    new Date().getHours() >= 12 ? 'PM' : 'AM',
  )
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Set<PlatformId>>(new Set())
  const [platformData, setPlatformData] = React.useState<Map<PlatformId, PlatformFormData>>(
    new Map(),
  )
  const [errors, setErrors] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('')
  const [unifiedCaption, setUnifiedCaption] = React.useState('')

  const scheduledTime = React.useMemo(() => {
    let hours = parseInt(timeHour, 10) || 0
    if (timeAmPm === 'PM' && hours < 12) hours += 12
    if (timeAmPm === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${String(timeMinute || '0').padStart(2, '0')}`
  }, [timeAmPm, timeHour, timeMinute])

  const connectedPlatforms = React.useMemo(() => {
    if (!userData?.authTokens) return new Set<string>()
    return new Set(
      userData.authTokens
        .filter((token) => !platformBlacklist.includes(String(token.platform).toLowerCase()))
        .filter(
          (token) => token.platform !== 'telegram' || (userData.telegramChannelCount ?? 0) > 0,
        )
        .map((token) => token.platform),
    )
  }, [userData])

  const availablePlatformConfigs = React.useMemo(
    () => PLATFORM_CONFIG.filter((platform) => connectedPlatforms.has(platform.id)),
    [connectedPlatforms],
  )

  const togglePlatform = React.useCallback(
    (platformId: PlatformId) => {
      setSelectedPlatforms((previous) => {
        const next = new Set(previous)

        if (next.has(platformId)) {
          next.delete(platformId)
          setPlatformData((current) => {
            const updated = new Map(current)
            updated.delete(platformId)
            return updated
          })
          setActiveTab((current) => (current === platformId ? '' : current))
          return next
        }

        next.add(platformId)
        setPlatformData((current) =>
          new Map(current).set(platformId, createDefaultPlatformData(platformId, unifiedCaption)),
        )
        setActiveTab((current) => current || platformId)
        return next
      })
    },
    [unifiedCaption],
  )

  const handleUnifiedCaptionChange = React.useCallback((value: string) => {
    setUnifiedCaption(value)
    setPlatformData((current) => {
      const updated = new Map(current)
      for (const [platformId, data] of updated) {
        updated.set(platformId, { ...data, caption: value })
      }
      return updated
    })
  }, [])

  const updatePlatform = React.useCallback(
    (platformId: PlatformId, updates: Partial<PlatformFormData>) => {
      setPlatformData((current) => {
        const updated = new Map(current)
        const existing = updated.get(platformId)
        if (existing) updated.set(platformId, { ...existing, ...updates })
        return updated
      })
    },
    [],
  )

  const postCount = postsSummary?.totalItems ?? 0
  const hasReachedPostLimit = postCount >= CLIENT_LIMITS.maxPostsPerWorkspace

  const handleSubmit = React.useCallback(async () => {
    if (hasReachedPostLimit) {
      const message = `Post limit reached (${CLIENT_LIMITS.maxPostsPerWorkspace} max per workspace)`
      setErrors([message])
      toast.error(message)
      return
    }

    const validationErrors = validateCreatePostForm({
      title,
      scheduledDate,
      scheduledTime,
      selectedPlatforms,
      platformData,
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      toast.error(validationErrors[0] ?? 'Please fix the form errors')
      return
    }

    setErrors([])
    setIsSubmitting(true)

    try {
      const { allFileIds, platformPayload } = buildPlatformDataPayload(
        selectedPlatforms,
        platformData,
      )

      await createPost.mutateAsync({
        title,
        content: allFileIds,
        platforms: Array.from(selectedPlatforms),
        scheduledAt: combineDateAndTime(scheduledDate!, scheduledTime),
        platformdata: platformPayload,
      })

      await utils.post.getUserPosts.invalidate()
      toast.success('Post created successfully')
      router.push('/post')
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create post')
      setErrors([message])
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    createPost,
    platformData,
    router,
    scheduledDate,
    scheduledTime,
    selectedPlatforms,
    title,
    utils.post,
    hasReachedPostLimit,
  ])

  const orderedPlatforms = React.useMemo(
    () => availablePlatformConfigs.filter((platform) => selectedPlatforms.has(platform.id)),
    [availablePlatformConfigs, selectedPlatforms],
  )

  const completionCount = React.useMemo(
    () =>
      orderedPlatforms.filter((platform) =>
        isPlatformReady(platform.id, platformData.get(platform.id)),
      ).length,
    [orderedPlatforms, platformData],
  )

  const handleTimeHourChange = React.useCallback((value: string) => {
    const sanitized = value.replace(/\D/g, '')
    if (sanitized.length <= 2) setTimeHour(sanitized)
  }, [])

  const handleTimeMinuteChange = React.useCallback((value: string) => {
    const sanitized = value.replace(/\D/g, '')
    if (sanitized.length <= 2) setTimeMinute(sanitized)
  }, [])

  const handleTimeHourBlur = React.useCallback(() => {
    let hours = parseInt(timeHour, 10)
    if (Number.isNaN(hours) || hours < 1) hours = 12
    if (hours > 12) hours = 12
    setTimeHour(String(hours).padStart(2, '0'))
  }, [timeHour])

  const handleTimeMinuteBlur = React.useCallback(() => {
    let minutes = parseInt(timeMinute, 10)
    if (Number.isNaN(minutes) || minutes < 0) minutes = 0
    if (minutes > 59) minutes = 59
    setTimeMinute(String(minutes).padStart(2, '0'))
  }, [timeMinute])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-linear-to-b from-primary/3 to-transparent">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
              <Pencil className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Post</h1>
              <p className="text-sm text-muted-foreground">
                Compose and schedule across all your platforms. {postCount}/
                {CLIENT_LIMITS.maxPostsPerWorkspace} posts used.
              </p>
            </div>
          </div>

          <Button
            className="cursor-pointer gap-2 px-6 shadow-sm"
            size="lg"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              selectedPlatforms.size === 0 ||
              hasReachedPostLimit ||
              postsSummaryLoading
            }
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
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              <p className="mb-1 font-medium">Please fix the following errors:</p>
              <ul className="space-y-0.5">
                {errors.map((error, index) => (
                  <li key={index} className="text-xs">
                    • {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {hasReachedPostLimit && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              You have reached the workspace post limit of {CLIENT_LIMITS.maxPostsPerWorkspace}.
            </AlertDescription>
          </Alert>
        )}

        <PlatformSelectionCard
          userLoading={userLoading}
          platforms={availablePlatformConfigs}
          selectedPlatforms={selectedPlatforms}
          onTogglePlatform={togglePlatform}
        />

        <PostDetailsCard
          title={title}
          onTitleChange={setTitle}
          scheduledDate={scheduledDate}
          onScheduledDateChange={setScheduledDate}
          calendarOpen={calendarOpen}
          onCalendarOpenChange={setCalendarOpen}
          timeHour={timeHour}
          onTimeHourChange={handleTimeHourChange}
          onTimeHourBlur={handleTimeHourBlur}
          timeMinute={timeMinute}
          onTimeMinuteChange={handleTimeMinuteChange}
          onTimeMinuteBlur={handleTimeMinuteBlur}
          timeAmPm={timeAmPm}
          onTimeAmPmChange={setTimeAmPm}
          scheduledTime={scheduledTime}
          unifiedCaption={unifiedCaption}
          onUnifiedCaptionChange={handleUnifiedCaptionChange}
          selectedPlatformCount={selectedPlatforms.size}
        />

        <PlatformTabsSection
          orderedPlatforms={orderedPlatforms}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          completionCount={completionCount}
          platformData={platformData}
          onUpdatePlatform={updatePlatform}
          onTogglePlatform={togglePlatform}
          media={media || []}
          mediaLoading={mediaLoading}
          isPlatformReady={isPlatformReady}
        />

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
            disabled={
              isSubmitting ||
              selectedPlatforms.size === 0 ||
              hasReachedPostLimit ||
              postsSummaryLoading
            }
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
