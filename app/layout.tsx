import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import { AIChat } from '@/components/ai-chat'
import { PWARegistration, InstallPrompt } from '@/components/pwa-registration'
import './globals.css'

export const metadata: Metadata = {
  title: 'AbhiBase — Your life, one base',
  description:
    'AI-powered notes, tasks, planning, habits, team projects and shared expenses in one beautiful workspace.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AbhiBase',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7c3aed',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <AIChat />
        <PWARegistration />
        <InstallPrompt />
      </body>
    </html>
  )
}
