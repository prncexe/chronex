import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { db } from '@/config/drizzle'
import { auth } from '@/config/authInstance'
import { cookies } from 'next/headers'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const cookieStore = await cookies()

  const workspaceId = cookieStore.get('workspaceId')?.value || opts.headers.get('x-workspace-id')

  const session = await auth.api.getSession({
    headers: opts.headers,
  })

  return {
    db,
    headers: opts.headers,
    cookies: cookieStore,
    user: session?.user || null,
    workspaceId: workspaceId || null,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure

export const authProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const workspaceProcedure = authProcedure.use(async ({ ctx, next }) => {
  if (!ctx.workspaceId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this workspace',
    })
  }
  const workspace = await ctx.db.query.workspace.findFirst({
    where: (workspace, { eq, and }) =>
      and(eq(workspace.id, Number(ctx.workspaceId)), eq(workspace.createdBy, ctx.user.id)),
    columns: {
      id: true,
      name: true,
      description: true,
      image: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!workspace) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this workspace',
    })
  }
  return next({
    ctx: {
      ...ctx,
      workspaceId: Number(ctx.workspaceId),
    },
  })
})
