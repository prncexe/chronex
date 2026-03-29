'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
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
import { ChevronsUpDown, Plus, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/client-errors'
import { CLIENT_LIMITS } from '@/lib/client-limits'

function getClientCookie(name: string) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return null
}

function setClientCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${value}; path=/; max-age=31536000`
}

export default function Workspace() {
  const { isMobile } = useSidebar()

  const { data: workspaces, isLoading, error } = trpc.workspace.getWorkspaces.useQuery()
  const createWorkspace = trpc.workspace.createWorkspace.useMutation()

  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<string | null>(null)
  const [name, setName] = React.useState('')
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (isLoading || !workspaces) return

    const storedLs = localStorage.getItem('workspaceId')
    const storedCookie = getClientCookie('workspaceId')
    const currentId = storedLs || storedCookie

    if (workspaces.length === 0) {
      setOpen(true)
      setActiveWorkspaceId(null)
      return
    }

    const isValid = currentId && workspaces.some((w) => String(w.id) === currentId)
    if (!isValid) {
      const firstId = String(workspaces[0].id)
      localStorage.setItem('workspaceId', firstId)
      setClientCookie('workspaceId', firstId)
      setActiveWorkspaceId(firstId)
    } else {
      setActiveWorkspaceId(currentId as string)
    }
  }, [isLoading, workspaces])

  React.useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error, 'Failed to load workspaces'))
    }
  }, [error])

  const workspaceCount = workspaces?.length ?? 0
  const hasReachedWorkspaceLimit = workspaceCount >= CLIENT_LIMITS.maxWorkspaces

  const activeWorkspace = workspaces?.find((w) => String(w.id) === activeWorkspaceId)

  const handleSelectWorkspace = (id: string) => {
    localStorage.setItem('workspaceId', id)
    setClientCookie('workspaceId', id)
    setActiveWorkspaceId(id)
    window.location.reload()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    handleCreate()
  }

  const handleCreate = async () => {
    try {
      if (!name.trim()) return
      if (hasReachedWorkspaceLimit) {
        toast.error(`Workspace limit reached (${CLIENT_LIMITS.maxWorkspaces} max)`)
        return
      }
      const wpdata = await createWorkspace.mutateAsync({ name: name.trim() })
      const newId = String(wpdata.id)
      localStorage.setItem('workspaceId', newId)
      setClientCookie('workspaceId', newId)
      setActiveWorkspaceId(newId)
      setOpen(false)
      setName('')
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, 'Failed to create workspace'))
    }
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex h-12 w-full animate-pulse items-center gap-2 rounded-lg bg-muted px-3" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Briefcase className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeWorkspace?.name || 'No Workspace'}
                  </span>
                  <span className="truncate text-xs">Workspace</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces?.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(String(workspace.id))}
                  className="cursor-pointer gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Briefcase className="size-4 shrink-0" />
                  </div>
                  {workspace.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 p-2"
                onClick={(e) => {
                  e.preventDefault()
                  if (hasReachedWorkspaceLimit) {
                    toast.error(`Workspace limit reached (${CLIENT_LIMITS.maxWorkspaces} max)`)
                    return
                  }
                  setOpen(true)
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  {hasReachedWorkspaceLimit ? 'Workspace limit reached' : 'Create workspace'}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog
        open={open}
        onOpenChange={(val) => {
          if (!val && workspaces?.length === 0) return
          setOpen(val)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create workspace</AlertDialogTitle>
            <AlertDialogDescription>Enter a name for your new workspace.</AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="e.g. My Startup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createWorkspace.isPending || hasReachedWorkspaceLimit}
            />

            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                onClick={() => setOpen(false)}
                disabled={createWorkspace.isPending || workspaces?.length === 0}
              >
                Cancel
              </AlertDialogCancel>

              <Button
                type="submit"
                disabled={createWorkspace.isPending || !name.trim() || hasReachedWorkspaceLimit}
              >
                {createWorkspace.isPending ? 'Creating...' : 'Create'}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
