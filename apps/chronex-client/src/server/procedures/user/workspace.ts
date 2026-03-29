import { z } from 'zod'
import { authProcedure } from '@/server/trpc'
import type { NewWorkspace } from '@repo/db'
import { workspace } from '@repo/db'
import { eq, and } from 'drizzle-orm'
export const createWorkspaceProcedure = authProcedure
  .input(
    z.object({
      name: z.string().min(3, 'Workspace name is required'),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const maxWorkspaces = parseInt(process.env.NEXT_PUBLIC_MAX_WORKSPACE || '999', 10)
    const userId = ctx.user.id
    const existingWorkspaces = await ctx.db.query.workspace.findMany({
      where: (workspace, { eq }) => eq(workspace.createdBy, userId),
    })
    if (existingWorkspaces.length >= maxWorkspaces) {
      throw new Error(`You can only create up to ${maxWorkspaces} workspaces.`)
    }

    const { name } = input

    const values: NewWorkspace = {
      name,
      createdBy: userId,
    }
    const [newworkspace] = await ctx.db.insert(workspace).values(values).returning()
    if (!newworkspace) throw new Error('Insert failed')
    ctx.cookies.set('workspaceId', String(newworkspace.id), {
      httpOnly: false,
      path: '/',
      sameSite: 'none',
      secure: true,
      expires: new Date('2035-01-01'),
    })
    return newworkspace
  })

export const getWorkspacesProcedure = authProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id
  const workspaces = await ctx.db.query.workspace.findMany({
    where: (workspace, { eq }) => eq(workspace.createdBy, userId),
    orderBy: (workspace, { asc }) => asc(workspace.id),
  })
  return workspaces
})

export const deleteWorkspaceProcedure = authProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const { id } = input
    const userId = ctx.user.id
    const deleted = await ctx.db
      .delete(workspace)
      .where(and(eq(workspace.id, id), eq(workspace.createdBy, userId)))
      .returning()
    return deleted
  })

export const updateWorkspaceProcedure = authProcedure
  .input(z.object({ id: z.number(), name: z.string().min(3, 'Workspace name is required') }))
  .mutation(async ({ ctx, input }) => {
    const { id, name } = input
    const userId = ctx.user.id
    const updated = await ctx.db
      .update(workspace)
      .set({ name })
      .where(and(eq(workspace.id, id), eq(workspace.createdBy, userId)))
      .returning()
    return updated
  })
