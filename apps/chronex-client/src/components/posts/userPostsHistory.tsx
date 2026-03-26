'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ChevronDown, ExternalLink, FileText, Layers3, Loader2, CalendarDays } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const PAGE_SIZE = 5

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

export function UserPostsHistory() {
  const [page, setPage] = React.useState(1)
  const [openPostId, setOpenPostId] = React.useState<number | null>(null)

  const { data, isLoading, isFetching } = trpc.post.getUserPosts.useQuery({
    page,
    pageSize: PAGE_SIZE,
  })

  React.useEffect(() => {
    setOpenPostId(null)
  }, [page])

  const items = data?.items ?? []

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>
              Expand a post to inspect platform-specific status and payload details.
            </CardDescription>
          </div>
          {isFetching && !isLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading posts...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
            No posts created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((post) => {
              const isOpen = openPostId === post.id
              return (
                <Collapsible
                  key={post.id}
                  open={isOpen}
                  onOpenChange={(open) => setOpenPostId(open ? post.id : null)}
                >
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/30"
                      >
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {post.refName}
                            </p>
                            <Badge variant={getStatusVariant(post.status)} className="capitalize">
                              {post.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5" />
                              {formatDate(post.scheduledAt)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Layers3 className="size-3.5" />
                              {post.platformCount} platform{post.platformCount === 1 ? '' : 's'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="size-3.5" />
                              {post.mediaCount} media item{post.mediaCount === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            'size-4 shrink-0 text-muted-foreground transition-transform',
                            isOpen && 'rotate-180',
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="border-t border-border/60 bg-accent/15 px-4 py-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Overview
                          </p>
                          <div className="space-y-2 rounded-lg border bg-background p-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Created</span>
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Updated</span>
                              <span>{formatDate(post.updatedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Platforms</span>
                              <span className="text-right capitalize">
                                {post.platforms.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Platform Details
                          </p>
                          <div className="space-y-2">
                            {post.platformPosts.map((platformPost) => {
                              const metadata =
                                platformPost.metadata && typeof platformPost.metadata === 'object'
                                  ? platformPost.metadata
                                  : null
                              const caption =
                                metadata &&
                                'caption' in metadata &&
                                typeof metadata.caption === 'string'
                                  ? metadata.caption
                                  : null
                              const type =
                                metadata && 'type' in metadata && typeof metadata.type === 'string'
                                  ? metadata.type
                                  : null

                              return (
                                <div
                                  key={platformPost.id}
                                  className="space-y-2 rounded-lg border bg-background p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium capitalize">
                                        {platformPost.platform}
                                      </p>
                                      <Badge
                                        variant={getStatusVariant(platformPost.status)}
                                        className="capitalize"
                                      >
                                        {platformPost.status}
                                      </Badge>
                                    </div>
                                    {platformPost.postUrl ? (
                                      <a
                                        href={platformPost.postUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                      >
                                        Open post <ExternalLink className="size-3" />
                                      </a>
                                    ) : null}
                                  </div>
                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>Type: {type ?? 'Not available'}</p>
                                    <p>Scheduled: {formatDate(platformPost.scheduledAt)}</p>
                                    <p>Published: {formatDate(platformPost.publishedAt)}</p>
                                    {platformPost.errorMessage ? (
                                      <p className="text-destructive">
                                        Error: {platformPost.errorMessage}
                                      </p>
                                    ) : null}
                                  </div>
                                  {caption ? (
                                    <div className="rounded-md bg-accent/40 p-2 text-xs text-foreground">
                                      {caption}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
          </div>
        )}

        {data && data.totalPages > 1 ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (page > 1) setPage(page - 1)
                  }}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: data.totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      onClick={(event) => {
                        event.preventDefault()
                        setPage(pageNumber)
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    if (page < data.totalPages) setPage(page + 1)
                  }}
                  className={page === data.totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}

        {data ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {(data.page - 1) * data.pageSize + 1}-
              {Math.min(data.page * data.pageSize, data.totalItems)} of {data.totalItems}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 cursor-pointer text-xs"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              Back to first page
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
