'use client'
import { trpc } from '@/utils/trpc'
import OauthCard from '@/components/OauthCard'
import type { PlatformId } from '@/config/platforms'
import { redirect } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
const page = () => {
  const { data: user, isLoading } = trpc.user.getUser.useQuery()
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (user?.workspaces.length === 0) {
    redirect('/workspace')
  }
  const platforms = user?.authTokens.map((token) => token.platform)
  const Allplatforms = ['instagram', 'threads', 'linkedin', 'discord', 'slack'] as PlatformId[]
  return (
    <div className="flex flex-wrap gap-4 p-4">
      {Allplatforms.map((platform) => (
        <OauthCard
          key={platform}
          platformname={platform}
          isVerified={platforms?.includes(platform) || false}
          username={
            user?.authTokens.find((token) => token.platform === platform)?.profileName || ''
          }
        />
      ))}
    </div>
  )
}

export default page
