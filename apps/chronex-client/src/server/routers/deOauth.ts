// server/api/routers/disconnect.ts
import { createTRPCRouter } from '../trpc'
import { instagramOAuthProcedure } from '../procedures/deOauth/instagram'
import { threadsOAuthProcedure } from '../procedures/deOauth/threads'
import { linkedinOAuthProcedure } from '../procedures/deOauth/linkedin'
import { discordOAuthProcedure } from '../procedures/deOauth/discord'
import { slackOAuthProcedure } from '../procedures/deOauth/slack'
import { telegramOAuthProcedure } from '../procedures/deOauth/telegram'
export const disconnectRouter = createTRPCRouter({
  instagram: instagramOAuthProcedure,
  threads: threadsOAuthProcedure,
  linkedin: linkedinOAuthProcedure,
  discord: discordOAuthProcedure,
  slack: slackOAuthProcedure,
  telegram: telegramOAuthProcedure,
})
