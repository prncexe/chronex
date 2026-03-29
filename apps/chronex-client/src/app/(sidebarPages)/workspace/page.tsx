'use client'

import React, { useState } from 'react'
import { trpc } from '@/utils/trpc'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Trash2, Edit2, Search, Plus, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/client-errors'
import { CLIENT_LIMITS } from '@/lib/client-limits'

const Page = () => {
  const trpcContext = trpc.useUtils()
  const { data: workspaces, isLoading, error } = trpc.workspace.getWorkspaces.useQuery()

  const createWorkspace = trpc.workspace.createWorkspace.useMutation({
    onSuccess: () => {
      toast.success('Workspace created')
      trpcContext.workspace.getWorkspaces.invalidate()
      setCreateDialogOpen(false)
      setNewName('')
    },
    onError: (error) => {
      console.error('Failed to create workspace:', error)
      toast.error(getErrorMessage(error, 'Failed to create workspace'))
    },
  })

  const deleteWorkspace = trpc.workspace.deleteWorkspace.useMutation({
    onSuccess: () => {
      toast.success('Workspace deleted')
      trpcContext.workspace.getWorkspaces.invalidate()
      setDeleteConfirmId(null)
    },
    onError: (error) => {
      console.error('Failed to delete workspace:', error)
      toast.error(getErrorMessage(error, 'Failed to delete workspace'))
    },
  })

  const updateWorkspace = trpc.workspace.updateWorkspace.useMutation({
    onSuccess: () => {
      toast.success('Workspace updated')
      trpcContext.workspace.getWorkspaces.invalidate()
      setEditingId(null)
    },
    onError: (error) => {
      console.error('Failed to update workspace:', error)
      toast.error(getErrorMessage(error, 'Failed to update workspace'))
    },
  })

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const handleEditClick = (workspace: { id: number; name: string }) => {
    setEditingId(workspace.id)
    setEditName(workspace.name)
  }

  const handleSaveEdit = (id: number) => {
    if (!editName.trim()) return
    updateWorkspace.mutate({ id, name: editName.trim() })
  }

  const filteredWorkspaces = workspaces?.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()),
  )
  const workspaceCount = workspaces?.length ?? 0
  const hasReachedWorkspaceLimit = workspaceCount >= CLIENT_LIMITS.maxWorkspaces

  const handleOpenCreateDialog = () => {
    if (hasReachedWorkspaceLimit) {
      toast.error(`Workspace limit reached (${CLIENT_LIMITS.maxWorkspaces} max)`)
      return
    }
    setCreateDialogOpen(true)
  }

  const handleCreateWorkspace = () => {
    if (!newName.trim()) return
    if (hasReachedWorkspaceLimit) {
      toast.error(`Workspace limit reached (${CLIENT_LIMITS.maxWorkspaces} max)`)
      return
    }
    createWorkspace.mutate({ name: newName.trim() })
  }

  React.useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error, 'Failed to load workspaces'))
    }
  }, [error])

  return (
    <div className="mx-auto min-h-full max-w-3xl space-y-6 p-8">
      {}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-foreground">Workspaces</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenCreateDialog}
          disabled={hasReachedWorkspaceLimit}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New workspace
        </Button>
      </div>

      {}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workspaces..."
          className="h-9 border-border bg-muted/30 pl-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {}
      <div className="overflow-hidden rounded-md border border-border">
        {}
        <div className="grid grid-cols-[1fr_80px_36px] items-center border-b border-border bg-muted/20 px-4 py-2">
          <span className="text-xs text-muted-foreground">Name</span>
          <span className="text-xs text-muted-foreground">ID</span>
          <span />
        </div>

        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_36px] items-center border-b border-border px-4 py-3 last:border-0"
              >
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-10" />
                <span />
              </div>
            ))}
          </>
        ) : workspaces?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <LayoutGrid className="h-6 w-6 text-muted-foreground/30" />
            <div>
              <p className="text-sm text-foreground">No workspaces</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Create one to get started.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenCreateDialog}
              disabled={hasReachedWorkspaceLimit}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New workspace
            </Button>
          </div>
        ) : filteredWorkspaces?.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No results for &quot;{search}&quot;</p>
          </div>
        ) : (
          filteredWorkspaces?.map((workspace) => (
            <div
              key={String(workspace.id)}
              className="group grid grid-cols-[1fr_80px_36px] items-center border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-muted/20"
            >
              {}
              {editingId === Number(workspace.id) ? (
                <div className="flex items-center gap-2 pr-4">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 py-0 text-sm"
                    autoFocus
                    disabled={updateWorkspace.isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(Number(workspace.id))
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={() => handleSaveEdit(Number(workspace.id))}
                    disabled={
                      updateWorkspace.isPending || !editName.trim() || editName === workspace.name
                    }
                  >
                    {updateWorkspace.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <span className="truncate text-sm text-foreground">{workspace.name}</span>
              )}

              {}
              <span className="font-mono text-xs text-muted-foreground">
                {String(workspace.id)}
              </span>

              {}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() =>
                      handleEditClick({ id: Number(workspace.id), name: workspace.name })
                    }
                  >
                    <Edit2 className="mr-2 h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => setDeleteConfirmId(Number(workspace.id))}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {}
      {!isLoading && (workspaces?.length ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          {filteredWorkspaces?.length} of {workspaces?.length} workspace
          {workspaces?.length !== 1 ? 's' : ''}
          {' · '}
          limit {CLIENT_LIMITS.maxWorkspaces}
        </p>
      )}

      {}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workspace and all its data. This can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteWorkspace.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteWorkspace.mutate({ id: deleteConfirmId })}
              disabled={deleteWorkspace.isPending}
            >
              {deleteWorkspace.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <AlertDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Give it a name. You can rename it later. {workspaceCount}/
              {CLIENT_LIMITS.maxWorkspaces} used.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Acme Corp"
              autoFocus
              disabled={createWorkspace.isPending || hasReachedWorkspaceLimit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) handleCreateWorkspace()
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createWorkspace.isPending}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleCreateWorkspace}
              disabled={createWorkspace.isPending || !newName.trim() || hasReachedWorkspaceLimit}
            >
              {createWorkspace.isPending ? 'Creating…' : 'Create'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Page
