'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  PenSquare,
  Image as ImageIcon,
  Key,
  LogOut,
  LogIn,
  PlusSquare,
  Briefcase,
} from 'lucide-react'
import Workspace from './workspace'

const mainNavItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Posts', url: '/post', icon: PenSquare },
  { title: 'Create Post', url: '/post/createPost', icon: PlusSquare },
  { title: 'Media', url: '/media', icon: ImageIcon },
  { title: 'Tokens', url: '/tokens', icon: Key },
  { title: 'Workspace', url: '/workspace', icon: Briefcase },
]

const authNavItems = [
  { title: 'Login', url: '/login', icon: LogIn },
  { title: 'Sign Out', url: '/signout', icon: LogOut },
]

export function AppSidebar() {
  const pathname = usePathname()

  const getBestActiveUrl = (urls: string[]) => {
    if (!pathname) return null

    const matches = urls.filter((url) => {
      if (url === '/') return pathname === '/'
      return pathname === url || pathname.startsWith(`${url}/`)
    })

    if (matches.length === 0) return null

    return matches.sort((a, b) => b.length - a.length)[0]
  }

  const activeUrl = getBestActiveUrl([...mainNavItems, ...authNavItems].map((item) => item.url))

  return (
    <Sidebar>
      <SidebarHeader>
        <Workspace />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={activeUrl === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {authNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={activeUrl === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
