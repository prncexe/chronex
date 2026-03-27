'use client'

import Image from 'next/image'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/appSidebar'
import { authClient } from '@/utils/authClient'
import { Spinner } from '@/components/ui/spinner'
import { BrandName } from '@/components/logo/brandName'
import { ThemeToggle } from '@/components/themeToggle'
import { UserMenu } from '@/components/userMenu'

export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user

  const avatar = user?.image ? (
    <Image
      src={user.image}
      alt={user.name ?? 'User'}
      width={32}
      height={32}
      unoptimized
      className="cursor-pointer rounded-sm object-cover"
    />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
      {user?.name?.[0]?.toUpperCase() ?? 'U'}
    </div>
  )

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b border-border/70 bg-background/92 px-5 backdrop-blur">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <SidebarTrigger className="-ml-1 cursor-pointer rounded-md border border-transparent transition-colors hover:border-border hover:bg-muted/60" />
                {/* <Image
                  src="/logo.png"
                  alt="Chronex logo"
                  width={28}
                  height={28}
                  className="object-contain"
                /> */}
              </div>
              <span className="chronex-brand text-xl font-semibold tracking-tight">
                <BrandName />
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isPending ? (
                <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-card">
                  <Spinner />
                </div>
              ) : user ? (
                // <div className="flex items-center gap-2.5   bg-card px-2.5 py-1.5 shadow-sm">
                //   {avatar}
                //   <div className="hidden flex-col leading-tight sm:flex">
                //     <span className="text-sm font-medium tracking-tight">
                //       {user.name ?? 'Unknown user'}
                //     </span>
                //     <span className="text-[11px] text-muted-foreground">{user.email}</span>
                //   </div>
                // </div>
                <UserMenu user={user} avatar={avatar} />
              ) : (
                <span className="text-sm text-muted-foreground">Not signed in</span>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
