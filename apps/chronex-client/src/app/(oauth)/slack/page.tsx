/* eslint-disable react-hooks/error-boundaries */
import { redirect } from 'next/navigation'
import { getCaller } from '@/utils/trpcServer'

type PageProps = {
  searchParams: Promise<{
    code?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const { code } = await searchParams

  if (!code) redirect('/oauth')

  try {
    const caller = await getCaller()
    await caller.oauthRouter.slack({ code })
    return <div>Authorization successful. You can close this tab.</div>
  } catch (error) {
    console.error('Slack OAuth error:', error)
    return <div>Authorization failed. Please try again.</div>
  }
}
