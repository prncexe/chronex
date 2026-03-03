import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {user} from "@/db/schema";
export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
        
      };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(user);
  }),
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.user;
  })
});
