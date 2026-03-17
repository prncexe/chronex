// "use client"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from './ui/card'
import { connectMapper } from '@/lib/oauthMapper/connect'
import { disconnectMapper } from '@/lib/oauthMapper/disconnect'
import { PlatformId } from '@/config/platforms'
import { Button } from './ui/button'
const OauthCard = ({
  platformname,
  isVerified,
}: {
  platformname: PlatformId
  isVerified: boolean
}) => {
  const handleConnect = () => {
    const url = connectMapper[platformname]()
    window.open(url, '','width=600,height=600,left=100,top=100')
  }
  const handleDisconnect = () => {
    const url = disconnectMapper[platformname]()
    window.open(url, '_self')
  }
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{platformname}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="cursor-pointer" onClick={isVerified ? handleDisconnect : handleConnect}>
          {isVerified ? 'Disconnect' : 'Connect'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default OauthCard
