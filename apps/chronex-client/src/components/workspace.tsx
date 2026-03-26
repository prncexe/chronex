'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { trpc } from '@/utils/trpc'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

export default function Workspace() {
  const router = useRouter()
  const createWorkspace = trpc.workspace.createWorkspace.useMutation()

  const [name, setName] = React.useState('')
  const [open, setOpen] = React.useState(false)

  // 🚀 Enter press → open dialog instead of submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    setOpen(true)
  }

  const handleCreate = async () => {
    try {
      const wpdata = await createWorkspace.mutateAsync({ name: name.trim() })
      localStorage.setItem('workspaceId', String(wpdata.id))
      setOpen(false)
      router.push('/tokens')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="workspace name"
          className="mr-6 h-10 w-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* optional button click also opens dialog */}
        <Button type="submit" disabled={!name.trim()}>
          Create
        </Button>
      </form>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create workspace?</AlertDialogTitle>
            <AlertDialogDescription>{name.trim()} will be created.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={createWorkspace.isPending}>Cancel</AlertDialogCancel>

            <Button onClick={handleCreate} disabled={createWorkspace.isPending}>
              {createWorkspace.isPending ? 'Creating...' : 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
