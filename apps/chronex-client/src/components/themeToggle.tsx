'use client'

import { useId } from 'react'
import { flushSync } from 'react-dom'
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const themeOptions = [
  { label: 'Light', value: 'light', icon: SunIcon },
  { label: 'Dark', value: 'dark', icon: MoonIcon },
  { label: 'System', value: 'system', icon: LaptopIcon },
] as const

type ThemeMode = (typeof themeOptions)[number]['value']

type ViewTransition = {
  finished: Promise<void>
  ready: Promise<void>
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransition
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const toggleId = useId()

  const activeTheme = theme ?? 'system'

  const applyThemeToRoot = (nextMode: ThemeMode) => {
    const resolvedTheme =
      nextMode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : nextMode
    const root = document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.style.colorScheme = resolvedTheme
  }

  const handleThemeChange = (nextTheme: string) => {
    const nextMode = nextTheme as ThemeMode

    if (activeTheme === nextMode) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const transitionDocument = document as DocumentWithViewTransition
    const toggleButton = document.querySelector<HTMLButtonElement>(
      `[data-theme-toggle="${toggleId}"]`,
    )

    if (prefersReducedMotion || !transitionDocument.startViewTransition || !toggleButton) {
      setTheme(nextMode)
      return
    }

    const { top, left, width, height } = toggleButton.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )
    const nextResolvedTheme =
      nextMode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : nextMode
    const root = document.documentElement

    root.dataset.themeTransition = nextResolvedTheme
    const transition = transitionDocument.startViewTransition(() => {
      applyThemeToRoot(nextMode)
      flushSync(() => {
        setTheme(nextMode)
      })
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath:
            nextResolvedTheme === 'dark'
              ? [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
              : [`circle(${endRadius}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`],
        },
        {
          duration: 600,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement:
            nextResolvedTheme === 'dark'
              ? '::view-transition-new(root)'
              : '::view-transition-old(root)',
        },
      )
    })

    transition.finished.finally(() => {
      delete root.dataset.themeTransition
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="relative"
          aria-label="Toggle theme"
          data-theme-toggle={toggleId}
        >
          <SunIcon className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <MoonIcon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={activeTheme} onValueChange={handleThemeChange}>
            {themeOptions.map(({ label, value, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
