'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { connectMapper } from '@/lib/oauthMapper/connect'
import { useDisconnectMapper } from '@/lib/oauthMapper/disconnect'
import { PlatformId } from '@/config/platforms'
import { Button } from './ui/button'
import IconRenderer from '@/lib/logoMapping'
import { AlertCircle, CheckCircle2, Clock3, Link2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/client-errors'
import { cn } from '@/lib/utils'

function waitForPopupClose(popup: Window) {
  return new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        resolve()
      }
    }, 500)
  })
}

const OauthCard = ({
  platformname,
  isVerified,
  isPending = false,
  isBlocked = false,
  username,
  expiryLabel,
  expiryMeta,
}: {
  platformname: PlatformId
  isVerified: boolean
  isPending?: boolean
  isBlocked?: boolean
  username: string
  expiryLabel: string
  expiryMeta?: string
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const disconnect = useDisconnectMapper()

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const url = connectMapper[platformname]()
      const popup = window.open(url, '', 'width=600,height=600,left=100,top=100')

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups and try again.')
      }

      await waitForPopupClose(popup)
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, `Failed to connect ${platformname}`))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      const res = await disconnect[platformname]()
      if (res.success) {
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, `Failed to disconnect ${platformname}`))
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = username?.trim() || 'No account connected'
  const buttonLabel = isLoading
    ? 'Please wait...'
    : isBlocked
      ? 'Not available'
      : isVerified
        ? 'Disconnect'
        : isPending
          ? 'Finish setup'
          : 'Connect'

  return (
    <Card className="flex h-full flex-col border-border/60 bg-card shadow-sm">
      <CardHeader className="gap-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
              <IconRenderer name={platformname} />
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-lg font-semibold capitalize">
                {platformname}
              </CardTitle>
              <CardDescription>
                {isBlocked
                  ? 'Unavailable on the hosted app'
                  : isVerified
                    ? 'Connected and ready to use'
                    : isPending
                      ? 'Connection started, setup still incomplete'
                      : 'Not connected yet'}
              </CardDescription>
            </div>
          </div>

          {isBlocked ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <AlertCircle className="size-3.5" />
              Unavailable
            </div>
          ) : isVerified ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" />
              Active
            </div>
          ) : isPending ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Clock3 className="size-3.5" />
              Pending
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Link2 className="size-3.5" />
              Available
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div className="flex flex-col gap-3">
          {isBlocked && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
                <AlertCircle className="size-3.5" />
                Not available
              </p>
              <p className="text-sm text-muted-foreground">
                {platformname === 'instagram' || platformname === 'threads'
                  ? `${platformname[0].toUpperCase()}${platformname.slice(1)} is not available here yet. Host yourself if you want to use your own reviewed app.`
                  : `${platformname[0].toUpperCase()}${platformname.slice(1)} is not available here right now. Host yourself if you need it.`}
              </p>
            </div>
          )}

          {isVerified && !isBlocked && (
            <>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <UserRound className="size-3.5" />
                  Connected account
                </p>
                <p className="text-sm font-medium text-foreground">{displayName}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  Token expiry
                </p>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{expiryLabel}</p>
                  {expiryMeta && (
                    <p className="shrink-0 text-xs text-muted-foreground">{expiryMeta}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {isPending && !isBlocked && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3">
              <p className="mb-1 flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                <AlertCircle className="size-3.5" />
                Setup still needed
              </p>
              <p className="text-sm text-muted-foreground">
                The token exists, but the platform is not fully usable yet. Finish the provider
                setup to activate posting.
              </p>
            </div>
          )}

          {!isVerified && !isPending && !isBlocked && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3">
              <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Link2 className="size-3.5" />
                Ready to connect
              </p>
              <p className="text-sm text-muted-foreground">
                Authorize this platform to let Chronex publish through your workspace.
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-1">
          <Button
            className={cn('w-full cursor-pointer', isBlocked && 'cursor-not-allowed')}
            variant={isVerified ? 'outline' : 'default'}
            onClick={isBlocked ? undefined : isVerified ? handleDisconnect : handleConnect}
            disabled={isLoading || isBlocked}
          >
            {buttonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default OauthCard
