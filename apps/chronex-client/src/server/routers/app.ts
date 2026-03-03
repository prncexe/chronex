import { createTRPCRouter } from "../trpc";
import { exampleRouter } from "./example";
import { oauthRouter } from "./oauth";
import { postRouter } from "./post";
import workspaceRouter from "./workspace";
/**
 * This is the primary router for your server.
 * All routers added in /server/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  oauthRouter: oauthRouter,
  example: exampleRouter,
  post: postRouter,
  workspace: workspaceRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
