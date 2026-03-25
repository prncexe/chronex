'use client'
import React from 'react'
import { trpc } from '@/utils/trpc'
import { useRouter } from 'next/navigation'
const Page = () => {
  const router = useRouter()
  const createWorkspace = trpc.workspace.createWorkspace.useMutation()
  return (
    <div>
      <form
        onSubmit={async (e: React.SubmitEvent<HTMLFormElement>) => {
          e.preventDefault()
          const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value
          const wpdata = await createWorkspace.mutateAsync({ name })
          localStorage.setItem('workspaceId', String(wpdata.id))
          router.push('/tokens')
        }}
      >
        <input type="text" placeholder="workspace name" name="name" />
        <button type="submit">create</button>
      </form>
    </div>
  )
}

export default Page
