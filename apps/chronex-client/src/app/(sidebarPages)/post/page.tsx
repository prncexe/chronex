import Link from 'next/link'
import { Plus } from 'lucide-react'
import { UserPostsHistory } from '@/components/posts/userPostsHistory'

export default function PostsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Browse all posts you created and expand any row for platform details.
          </p>
        </div>

        <Link
          href="/post/createPost"
          aria-label="Create post"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <UserPostsHistory />
    </div>
  )
}
