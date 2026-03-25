import { headers as nextHeaders } from 'next/headers'
import { cache } from 'react'
import { appRouter } from '@/server/routers/app'
import { createTRPCContext } from '@/server/trpc'

export const getCaller = cache(async () => {
  const incoming = await nextHeaders()
  const h = new Headers(incoming)
  const ctx = await createTRPCContext({
    headers: h,
  })

  return appRouter.createCaller(ctx)
})
