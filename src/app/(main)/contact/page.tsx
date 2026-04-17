import { Metadata } from 'next'
import LiquidNav from '@/components/shared/liquid-nav'
import { baseUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Juan Camilo Martinez. Applied AI Engineer in NYC, open to AI Engineer roles in audio/speech ML and multi-agent systems.',
  openGraph: {
    title: 'Contact | Juan Camilo Martinez',
    description: 'Applied AI Engineer in NYC. Open to AI Engineer roles in audio/speech ML and multi-agent systems.',
    url: `${baseUrl}/contact`,
    images: [{ url: `${baseUrl}/og?title=${encodeURIComponent('Get in Touch')}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | Juan Camilo Martinez',
    description: 'Applied AI Engineer in NYC. Open to AI Engineer roles in audio/speech ML and multi-agent systems.',
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="contact" />
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <p className="hero-stagger hero-stagger-1 text-sm font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Get in touch
            </p>
            <h1 className="hero-stagger hero-stagger-2 text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
              Let&apos;s Talk
            </h1>
            <p className="hero-stagger hero-stagger-3 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Seeking{' '}
              <span className="text-cyan-400 font-semibold">Applied AI Engineer</span> roles
              in audio/speech ML, multi-agent systems, and production AI.
            </p>
          </div>

          {/* Primary CTA row */}
          <div className="hero-stagger hero-stagger-4 flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a
              href="mailto:juancamilomabe@gmail.com?subject=AI%20Engineer%20Opportunity"
              className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-foreground text-lg font-medium px-8 py-4 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              juancamilomabe@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/camilomartinez-ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 bg-white/[0.06] border border-white/[0.10] text-foreground text-lg font-medium px-8 py-4 rounded-2xl hover:bg-white/[0.10] hover:border-white/[0.16] transition-all duration-300 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 text-blue-300 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Connect on LinkedIn
            </a>
          </div>

          {/* Social links row */}
          <div className="hero-stagger hero-stagger-5 flex justify-center gap-4 mb-16">
            <a
              href="https://github.com/camilojourney"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3 hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-300"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">GitHub</span>
            </a>
            <a
              href="https://x.com/camilojourney"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3 hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-300"
              aria-label="X (Twitter)"
            >
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
              </svg>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Twitter</span>
            </a>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Location */}
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
              <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-foreground font-medium mb-1">Location</p>
              <p className="text-muted-foreground text-sm">New York City, NY</p>
            </div>

            {/* Status */}
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
              <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-foreground font-medium mb-1">Availability</p>
              <p className="text-emerald-400 text-sm font-medium">Open to opportunities</p>
            </div>

            {/* Response time */}
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
              <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-foreground font-medium mb-1">Response Time</p>
              <p className="text-muted-foreground text-sm">Usually within 24 hours</p>
            </div>
          </div>

          {/* What I bring */}
          <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-foreground mb-6">What I bring</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-muted-foreground">
                <p className="text-2xl font-bold text-foreground mb-1">10+</p>
                Production AI apps
              </div>
              <div className="text-muted-foreground">
                <p className="text-2xl font-bold text-foreground mb-1">46</p>
                Papers in speech pipeline
              </div>
              <div className="text-muted-foreground">
                <p className="text-2xl font-bold text-foreground mb-1">5+</p>
                Multi-agent systems
              </div>
              <div className="text-muted-foreground">
                <p className="text-2xl font-bold text-foreground mb-1">NYC</p>
                Available immediately
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
