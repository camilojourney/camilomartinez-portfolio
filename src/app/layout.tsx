import '@/styles/globals.css'
import '@/styles/animations.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { baseUrl } from '@/lib/site'
// AuthProvider removed - not currently used, and imports next-auth which causes SSR issues
// import AuthProvider from '@/components/features/auth/AuthProvider'
import LiquidNav from '@/components/shared/liquid-nav'
import Footer from '@/components/shared/footer'
// import { GlobalChatbot } from '@/components/features/GlobalChatbot' // Temporarily hidden

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Camilo Martinez | AI Engineering Consultant',
    template: '%s | Camilo Martinez',
  },
  description: 'AI engineering consulting for startups and enterprises. Custom ML systems, data pipelines, RAG architectures, and LLM integrations. Based in New York City.',
  keywords: [
    'AI consulting',
    'AI engineer',
    'machine learning consulting',
    'data engineering',
    'RAG systems',
    'LLM integration',
    'AI strategy',
    'New York City',
    'Camilo Martinez',
  ],
  authors: [{ name: 'Camilo Martinez' }],
  creator: 'Camilo Martinez',
  openGraph: {
    title: 'Camilo Martinez | AI Engineering Consultant',
    description: 'AI engineering consulting for startups and enterprises. Custom ML systems, data pipelines, RAG architectures, and LLM integrations.',
    url: baseUrl,
    siteName: 'Camilo Martinez Consulting',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Camilo Martinez - AI Engineering Consultant',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Camilo Martinez | AI Engineering Consultant',
    description: 'AI engineering consulting: ML systems, data pipelines, RAG, LLM integrations.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@camilojourney',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Update with actual code
  },
  category: 'Technology',
}

import { cn } from '@/lib/utils'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Camilo Martinez',
    url: baseUrl,
    jobTitle: 'AI Engineering Consultant',
    description: 'AI engineering consulting for startups and enterprises. Custom ML systems, data pipelines, RAG, and LLM integrations.',
    sameAs: [
      'https://github.com/camilojourney',
      'https://linkedin.com/in/camilomartinez',
      'https://twitter.com/camilojourney',
    ],
    knowsAbout: [
      'Machine Learning',
      'Data Engineering',
      'Full-Stack Development',
      'AI Systems',
      'Speech AI',
      'Data Pipelines',
      'FastAPI',
      'Next.js',
    ],
    image: `${baseUrl}/og-image.png`,
    mainEntity: {
      '@type': 'WebSite',
      name: 'Camilo Martinez Consulting',
      url: baseUrl,
      description: 'AI engineering consulting — custom ML systems, data pipelines, and intelligent automation',
    },
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'text-black bg-white dark:text-white dark:bg-black',
        GeistSans.variable
      )}
    >
      <head>
        <link rel="canonical" href={baseUrl} />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
          suppressHydrationWarning
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn("min-h-screen bg-background font-sans text-foreground antialiased", GeistSans.className)}
      >
        {/* <AuthProvider suppressHydrationWarning> */}
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          {/* <GlobalChatbot /> */} {/* Temporarily hidden - will show when AI answers are optimized */}
          <Analytics />
          <SpeedInsights />
        </div>
        {/* </AuthProvider> */}
      </body>
    </html>
  )
}
