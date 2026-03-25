// "use client"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from './ui/card'
import { connectMapper } from '@/lib/oauthMapper/connect'
import { useDisconnectMapper } from '@/lib/oauthMapper/disconnect'
import { PlatformId } from '@/config/platforms'
import { Button } from './ui/button'
import IconRenderer from '@/lib/logoMapping'
const OauthCard = ({
  platformname,
  isVerified,
}: {
  platformname: PlatformId
  isVerified: boolean
}) => {
  const handleConnect = () => {
    const url = connectMapper[platformname]()
    window.open(url, '', 'width=600,height=600,left=100,top=100')
  }
  const disconnect = useDisconnectMapper()
  const handleDisconnect = () => {
    const url = disconnect[platformname]()
    url.then((res) => {
      if (res.success) {
        window.location.reload()
      }
    })
  }
  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="mx-auto">
          <IconRenderer name={platformname} />
        </CardTitle>
      </CardHeader>
      <CardContent className="mx-auto">
        <Button className="cursor-pointer" onClick={isVerified ? handleDisconnect : handleConnect}>
          {isVerified ? 'Disconnect' : 'Connect'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default OauthCard
