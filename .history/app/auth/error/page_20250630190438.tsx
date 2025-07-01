import LiquidPage from 'app/components/liquid-page'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <LiquidPage currentPage="about" backgroundVariant="purple">
      <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-12 max-w-4xl w-full shadow-2xl shadow-black/20">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 border border-red-400/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extralight text-white mb-4">
            Authentication Error
          </h1>
          
          <p className="text-white/70 mb-8 leading-relaxed">
            There was an issue connecting to your WHOOP account. This could be due to:
          </p>
          
          <ul className="text-white/60 text-left max-w-md mx-auto mb-8 space-y-2">
            <li>• Access was denied</li>
            <li>• Network connectivity issues</li>
            <li>• Temporary WHOOP API problems</li>
          </ul>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/live-data"
              className="liquid-glass-btn backdrop-blur-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white px-6 py-3 rounded-xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg inline-flex items-center justify-center gap-2"
            >
              Try Again
            </Link>
            
            <Link 
              href="/"
              className="liquid-glass-btn backdrop-blur-lg bg-white/[0.05] border border-white/[0.12] text-white/80 px-6 py-3 rounded-xl hover:bg-white/[0.08] hover:border-white/[0.16] hover:text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg inline-flex items-center justify-center gap-2"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </LiquidPage>
  )
}
