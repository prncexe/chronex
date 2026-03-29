'use client'

import { trpc } from '@/utils/trpc'
import OauthCard from '@/components/OauthCard'
import type { PlatformId } from '@/config/platforms'
import { redirect } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { ShieldCheck } from 'lucide-react'

const ALL_PLATFORMS: PlatformId[] = [
  'instagram',
  'threads',
  'linkedin',
  'discord',
  'slack',
  'telegram',
]

const platformBlacklist = (process.env.NEXT_PUBLIC_PLATFORM_BLACKLIST ?? '')
  .split(',')
  .map((platform) => platform.trim().toLowerCase())
  .filter(Boolean)

function formatExpiryDate(value: Date | string | null | undefined) {
  if (!value) return 'Does not expire'

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getExpiryMeta(value: Date | string | null | undefined) {
  if (!value) return 'No expiry limit'

  const expiry = new Date(value)
  const diffMs = expiry.getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return 'Expires today'
  if (diffDays === 1) return '1 day left'
  return `${diffDays} days left`
}

export default function ConnectionsPage() {
  const { data: user, isLoading } = trpc.user.getUser.useQuery()
  const workspaces = user?.workspaces ?? []
  const authTokens = user?.authTokens ?? []
  const telegramChannelCount = user?.telegramChannelCount ?? 0

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-8">
        <Spinner />
      </div>
    )
  }

  if (workspaces.length === 0) {
    redirect('/workspace')
  }

  const connectedPlatforms = new Set(
    authTokens
      .filter((token) => !platformBlacklist.includes(String(token.platform).toLowerCase()))
      .filter((token) => token.platform !== 'telegram' || telegramChannelCount > 0)
      .map((token) => token.platform as PlatformId),
  )
  const pendingTelegram =
    !platformBlacklist.includes('telegram') &&
    authTokens.some((token) => (token.platform as PlatformId) === 'telegram') &&
    telegramChannelCount === 0

  const connectedCount = ALL_PLATFORMS.filter((p) => connectedPlatforms.has(p)).length
  const pendingCount = pendingTelegram ? 1 : 0
  const availableCount =
    ALL_PLATFORMS.filter((platform) => !platformBlacklist.includes(platform)).length -
    connectedCount -
    pendingCount

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <section className="mb-8 rounded-2xl border border-border/60 bg-card px-6 py-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Tokens
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Connected platforms</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage your platform connections. Tokens are scoped to this workspace and used when
          publishing posts.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <div className="rounded-full border border-border bg-muted/30 px-3 py-1.5">
            {connectedCount} connected
          </div>
          <div className="rounded-full border border-border bg-muted/30 px-3 py-1.5">
            {pendingCount} pending
          </div>
          <div className="rounded-full border border-border bg-muted/30 px-3 py-1.5">
            {availableCount} available
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ALL_PLATFORMS.map((platform) => {
          const token = authTokens.find((token) => (token.platform as PlatformId) === platform)
          const isBlocked = platformBlacklist.includes(platform)
          const isVerified = connectedPlatforms.has(platform)
          const isPending = platform === 'telegram' && pendingTelegram

          const expiryLabel = isBlocked
            ? 'Hosted app restriction'
            : isVerified
              ? formatExpiryDate(token?.expiresAt)
              : isPending
                ? 'Awaiting channel setup'
                : 'Connect to view expiry'

          const expiryMeta = isBlocked
            ? 'Self-host to enable this provider'
            : isVerified
              ? getExpiryMeta(token?.expiresAt)
              : isPending
                ? 'Token saved — no channels yet'
                : 'Not connected yet'

          return (
            <OauthCard
              key={platform}
              platformname={platform}
              isVerified={isVerified}
              isPending={isPending}
              isBlocked={isBlocked}
              username={token?.profileName ?? ''}
              expiryLabel={expiryLabel}
              expiryMeta={expiryMeta}
            />
          )
        })}
      </section>
    </div>
  )
}
