import type { PlatformId } from '@/config/platforms'
import { trpc } from '@/utils/trpc'

export function useDisconnectMapper(): Record<PlatformId, () => Promise<{ success: boolean }>> {
  const instagram = trpc.disconnect.instagram.useMutation()
  const threads = trpc.disconnect.threads.useMutation()
  const linkedin = trpc.disconnect.linkedin.useMutation()
  const discord = trpc.disconnect.discord.useMutation()
  const slack = trpc.disconnect.slack.useMutation()

  return {
    instagram: () => instagram.mutateAsync(),
    threads: () => threads.mutateAsync(),
    linkedin: () => linkedin.mutateAsync(),
    discord: () => discord.mutateAsync(),
    slack: () => slack.mutateAsync(),
  }
}
