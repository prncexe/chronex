import { z } from 'zod'
import { authProcedure } from '@/server/trpc'
import type { NewWorkspace } from '@repo/db'
import { workspace } from '@repo/db'
export const createWorkspaceProcedure = authProcedure
  .input(
    z.object({
      name: z.string().min(3, 'Workspace name is required'),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { name } = input
    const userId = ctx.user.id
    // Create a new workspace in the database
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
  })
  return workspaces
})
