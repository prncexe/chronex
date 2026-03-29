'use client'

import Link from 'next/link'
import * as React from 'react'
import { format } from 'date-fns'
import { CalendarDays, ChevronRight, Loader2 } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = ['10', '15', '20'] as const

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

function getPostSummary(post: { platformPosts: Array<{ metadata: unknown }> }) {
  for (const platformPost of post.platformPosts) {
    const metadata =
      platformPost.metadata && typeof platformPost.metadata === 'object'
        ? platformPost.metadata
        : null

    if (!metadata) continue

    if ('caption' in metadata && typeof metadata.caption === 'string' && metadata.caption.trim()) {
      return metadata.caption.trim()
    }

    if ('title' in metadata && typeof metadata.title === 'string' && metadata.title.trim()) {
      return metadata.title.trim()
    }
  }

  return null
}

export function UserPostsHistory() {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)

  const { data, isLoading, isFetching } = trpc.post.getUserPosts.useQuery({
    page,
    pageSize,
  })

  const items = data?.items ?? []

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Posts</CardTitle>
            <CardDescription>
              Simple list view. Open any post to see the full details.
            </CardDescription>
          </div>
          {isFetching && !isLoading ? (
            <Loader2 className="animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPage(1)
                setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {data ? (
            <p className="text-sm text-muted-foreground">
              {(data.page - 1) * data.pageSize + 1}-
              {Math.min(data.page * data.pageSize, data.totalItems)} of {data.totalItems}
            </p>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" />
            Loading posts...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            No posts created yet.
          </div>
        ) : (
          <div className="rounded-xl border">
            {items.map((post, index) => {
              const summary = getPostSummary(post)

              return (
                <React.Fragment key={post.id}>
                  <Link
                    href={`/post/${post.id}`}
                    className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{post.refName}</p>
                        <Badge variant={getStatusVariant(post.status)} className="capitalize">
                          {post.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-4" />
                          {formatDate(post.scheduledAt)}
                        </span>
                        <span>{post.platforms.join(', ')}</span>
                        <span>{post.mediaCount} media</span>
                      </div>
                      {summary ? (
                        <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{summary}</p>
                      ) : null}
                    </div>

                    <ChevronRight className="shrink-0 text-muted-foreground" />
                  </Link>

                  {index < items.length - 1 ? <Separator /> : null}
                </React.Fragment>
              )
            })}
          </div>
        )}

        {data && data.totalPages > 1 ? (
          <Pagination className="pt-4">
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
      </CardContent>
    </Card>
  )
}
