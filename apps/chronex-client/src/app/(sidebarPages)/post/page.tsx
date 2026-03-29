import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPostsHistory } from '@/components/posts/userPostsHistory'

export default function PostsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl tracking-tight">Posts</CardTitle>
            <CardDescription>
              Browse recent posts, check status quickly, and open any post for the full details.
            </CardDescription>
          </div>

          <CardContent className="p-0">
            <Button asChild>
              <Link href="/post/createPost">
                <Plus data-icon="inline-start" />
                Create post
              </Link>
            </Button>
          </CardContent>
        </CardHeader>
      </Card>

      <UserPostsHistory />
    </div>
  )
}
