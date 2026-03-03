import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {  NewAuthToken } from "@/db/schema";
import { authToken } from "@/db/schema/auth-token";
import { workspaceProcedure } from "../../trpc";



export const discordOAuthProcedure = workspaceProcedure
  .input(z.object({ guild_id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    
    const datadb: NewAuthToken = {
        accessToken:"",
      profileId: input.guild_id,
      platform: "discord",
      userId: ctx.user.id,
      workspaceId: ctx.workspaceId,
    };

    try {
      await ctx.db.insert(authToken).values(datadb);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to save token to database",
        cause: error,
      });
    }

    return { guildId: datadb.profileId };
  });
