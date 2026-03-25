'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authClient } from '@/utils/authClient'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LogoutPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/login')
    }
  }, [session, isPending, router])

  const handleLogout = async () => {
    setLoading(true)
    await authClient.signOut()

    router.refresh()
    router.replace('/login')
  }

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Logout</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full cursor-pointer"
            size="lg"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Continue to Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
