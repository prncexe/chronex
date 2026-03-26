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
  username,
}: {
  platformname: PlatformId
  isVerified: boolean
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
    <Card className="w-[300px] rounded-2xl transition-shadow">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-background">
              <IconRenderer name={platformname} />
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-base font-semibold capitalize">
                {platformname}
              </CardTitle>
              <CardDescription className="text-xs">
                {isVerified ? 'Connected' : 'Not connected'}
              </CardDescription>
            </div>
          </div>

          <div
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              isVerified ? 'bg-muted' : 'bg-background'
            }`}
          >
            {isVerified ? 'Active' : 'Idle'}
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
          {isLoading ? 'Please wait...' : isVerified ? 'Disconnect' : 'Connect'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default OauthCard
