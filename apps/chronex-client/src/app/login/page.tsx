'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authClient } from '@/utils/authClient'
import { Github } from 'lucide-react'
import { useRouter } from 'next/navigation'
export default function LoginPage() {
  const router = useRouter()
  const session = authClient.useSession()
  if (session.data?.user) {
    router.push('/tokens')
  }
  const handleGithubLogin = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/tokens',
    })
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full cursor-pointer" size="lg" onClick={handleGithubLogin}>
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
