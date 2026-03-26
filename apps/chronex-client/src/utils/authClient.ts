import { createAuthClient } from 'better-auth/react'

import { getBaseUrl } from './getBaseUrl'
export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
})
