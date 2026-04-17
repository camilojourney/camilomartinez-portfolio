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
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Juan Camilo Martinez | Applied AI Engineer',
    template: '%s | Juan Camilo Martinez',
  },
  description: 'Applied AI Engineer specializing in audio/speech ML and multi-agent systems. Built an audio ML pipeline from 46 research papers. NYC. Open to AI Engineer roles.',
  keywords: [
    'Applied AI Engineer',
    'audio ML',
    'speech ML',
    'multi-agent systems',
    'Whisper',
    'wav2vec2',
    'agent orchestration',
    'LLM',
    'machine learning',
    'New York City',
    'Juan Camilo Martinez',
    'Camilo Martinez',
  ],
  authors: [{ name: 'Camilo Martinez' }],
  creator: 'Camilo Martinez',
  openGraph: {
    title: 'Juan Camilo Martinez | Applied AI Engineer',
    description: 'Applied AI Engineer in NYC. Audio/speech ML, multi-agent systems, production pipelines from research papers.',
    url: baseUrl,
    siteName: 'Juan Camilo Martinez',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Juan Camilo Martinez - AI Engineer',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Juan Camilo Martinez | Applied AI Engineer',
    description: 'Applied AI Engineer in NYC. Audio/speech ML and multi-agent systems.',
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
  // verification: Google Search Console code should be added here once registered
  category: 'Technology',
}

import { cn } from '@/lib/utils'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${baseUrl}/#person`,
    name: 'Juan Camilo Martinez',
    alternateName: 'Camilo Martinez',
    url: baseUrl,
    jobTitle: 'Applied AI Engineer',
    description: 'Applied AI Engineer specializing in audio/speech ML and multi-agent systems. Built an audio ML pipeline from 46 research papers.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New York',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
    sameAs: [
      'https://github.com/camilojourney',
      'https://www.linkedin.com/in/camilomartinez-ai/',
      'https://x.com/camilojourney',
    ],
    knowsAbout: [
      'Audio/Speech ML',
      'Multi-Agent Systems',
      'Whisper',
      'wav2vec2',
      'Parselmouth',
      'Agent Orchestration',
      'Machine Learning',
      'Large Language Models',
      'FastAPI',
      'Python',
      'Next.js',
      'TypeScript',
    ],
    image: `${baseUrl}/og-image.png`,
    email: 'mailto:juancamilomabe@gmail.com',
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'Juan Camilo Martinez',
    url: baseUrl,
    description: 'Applied AI engineering portfolio — audio/speech ML, multi-agent systems, production pipelines',
    author: { '@id': `${baseUrl}/#person` },
  }

  const schemaData = [personSchema, websiteSchema]

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (!t) t = 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch (e) {}
              })();
            `,
          }}
        />
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
        {/* Skip to content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-cyan-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        {/* <AuthProvider suppressHydrationWarning> */}
        <div className="min-h-screen flex flex-col">
          <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <ChatWidget />
          <Analytics />
          <SpeedInsights />
        </div>
        {/* </AuthProvider> */}
      </body>
    </html>
  )
}
