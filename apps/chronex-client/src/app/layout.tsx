import type { Metadata } from 'next'
import './globals.css'
import { TRPCProvider } from './providers'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { jetBrainsMono } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Chronex',
  description:
    'A social media management tool built for teams, designed to streamline content scheduling and collaboration across multiple platforms.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetBrainsMono.variable} antialiased`}>
        <TRPCProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCProvider>
        <Toaster />
      </body>
    </html>
  )
}
