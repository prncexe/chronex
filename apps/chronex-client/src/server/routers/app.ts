import { createTRPCRouter } from '../trpc'
import { oauthRouter } from './oauth'
import { postRouter } from './post'
import workspaceRouter from './workspace'
import { userRouter } from './user'
/**
 * This is the primary router for your server.
 * All routers added in /server/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  oauthRouter: oauthRouter,
  post: postRouter,
  workspace: workspaceRouter,
  user: userRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
