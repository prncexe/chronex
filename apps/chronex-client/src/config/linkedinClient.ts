import { AuthClient } from 'linkedin-api-client'
const params = {
  clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  redirectUrl: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI!,
}
export const authClient = new AuthClient(params)
