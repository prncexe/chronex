import { discordOAuthProcedure } from '../procedures/oauth/discord'
import { instagramOAuthProcedure } from '../procedures/oauth/instagram'
import { linkedinOAuthProcedure } from '../procedures/oauth/linkedin'
import { slackOAuthProcedure } from '../procedures/oauth/slack'
import { threadsOAuthProcedure } from '../procedures/oauth/threads'
import { createTRPCRouter } from '../trpc'
export const oauthRouter = createTRPCRouter({
  // Define your OAuth-related procedures here
  instagram: instagramOAuthProcedure,
  threads: threadsOAuthProcedure,
  linkedin: linkedinOAuthProcedure,
  slack: slackOAuthProcedure,
  discord: discordOAuthProcedure, // Using the dedicated Discord procedure
})
