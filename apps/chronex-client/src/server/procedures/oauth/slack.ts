import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {  NewAuthToken } from "@/db/schema";
import { authToken } from "@/db/schema/auth-token";

import { workspaceProcedure } from "../../trpc";
import { slackClient } from "@/config/slackClient";

const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const clientSecret = process.env.SLACK_CLIENT_SECRET;
const redirectUri = process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI;

export const slackOAuthProcedure = workspaceProcedure
  .input(z.object({ code: z.string() }))
  .mutation(async ({ input, ctx }) => {
    let tokenData;
    try {
      tokenData = await slackClient.oauth.v2.access({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: input.code,
        redirect_uri: redirectUri!,
      });
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Failed to exchange code for token",
        cause: error,
      });
    }

    if (!tokenData.ok || !tokenData.authed_user || !tokenData.access_token) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid token response from Slack",
      });
    }

    const datadb: NewAuthToken = {
      accessToken: tokenData.access_token,
      profileId: tokenData.authed_user.id,
      // Slack tokens don't expire by default, so set a far future date or handle accordingly
      platform: "slack",
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
