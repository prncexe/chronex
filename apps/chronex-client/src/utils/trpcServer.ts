import { headers as nextHeaders, cookies } from 'next/headers'
import { cache } from 'react'
import { appRouter } from '@/server/routers/app'
import { createTRPCContext } from '@/server/trpc'

export const getCaller = cache(async () => {
  const incoming = await nextHeaders()
  const cookieStore = await cookies()
  const h = new Headers(incoming)

  const workspaceIdFromCookie = cookieStore.get('workspaceId')?.value
  if (workspaceIdFromCookie && !h.has('x-workspace-id')) {
    h.set('x-workspace-id', workspaceIdFromCookie)
  }

  const ctx = await createTRPCContext({
    headers: h,
  })

  return appRouter.createCaller(ctx)
})