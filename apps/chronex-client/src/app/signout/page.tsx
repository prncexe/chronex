'use client'

import { Button } from '@/components/ui/button'
import { authClient } from '@/utils/authClient'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { LogOut, ArrowLeft } from 'lucide-react'
export default function LogoutPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [isLogoutPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/login')
    }
  }, [isPending, session?.user, router])

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await authClient.signOut()
        toast.success('Logged out successfully')
        router.refresh()
        router.replace('/login')
      } catch (err) {
        console.error(err)
        toast.error('Logout failed')
      }
    })
  }

  if (isPending) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex min-w-[220px] flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card/70 px-8 py-10 shadow-2xl backdrop-blur-xl">
          <Spinner className="size-5 text-foreground" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </main>
    )
  }

  if (!session?.user) return null

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_30%)]" />

      <section className="relative w-full max-w-md rounded-[28px] border border-border/60 bg-card/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground shadow-sm ring-1 ring-border/50">
            <LogOut className="size-6" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign out</h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            You are signed in as{' '}
            <span className="font-medium text-foreground">{session.user.email}</span>. You can
            safely sign out from this device.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-muted/40 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            This will end your current session and redirect you to the login page.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 cursor-pointer rounded-xl"
            onClick={() => router.back()}
            disabled={isLogoutPending}
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Go back
            </span>
          </Button>

          <Button
            type="button"
            className="h-11 cursor-pointer rounded-xl bg-foreground text-background hover:bg-foreground/70 hover:text-background"
            onClick={handleLogout}
            disabled={isLogoutPending}
          >
            {isLogoutPending ? (
              <span className="flex items-center gap-2">
                <Spinner className="size-4" />
                Signing out...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogOut className="size-4" />
                Sign out
              </span>
            )}
          </Button>
        </div>
      </section>
    </main>
  )
}
