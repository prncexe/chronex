import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/config/drizzle";
import { auth } from "@/config/authInstance";
import { headers } from "next/dist/server/request/headers";
import { z } from "zod";
/**
 * Context creation for each request
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const workspaceId = opts.headers.get("x-workspace-id");
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return {
    db,
    headers: opts.headers,
    user: session?.user || null,
    workspaceId: workspaceId || null,
  };
};

/**
 * Initialize tRPC
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const authProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
export const workspaceProcedure = authProcedure.use(async ({ ctx, next }) => {
  if (!ctx.workspaceId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this workspace",
    });
  }
  return next({
    ctx: {
      ...ctx,
      workspaceId: Number(ctx.workspaceId),
    },
  });
});
