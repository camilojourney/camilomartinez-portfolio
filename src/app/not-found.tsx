import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist or has been moved.',
  openGraph: {
    title: '404 - Page Not Found | Juan Camilo Martinez',
    description: 'The page you are looking for does not exist or has been moved.',
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <div className="text-center px-4 max-w-lg mx-auto">
        {/* Large 404 */}
        <div className="mb-6 relative">
          <span className="text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter bg-gradient-to-b from-white/15 via-white/8 to-transparent bg-clip-text text-transparent select-none block">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">
          Lost in the latent space
        </h1>
        <p className="text-base text-white/55 mb-10 leading-relaxed">
          This page does not exist, was moved, or perhaps it was just a hallucination.
          Let me help you find your way back.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-400/20 text-white font-medium px-8 py-3.5 rounded-2xl hover:from-cyan-500/25 hover:to-blue-500/25 hover:border-cyan-400/35 transition-all duration-300 shadow-lg shadow-cyan-500/5"
          >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/projects"
            className="group inline-flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.08] text-white/70 font-medium px-8 py-3.5 rounded-2xl hover:text-white hover:bg-white/[0.10] hover:border-white/[0.14] transition-all duration-300"
          >
            View Work
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-14 flex items-center justify-center gap-6 text-sm text-white/30">
          <Link href="/blog" className="hover:text-white/60 transition-colors duration-200">Blog</Link>
          <span className="w-1 h-1 rounded-full bg-white/15"></span>
          <Link href="/about" className="hover:text-white/60 transition-colors duration-200">About</Link>
          <span className="w-1 h-1 rounded-full bg-white/15"></span>
          <Link href="/contact" className="hover:text-white/60 transition-colors duration-200">Contact</Link>
        </div>
      </div>
    </div>
  )
}
