import '@/styles/globals.css'
import '@/styles/animations.css'
import type { Metadata } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { baseUrl, EMAIL, GITHUB, LINKEDIN, X_PROFILE } from '@/lib/site'
import Footer from '@/components/shared/footer'
import ChatWidget from '@/components/ChatWidget'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const shouldRenderVercelTelemetry = Boolean(process.env.VERCEL || process.env.VERCEL_ENV)

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
    sameAs: [GITHUB, LINKEDIN, X_PROFILE],
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
    email: `mailto:${EMAIL}`,
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'Juan Camilo Martinez',
    url: baseUrl,
    description: 'Applied AI engineering portfolio: audio/speech ML, multi-agent systems, production pipelines',
    author: { '@id': `${baseUrl}/#person` },
  }

  const schemaData = [personSchema, websiteSchema]

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, instrumentSerif.variable, GeistMono.variable)}
    >
      <head>
        {/* Theme resolves before paint: saved choice, else the OS preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (t !== 'light' && t !== 'dark') {
                    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', t);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
        <meta name="theme-color" content="#f7f6f2" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#131311" media="(prefers-color-scheme: dark)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#f7f6f2" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
          suppressHydrationWarning
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-page font-sans text-ink antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <main id="main-content" className="w-full flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <ChatWidget />
          {shouldRenderVercelTelemetry && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </div>
      </body>
    </html>
  )
}
