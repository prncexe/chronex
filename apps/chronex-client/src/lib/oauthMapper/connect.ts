import { authClient } from '@/config/linkedinClient'
import type { PlatformId } from '@/config/platforms'

const getInstaAuthUrl = () => {
  const redirectUrl = process.env.NEXT_PUBLIC_INSTA_REDIRECT_URI
  const clientId = process.env.NEXT_PUBLIC_INSTA_APP_ID
  return `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`
}
const getThreadsAuthUrl = () => {
  const redirectUrl = process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI
  const clientId = process.env.NEXT_PUBLIC_THREADS_APP_ID
  return `https://www.threads.net/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${redirectUrl}&scope=threads_basic,threads_content_publish&response_type=code`
}

const getLinkedinAuthUrl = () => {
  const authUrl = authClient.generateMemberAuthorizationUrl([
    'w_member_social',
    'profile',
    'email',
    'openid',
  ])
  return authUrl
}
const getDiscordAuthUrl = () => {
  const origin = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  const baseurl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=536873984&response_type=code&redirect_uri=${origin}&integration_type=0&scope=guilds+bot+email`
  return baseurl
}
const getSlackAuthUrl = () => {
  const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI
  const userScopes = 'chat:write files:write files:read channels:read groups:read users:read'
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${userScopes}&redirect_uri=${redirectUri}`
  return authUrl
}
const connectMapper: Record<PlatformId, () => string> = {
  instagram: getInstaAuthUrl,
  threads: getThreadsAuthUrl,
  linkedin: getLinkedinAuthUrl,
  discord: getDiscordAuthUrl,
  slack: getSlackAuthUrl,
}

export { connectMapper }
