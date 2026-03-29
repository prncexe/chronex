'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Upload,
  X,
  FileText,
  ImageIcon,
  Film,
  Music,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { Input } from './ui/input'
import NextImage from 'next/image'
// --- Types ---
interface UploadedFile {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
  maxFiles?: number
  className?: string
}

interface MediaDimensions {
  width: number
  height: number
  duration?: number
}

// --- Helpers ---
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type.startsWith('video/')) return Film
  if (type.startsWith('audio/')) return Music
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText
  return File
}

function getFileColor(type: string): string {
  if (type.startsWith('image/')) return 'text-muted-foreground'
  if (type.startsWith('video/')) return 'text-muted-foreground'
  if (type.startsWith('audio/')) return 'text-muted-foreground'
  if (type.includes('pdf')) return 'text-muted-foreground'
  return 'text-muted-foreground'
}

function getMediaDimensions(file: File): Promise<MediaDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)

    if (file.type.startsWith('image/')) {
      const img = new window.Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        reject(new Error('Failed to read image dimensions'))
        URL.revokeObjectURL(url)
      }
      img.src = url
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Math.round(video.duration),
        })
        URL.revokeObjectURL(url)
      }
      video.onerror = () => {
        reject(new Error('Failed to read video metadata'))
        URL.revokeObjectURL(url)
      }
      video.src = url
    } else {
      URL.revokeObjectURL(url)
      resolve({ width: 0, height: 0 })
    }
  })
}

/**
 * Upload a single file to B2 using fetch.
 *
 * Why not XHR? The only reason XHR was used was for upload progress via
 * xhr.upload.onprogress. fetch() doesn't expose upload progress (the Streams
 * API workaround has poor browser support and adds a lot of complexity for
 * little gain). An indeterminate spinner during upload is a better UX tradeoff
 * than the complexity of keeping XHR around just for a progress percentage.
 */
async function uploadFileToB2(
  file: File,
  uploadUrl: string,
  authToken: string,
  dimensions: MediaDimensions,
): Promise<{ fileId: string }> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const headers: Record<string, string> = {
    Authorization: authToken,
    'X-Bz-File-Name': encodeURIComponent(id),
    'Content-Type': file.type || 'b2/x-auto',
    'X-Bz-Content-Sha1': 'do_not_verify',
    'X-Bz-Info-width': String(dimensions.width),
    'X-Bz-Info-height': String(dimensions.height),
  }

  if (dimensions.duration !== undefined) {
    headers['X-Bz-Info-duration'] = String(dimensions.duration)
  }

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: file,
  })

  if (!response.ok) {
    // B2 returns a JSON error body, surface it if possible
    let detail = ''
    try {
      const err = await response.json()
      detail = err.message ? `: ${err.message}` : ''
    } catch {
      // ignore parse failure
    }
    throw new Error(`B2 upload failed (${response.status})${detail}`)
  }

  const data = await response.json()
  return { fileId: data.fileId }
}

// --- Component ---
export default function FileUpload({
  accept,
  multiple = true,
  maxSizeMB = 50,
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dragCounter = React.useRef(0)

  /**
   * useUtils gives us an imperative `.fetch()` for queries — the correct
   * tRPC pattern when you need to call a query on demand (e.g. inside a
   * click handler or loop) rather than on render.
   *
   * The old pattern (`useQuery({ enabled: false })` + `refetch()`) is an
   * anti-pattern: refetch() shares state across concurrent calls, so
   * uploading multiple files in a loop would cause them to race on the same
   * query cache entry. Each B2 upload needs its own fresh URL anyway.
   *
   * If getUploadUrl has side effects (it does — it reserves a B2 upload slot),
   * consider converting it to a mutation on the backend too.
   */
  const utils = trpc.useUtils()
  const saveMedia = trpc.post.saveMedia.useMutation()

  const processFiles = React.useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: UploadedFile[] = []
      const fileArray = Array.from(incoming)

      for (const file of fileArray) {
        if (files.length + newFiles.length >= maxFiles) break

        if (file.size > maxSizeMB * 1024 * 1024) {
          newFiles.push({
            id: crypto.randomUUID(),
            file,
            status: 'error',
            error: `File exceeds ${maxSizeMB}MB limit`,
          })
          continue
        }

        const entry: UploadedFile = {
          id: crypto.randomUUID(),
          file,
          status: 'pending',
        }

        if (file.type.startsWith('image/')) {
          entry.preview = URL.createObjectURL(file)
        }

        newFiles.push(entry)
      }

      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, maxFiles, maxSizeMB],
  )

  // -- Drag handlers --
  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items?.length) setIsDragActive(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragActive(false)
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragActive(false)
      if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) processFiles(e.target.files)
      e.target.value = ''
    },
    [processFiles],
  )

  const removeFile = React.useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const clearAll = React.useCallback(() => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setFiles([])
  }, [files])

  const handleUpload = React.useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (!pendingFiles.length) return

    setIsUploading(true)

    for (const pf of pendingFiles) {
      try {
        setFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, status: 'uploading' as const } : f)),
        )

        // Fetch a fresh upload URL for each file — no shared query state
        const uploadData = await utils.post.getUploadUrl.fetch()

        const dimensions = await getMediaDimensions(pf.file)

        const response = await uploadFileToB2(
          pf.file,
          uploadData.uploadUrl,
          uploadData.authorizationToken,
          dimensions,
        )
        console.log(response)

        const contentType = pf.file.type.startsWith('video/') ? 'video' : 'image'

        await saveMedia.mutateAsync({
          contentType: contentType as 'image' | 'video',
          fileId: response.fileId,
        })

        setFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, status: 'success' as const } : f)),
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setFiles((prev) =>
          prev.map((f) =>
            f.id === pf.id ? { ...f, status: 'error' as const, error: errorMessage } : f,
          ),
        )
      }
    }

    setIsUploading(false)
  }, [files, utils, saveMedia])

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const hasFiles = files.length > 0

  return (
    <Card className={cn('w-full max-w-xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="size-5 text-muted-foreground" />
          Upload Files
        </CardTitle>
        <CardDescription>
          Drag & drop files here or click to browse.{' '}
          <span className="text-muted-foreground/70">
            Max {maxSizeMB}MB per file · Up to {maxFiles} files
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload files"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-300',
            isDragActive
              ? 'border-border bg-muted/60 shadow-[0_0_0_4px] shadow-black/5'
              : 'border-border/60 hover:border-border hover:bg-muted/40',
            isUploading && 'pointer-events-none opacity-60',
          )}
        >
          <div
            className={cn(
              'flex size-14 items-center justify-center rounded-full bg-muted transition-all duration-300',
              isDragActive && 'scale-110 bg-secondary',
            )}
          >
            <Upload
              className={cn(
                'size-6 transition-all duration-300',
                isDragActive
                  ? '-translate-y-1 text-foreground'
                  : 'text-muted-foreground group-hover:-translate-y-0.5 group-hover:text-foreground',
              )}
            />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Drop files here' : 'Click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              {accept ? `Accepted: ${accept}` : 'SVG, PNG, JPG, GIF, PDF, MP4, and more'}
            </p>
          </div>

          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        {/* File List */}
        {hasFiles && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <Button
                type="button"
                onClick={clearAll}
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
              >
                Clear all
              </Button>
            </div>

            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {files.map((f) => {
                const IconComp = getFileIcon(f.file.type)
                const iconColor = getFileColor(f.file.type)

                return (
                  <div
                    key={f.id}
                    className={cn(
                      'group/file relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-all duration-200',
                      f.status === 'error' && 'border-destructive/20 bg-destructive/5',
                      f.status === 'success' && 'border-border bg-muted/20',
                    )}
                  >
                    {/* Preview / Icon */}
                    {f.preview ? (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
                        <NextImage
                          src={f.preview}
                          alt={f.file.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-md bg-muted',
                          iconColor,
                        )}
                      >
                        <IconComp className="size-5" />
                      </div>
                    )}

                    {/* File info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{f.file.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(f.file.size)}
                        </span>
                        {f.status === 'uploading' && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Loader2 className="size-3 animate-spin" />
                            Uploading…
                          </span>
                        )}
                        {f.status === 'error' && f.error && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="size-3" />
                            {f.error}
                          </span>
                        )}
                        {f.status === 'success' && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="size-3" />
                            Uploaded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(f.id)
                      }}
                      className={cn(
                        'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-secondary text-muted-foreground transition-all hover:text-destructive',
                        f.status === 'uploading' && 'pointer-events-none opacity-0',
                      )}
                      aria-label={`Remove ${f.file.name}`}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {hasFiles && (
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            onClick={clearAll}
            disabled={isUploading}
            className="flex-1 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || pendingCount === 0}
            className="flex-1 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload {pendingCount > 0 ? `(${pendingCount})` : ''}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
