import { createTRPCRouter } from '../trpc'
import { oauthRouter } from './oauth'
import { postRouter } from './post'
import workspaceRouter from './workspace'
import { userRouter } from './user'
import { disconnectRouter } from './deOauth'
/**
 * This is the primary router for your server.
 * All routers added in /server/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  oauthRouter: oauthRouter,
  post: postRouter,
  workspace: workspaceRouter,
  user: userRouter,
  disconnect: disconnectRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
