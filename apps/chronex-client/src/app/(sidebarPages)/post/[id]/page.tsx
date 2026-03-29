'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, CalendarDays, ExternalLink, FileImage, FileVideo, Loader2 } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function formatDate(value: Date | null) {
  if (!value) return 'Not scheduled'
  return format(new Date(value), 'dd MMM yyyy, hh:mm a')
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'published' || status === 'success') return 'default'
  if (status === 'failed') return 'destructive'
  if (status === 'scheduled') return 'secondary'
  return 'outline'
}

function formatBytes(value: number | null) {
  if (!value) return 'Unknown size'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getPlatformText(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null

  if ('caption' in metadata && typeof metadata.caption === 'string' && metadata.caption.trim()) {
    return metadata.caption.trim()
  }

  if (
    'description' in metadata &&
    typeof metadata.description === 'string' &&
    metadata.description.trim()
  ) {
    return metadata.description.trim()
  }

  if ('title' in metadata && typeof metadata.title === 'string' && metadata.title.trim()) {
    return metadata.title.trim()
  }

  return null
}

export default function PostDetailsPage() {
  const params = useParams<{ id: string }>()
  const postId = Number(params.id)

  const { data, isLoading } = trpc.post.getUserPostById.useQuery(
    { id: postId },
    { enabled: Number.isFinite(postId) && postId > 0 },
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/post">
            <ArrowLeft data-icon="inline-start" />
            Back to posts
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLoading ? 'Loading post...' : (data?.refName ?? 'Post details')}
          </h1>
          <p className="text-sm text-muted-foreground">
            Simple post overview with platform status and attached media.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" />
            Loading post details...
          </CardContent>
        </Card>
      ) : !data ? (
        <Alert>
          <AlertTitle>Post not found</AlertTitle>
          <AlertDescription>
            This post is unavailable or you do not have access to it.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getStatusVariant(data.status)} className="capitalize">
                  {data.status}
                </Badge>
                <span className="text-sm text-muted-foreground">Post #{data.id}</span>
              </div>
              <CardTitle>{data.refName}</CardTitle>
              <CardDescription>Scheduled for {formatDate(data.scheduledAt)}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Platforms</p>
                <p className="mt-1 font-medium capitalize">{data.platforms.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Media</p>
                <p className="mt-1 font-medium">{data.mediaCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="mt-1 font-medium">{formatDate(data.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="mt-1 font-medium">{formatDate(data.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Status</CardTitle>
              <CardDescription>Only the useful posting details for each platform.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.platformPosts.map((platformPost) => {
                const text = getPlatformText(platformPost.metadata)

                return (
                  <div key={platformPost.id} className="rounded-lg border bg-muted/20 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium capitalize">{platformPost.platform}</p>
                          <Badge
                            variant={getStatusVariant(platformPost.status)}
                            className="capitalize"
                          >
                            {platformPost.status}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                          <p className="inline-flex items-center gap-2">
                            <CalendarDays className="size-4" />
                            Scheduled {formatDate(platformPost.scheduledAt)}
                          </p>
                          {platformPost.publishedAt ? (
                            <p>Published {formatDate(platformPost.publishedAt)}</p>
                          ) : null}
                          {text ? <p className="line-clamp-3 text-foreground">{text}</p> : null}
                          {platformPost.errorMessage ? (
                            <p className="text-destructive">{platformPost.errorMessage}</p>
                          ) : null}
                        </div>
                      </div>

                      {platformPost.postUrl ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={platformPost.postUrl} target="_blank" rel="noreferrer">
                            Open post
                            <ExternalLink data-icon="inline-end" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Attached files for this post.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {data.media.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
                  No media attached to this post.
                </div>
              ) : (
                data.media.map((media) => (
                  <div key={media.id} className="rounded-xl border bg-muted/20 p-4">
                    <div className="aspect-video overflow-hidden rounded-lg bg-muted/40">
                      {media.type === 'image' ? (
                        <div className="relative size-full">
                          <Image
                            src={media.url}
                            alt={media.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <video src={media.url} controls className="size-full object-cover" />
                      )}
                    </div>

                    <div className="mt-4 flex items-start gap-3">
                      <div className="rounded-md bg-muted p-2">
                        {media.type === 'image' ? <FileImage /> : <FileVideo />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{media.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {media.type === 'image' ? 'Image' : 'Video'} · {formatBytes(media.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
