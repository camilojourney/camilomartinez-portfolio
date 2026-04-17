function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06]" role="contentinfo">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12">
          {/* Brand column */}
          <div className="md:col-span-5">
            <p className="text-base font-semibold text-foreground tracking-tight mb-2">
              Camilo Martinez
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Applied AI Engineer in NYC. Building audio/speech ML pipelines and multi-agent systems.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://github.com/camilojourney"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-muted-foreground transition-colors duration-200 border border-white/[0.08] rounded-full px-3 py-1.5"
              >
                <GitHubIcon />
                <span>15+ repos</span>
              </a>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-white/[0.08] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70"></span>
                10+ production systems
              </span>
            </div>
          </div>

          {/* Navigation column */}
          <div className="md:col-span-3">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground mb-4">
              Pages
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Footer navigation">
              <a href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit">Work</a>
              <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit">About</a>
              <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit">Blog</a>
              <a href="/bookshelf" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit">Bookshelf</a>
              <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit">Contact</a>
            </nav>
          </div>

          {/* Connect column */}
          <div className="md:col-span-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground mb-4">
              Connect
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href="https://github.com/camilojourney"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
                aria-label="GitHub"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/camilomartinez-ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-blue-400 transition-colors duration-200 w-fit"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://x.com/camilojourney"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
                aria-label="X (Twitter)"
              >
                <XIcon />
                <span>X / Twitter</span>
              </a>
              <a
                href="mailto:juancamilomabe@gmail.com"
                className="group inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-cyan-400 transition-colors duration-200 w-fit"
                aria-label="Email"
              >
                <EmailIcon />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-6"></div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Juan Camilo Martinez. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/privacy-policy" className="hover:text-muted-foreground transition-colors duration-200">Privacy</a>
            <a href="/terms-of-service" className="hover:text-muted-foreground transition-colors duration-200">Terms</a>
            <a href="/sitemap.xml" className="hover:text-muted-foreground transition-colors duration-200">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
