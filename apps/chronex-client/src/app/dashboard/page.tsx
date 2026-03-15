'use client'
import { trpc } from '@/utils/trpc'
import OauthCard from '@/components/OauthCard'
import type { PlatformId } from '@/config/platforms'
import { redirect } from 'next/navigation'
const page = () => {
  const user = trpc.user.getUser.useQuery()
  if(user.data?.workspaces.length===0){
    redirect("/workspace")
  }
  const platforms = user.data?.authTokens.map((token) => token.platform)
  const Allplatforms = ['instagram', 'threads', 'linkedin', 'discord', 'slack'] as PlatformId[]
  return (
    <div className="flex flex-wrap gap-4 p-4">
      {Allplatforms.map((platform) => (
        <OauthCard
          key={platform}
          platformname={platform}
          isVerified={platforms?.includes(platform) || false}
        />
      ))}
    </div>
  )
}

export default page
