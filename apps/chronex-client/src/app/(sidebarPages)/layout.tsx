'use client'

import Image from 'next/image'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/appSidebar'
import { authClient } from '@/utils/authClient'
import { Spinner } from '@/components/ui/spinner'

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
      className="rounded-full object-cover"
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
          <header className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <Image
                src="/logo.png"
                alt="Chronex logo"
                width={48}
                height={48}
                className="object-contain"
              />
              <span className="text-lg font-semibold tracking-tight">Chronex</span>
            </div>

            <div className="flex items-center gap-3">
              {isPending ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Spinner />
                </div>
              ) : user ? (
                <>
                  {avatar}
                  <div className="hidden flex-col leading-tight sm:flex">
                    <span className="text-sm font-medium">{user.name ?? 'Unknown user'}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </>
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
