import type { PlatformId } from '@/config/platforms'
const disconnectMapper: Record<PlatformId, () => string> = {
  instagram: () => '/api/auth/instagram/disconnect',
  threads: () => '/api/auth/threads/disconnect',
  linkedin: () => '/api/auth/linkedin/disconnect',
  discord: () => '/api/auth/discord/disconnect',
  slack: () => '/api/auth/slack/disconnect',
}
export { disconnectMapper }
