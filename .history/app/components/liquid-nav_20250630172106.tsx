'use client'

interface LiquidNavProps {
  currentPage?: 'home' | 'blog' | 'contact' | 'about'
}

export default function LiquidNav({ currentPage = 'home' }: LiquidNavProps) {
  return (
    <div className="fixed top-0 left-0 w-full z-50 p-6">
      <nav className="liquid-glass-nav backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-2xl px-8 py-4 max-w-md mx-auto shadow-2xl shadow-black/10">
        <div className="flex justify-center space-x-8">
          <a 
            href="/" 
            className={`nav-item transition-all duration-300 relative ${
              currentPage === 'home' ? 'text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            home
            <div className="nav-indicator"></div>
          </a>
          <a 
            href="/blog" 
            className={`nav-item transition-all duration-300 relative ${
              currentPage === 'blog' ? 'text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            blog
            <div className="nav-indicator"></div>
          </a>
          <a 
            href="/about" 
            className={`nav-item transition-all duration-300 relative ${
              currentPage === 'about' ? 'text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            about
            <div className="nav-indicator"></div>
          </a>
          <a 
            href="/contact" 
            className={`nav-item transition-all duration-300 relative ${
              currentPage === 'contact' ? 'text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            contact
            <div className="nav-indicator"></div>
          </a>
        </div>
      </nav>
    </div>
  )
}
