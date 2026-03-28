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
      .filter((token) => token.platform !== 'telegram' || telegramChannelCount > 0)
      .map((token) => token.platform as PlatformId),
  )
  const pendingTelegram =
    authTokens.some((token) => (token.platform as PlatformId) === 'telegram') &&
    telegramChannelCount === 0
  const connectedCount = ALL_PLATFORMS.filter((p) => connectedPlatforms.has(p)).length

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 rounded-xl border border-border/70 bg-card px-5 py-4">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Connections
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Connected Platforms</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {connectedCount} of {ALL_PLATFORMS.length} platforms connected
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ALL_PLATFORMS.map((platform) => {
          const token = authTokens.find((token) => (token.platform as PlatformId) === platform)
          return (
            <OauthCard
              key={platform}
              platformname={platform}
              isVerified={connectedPlatforms.has(platform)}
              isPending={platform === 'telegram' && pendingTelegram}
              username={token?.profileName ?? ''}
            />
          )
        })}
      </div>
    </div>
  )
}
