'use client'

import { format } from 'date-fns'
import { CalendarDays, Clock, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { combineDateAndTime } from '../utils'

type Props = {
  title: string
  onTitleChange: (value: string) => void
  scheduledDate?: Date
  onScheduledDateChange: (date?: Date) => void
  calendarOpen: boolean
  onCalendarOpenChange: (open: boolean) => void
  timeHour: string
  onTimeHourChange: (value: string) => void
  onTimeHourBlur: () => void
  timeMinute: string
  onTimeMinuteChange: (value: string) => void
  onTimeMinuteBlur: () => void
  timeAmPm: 'AM' | 'PM'
  onTimeAmPmChange: (value: 'AM' | 'PM') => void
  scheduledTime: string
  unifiedCaption: string
  onUnifiedCaptionChange: (value: string) => void
  selectedPlatformCount: number
}

export function PostDetailsCard({
  title,
  onTitleChange,
  scheduledDate,
  onScheduledDateChange,
  calendarOpen,
  onCalendarOpenChange,
  timeHour,
  onTimeHourChange,
  onTimeHourBlur,
  timeMinute,
  onTimeMinuteChange,
  onTimeMinuteBlur,
  timeAmPm,
  onTimeAmPmChange,
  scheduledTime,
  unifiedCaption,
  onUnifiedCaptionChange,
  selectedPlatformCount,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            2
          </div>
          <div>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>
              Set title, schedule, and a shared caption across platforms
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="post-title">Internal Title</Label>
          <Input
            id="post-title"
            placeholder="e.g. Spring Campaign Launch"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label className="gap-2">
            <CalendarDays className="size-4 text-muted-foreground" /> Schedule
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    id="scheduled-at"
                    variant="outline"
                    className={cn(
                      'w-full justify-start gap-2 text-left font-normal',
                      !scheduledDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarDays className="size-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => {
                      onScheduledDateChange(date)
                      onCalendarOpenChange(false)
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduled-time" className="text-xs text-muted-foreground">
                <Clock className="size-3" /> Time (Local)
              </Label>
              <div className="flex h-9 items-center gap-1 rounded-md border border-input shadow-sm">
                <Input
                  className="h-8 w-12 border-none px-1 text-center shadow-none focus-visible:ring-0"
                  maxLength={2}
                  placeholder="12"
                  value={timeHour}
                  onChange={(event) => onTimeHourChange(event.target.value)}
                  onBlur={onTimeHourBlur}
                />
                <span className="font-medium text-muted-foreground">:</span>
                <Input
                  className="h-8 w-12 border-none px-1 text-center shadow-none focus-visible:ring-0"
                  maxLength={2}
                  placeholder="00"
                  value={timeMinute}
                  onChange={(event) => onTimeMinuteChange(event.target.value)}
                  onBlur={onTimeMinuteBlur}
                />
                <div className="mr-1 flex flex-col border-l border-input">
                  <button
                    type="button"
                    onClick={() => onTimeAmPmChange('AM')}
                    className={cn(
                      'cursor-pointer rounded-tr-sm px-1.5 py-0.75 text-[9px] leading-none font-bold',
                      timeAmPm === 'AM'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => onTimeAmPmChange('PM')}
                    className={cn(
                      'cursor-pointer rounded-br-sm px-1.5 py-0.75 text-[9px] leading-none font-bold',
                      timeAmPm === 'PM'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {scheduledDate
              ? `${combineDateAndTime(scheduledDate, scheduledTime).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })} (local)`
              : 'No date selected'}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="gap-2">
              <FileText className="size-4 text-muted-foreground" /> Unified Caption
            </Label>
            {selectedPlatformCount > 0 && (
              <Badge variant="secondary" className="text-[11px]">
                Applies to {selectedPlatformCount} platform
                {selectedPlatformCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Textarea
            placeholder="Write a caption that will be shared across all selected platforms. You can customize per-platform below."
            value={unifiedCaption}
            onChange={(event) => onUnifiedCaptionChange(event.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-[11px] text-muted-foreground">
            This caption syncs to all platforms. Override individually in the platform tabs below.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
