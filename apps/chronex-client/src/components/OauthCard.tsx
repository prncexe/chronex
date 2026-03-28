'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card'
import { connectMapper } from '@/lib/oauthMapper/connect'
import { useDisconnectMapper } from '@/lib/oauthMapper/disconnect'
import { PlatformId } from '@/config/platforms'
import { Button } from './ui/button'
import IconRenderer from '@/lib/logoMapping'

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
  username,
}: {
  platformname: PlatformId
  isVerified: boolean
  isPending?: boolean
  username: string
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const disconnect = useDisconnectMapper()

  const handleConnect = async () => {
    setIsLoading(true)
    const url = connectMapper[platformname]()
    const popup = window.open(url, '', 'width=600,height=600,left=100,top=100')
    if (popup) {
      await waitForPopupClose(popup)

      console.log('Popup closed')
      setIsLoading(false)
      window.location.reload()
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      const res = await disconnect[platformname]()
      if (res.success) {
        window.location.reload()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = username?.trim() || 'No account connected'

  return (
    <Card className="h-full rounded-xl border-border/70 transition-shadow hover:shadow-sm">
      <CardHeader className="flex flex-col gap-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background">
              <IconRenderer name={platformname} />
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-base font-semibold capitalize">
                {platformname}
              </CardTitle>
              <CardDescription className="text-xs">
                {isVerified ? 'Connected' : isPending ? 'Setup incomplete' : 'Not connected'}
              </CardDescription>
            </div>
          </div>

          <div
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              isVerified
                ? 'border-primary/30 bg-primary/10 text-primary'
                : isPending
                  ? 'border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'bg-background'
            }`}
          >
            {isVerified ? 'Active' : isPending ? 'Pending' : 'Idle'}
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">Account</p>
          <p className="truncate text-sm font-medium">{displayName}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          className="w-full cursor-pointer"
          onClick={isVerified ? handleDisconnect : handleConnect}
          disabled={isLoading}
        >
          {isLoading
            ? 'Please wait...'
            : isVerified
              ? 'Disconnect'
              : isPending
                ? 'Finish setup'
                : 'Connect'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default OauthCard
