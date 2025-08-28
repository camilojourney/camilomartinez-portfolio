import '@/styles/globals.css'
import '@/styles/animations.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { baseUrl } from './sitemap'
import AuthProvider from '@/components/features/auth/AuthProvider'
import LiquidNav from '@/components/shared/liquid-nav'
import Footer from '@/components/shared/footer'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Camilo Martinez | AI Developer',
    template: '%s | Camilo Martinez',
  },
  description: 'A modern, interactive portfolio showcasing expertise in AI development, data analytics, and full-stack development.',
  openGraph: {
    title: 'Camilo Martinez | AI Developer',
    description: 'A modern, interactive portfolio showcasing expertise in AI development, data analytics, and full-stack development.',
    url: baseUrl,
    siteName: 'Camilo Martinez Portfolio',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

import { cn } from '@/lib/utils'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn(
        'text-black bg-white dark:text-white dark:bg-black',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <head>
        <link rel="canonical" href="https://camilomartinez.co" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans text-foreground antialiased", GeistSans.className)}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <LiquidNav />
            <main className="flex-1 w-full">
              {children}
            </main>
            <Footer />
            <Analytics />
            <SpeedInsights />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
