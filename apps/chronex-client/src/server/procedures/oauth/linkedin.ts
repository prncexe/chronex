import { TRPCError } from "@trpc/server";
import z from "zod";
import {  NewAuthToken } from "@/db/schema";
import { authToken } from "@/db/schema/auth-token";
import { workspaceProcedure } from "../../trpc";
import { authClient } from "@/config/linkedinClient";

export const linkedinOAuthProcedure = workspaceProcedure
  .input(z.object({ code: z.string() }))
  .mutation(async ({ input, ctx }) => {
    let tokenData;
    try {
      tokenData = await authClient.exchangeAuthCodeForAccessToken(input.code);
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Failed to exchange code for token",
        cause: error,
      });
    }

    const datadb: NewAuthToken = {
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      platform: "linkedin",
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

    return { access_token: tokenData.access_token };
  });