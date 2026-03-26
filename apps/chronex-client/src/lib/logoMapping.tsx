import SlackIcon from '@/components/logo/slack'
import InstagramIcon from '@/components/logo/instagram'
import ThreadsLogoIcon from '@/components/logo/threads'
import DiscordIcon from '@/components/logo/discord'
import LinkedinIcon from '@/components/logo/linkedin'
import { PlatformId } from '@/config/platforms'

type BaseIconProps = {
  size?: number
  color?: string
  background?: string
  opacity?: number
  rotation?: number
  shadow?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  padding?: number
}

const logoMapping: Record<PlatformId, React.ComponentType<BaseIconProps>> = {
  linkedin: LinkedinIcon,
  slack: SlackIcon,
  instagram: InstagramIcon,
  threads: ThreadsLogoIcon,
  discord: DiscordIcon,
}

export default function IconRenderer({ name, ...props }: { name: PlatformId } & BaseIconProps) {
  const IconComponent = logoMapping[name]

  if (!IconComponent) return null

  return <IconComponent {...props} />
}
