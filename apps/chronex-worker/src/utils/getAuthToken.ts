import { DB } from '@repo/db'

/**
 * Supported platform types that match the `platform` enum in the DB.
 */
export type Platform = 'instagram' | 'linkedin' | 'threads' | 'discord' | 'slack'

export async function getAuthToken(db: DB, workspaceId: number, platform: Platform) {
  const token = await db.query.authToken.findFirst({
    where: (t, { eq, and }) => and(eq(t.workspaceId, workspaceId), eq(t.platform, platform)),
  })

  if (!token) {
    throw new Error(`No OAuth token found for workspace ${workspaceId} on platform "${platform}"`)
  }

  return token
}
