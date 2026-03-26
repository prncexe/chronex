'use client'

import { Button } from '@/components/ui/button'
import { authClient } from '@/utils/authClient'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Github } from 'lucide-react'
import { FaGoogle } from 'react-icons/fa'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [isLoginPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isSessionPending && session?.user) {
      router.replace('/')
    }
  }, [session, isSessionPending, router])

  const handleLogin = (value: 'github' | 'google') => {
    startTransition(async () => {
      try {
        await authClient.signIn.social({
          provider: value,
          callbackURL: '/',
        })
      } catch (err) {
        console.error(err)
        toast.error('Login failed')
      } finally {
        toast.success('Login successful')
        router.refresh()
        router.replace('/tokens')
      }
    })
  }

  if (isSessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="text-primary" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="orb-1 pointer-events-none absolute rounded-full"
        style={{
          top: '10%',
          left: '15%',
          width: 480,
          height: 480,
          background: 'radial-gradient(circle, hsl(var(--primary)/0.10) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="orb-2 pointer-events-none absolute rounded-full"
        style={{
          bottom: '5%',
          right: '10%',
          width: 560,
          height: 560,
          background: 'radial-gradient(circle, hsl(var(--secondary)/0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="orb-3 pointer-events-none absolute rounded-full"
        style={{
          top: '50%',
          left: '55%',
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, hsl(var(--primary)/0.05) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* ── Background: diagonal accent line ── */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: 0,
          right: '28%',
          width: 1,
          height: '100vh',
          background:
            'linear-gradient(to bottom, transparent, hsl(var(--primary)/0.15) 30%, hsl(var(--primary)/0.08) 70%, transparent)',
          transform: 'rotate(12deg) translateX(40px)',
          transformOrigin: 'top center',
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="card-fade card-fade-2 rounded-2xl border border-border bg-card p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="card-fade card-fade-3 mb-8">
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-card-foreground">
              Welcome back
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sign in to continue scheduling your content across all platforms.
            </p>
          </div>

          {/* Buttons */}
          <div className="card-fade card-fade-4 flex flex-col gap-3">
            {/* GitHub */}
            <Button
              className="login-btn w-full cursor-pointer gap-2.5"
              onClick={() => handleLogin('github')}
              disabled={isLoginPending}
            >
              {isLoginPending ? (
                <Spinner />
              ) : (
                <>
                  <Github size={16} /> Continue with GitHub
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-0.5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] tracking-widest text-muted-foreground/50 uppercase">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Google */}
            <Button
              variant="outline"
              className="login-btn w-full cursor-pointer gap-2.5"
              onClick={() => handleLogin('google')}
              disabled={isLoginPending}
            >
              {isLoginPending ? (
                <Spinner />
              ) : (
                <>
                  <FaGoogle size={14} /> Continue with Google
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="card-fade card-fade-5 mt-10 text-center text-xs text-muted-foreground/50">
          By signing in, you agree to our{' '}
          <a href="#" className="text-primary/60 transition-colors hover:text-primary">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary/60 transition-colors hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
