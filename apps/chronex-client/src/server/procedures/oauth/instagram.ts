import { workspaceProcedure } from "../../trpc";
import {
  INSTA_SHORT_LIVED_TOKEN_URL,
  INSTA_LONG_LIVED_TOKEN_URL,
} from "@/constants/url";
import z from "zod";
import { NewAuthToken } from "@/db/schema";
import { authToken } from "@/db/schema/auth-token";

import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
} from "./types";

export const instagramOAuthProcedure = workspaceProcedure
  .input(z.object({ code: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const shortLivedToken = await exchangeCodeForShortLivedToken({
      url: INSTA_SHORT_LIVED_TOKEN_URL,
      clientId: process.env.NEXT_PUBLIC_INSTA_APP_ID!,
      clientSecret: process.env.INSTA_APP_SECRET!,
      redirectUri: process.env.NEXT_PUBLIC_INSTA_REDIRECT_URI!,
      code: input.code,
    });

    const longLivedToken = await exchangeForLongLivedToken({
      url: INSTA_LONG_LIVED_TOKEN_URL,
      clientSecret: process.env.INSTA_APP_SECRET!,
      accessToken: shortLivedToken.access_token,
      grantType: "ig_exchange_token",
    });

    const datadb: NewAuthToken = {
      accessToken: longLivedToken.access_token,
      expiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000),
      platform: "instagram",
      userId: ctx.user.id,
      workspaceId: ctx.workspaceId,
      profileId:shortLivedToken.user_id,
    };
    await ctx.db.insert(authToken).values(datadb);
    return { access_token: longLivedToken.access_token };
  });
