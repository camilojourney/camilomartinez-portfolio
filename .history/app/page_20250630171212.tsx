import { BlogPosts } from 'app/components/posts'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Liquid Glass Background - Enhanced with Apple 2025 principles */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950"></div>
      
      {/* Concentric harmony layers */}
      <div className="absolute inset-0">
        {/* Primary orb - larger, more subtle */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-blue-500/15 via-cyan-500/8 to-transparent rounded-full blur-3xl animate-liquid-float"></div>
        {/* Secondary orb - concentric positioning */}
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-gradient-radial from-indigo-400/12 via-purple-500/6 to-transparent rounded-full blur-2xl animate-liquid-float animation-delay-3000"></div>
        {/* Tertiary orb - creating depth */}
        <div className="absolute bottom-1/4 left-1/2 w-[300px] h-[300px] bg-gradient-radial from-cyan-400/10 via-blue-500/5 to-transparent rounded-full blur-xl animate-liquid-float animation-delay-6000"></div>
      </div>

      {/* Enhanced navigation with liquid glass */}
      <div className="absolute top-0 left-0 w-full z-50 p-6">
        <nav className="liquid-glass-nav backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-2xl px-8 py-4 max-w-md mx-auto">
          <div className="flex justify-center space-x-8">
            <a href="/" className="nav-item text-white/90 hover:text-white transition-all duration-300 relative">
              home
              <div className="nav-indicator"></div>
            </a>
            <a href="/blog" className="nav-item text-white/70 hover:text-white transition-all duration-300 relative">
              blog
              <div className="nav-indicator"></div>
            </a>
            <a href="/contact" className="nav-item text-white/70 hover:text-white transition-all duration-300 relative">
              contact
              <div className="nav-indicator"></div>
            </a>
          </div>
        </nav>
      </div>

      <div className="relative z-10 h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-8 pt-20">
          {/* Main content card with enhanced liquid glass effect */}
          <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-10 max-w-4xl w-full shadow-2xl shadow-black/20">
            {/* Elevated hierarchy with concentric design */}
            <div className="text-center mb-10">
              <h1 className="mb-3 text-4xl md:text-6xl font-extralight tracking-tight text-white drop-shadow-lg">
                Camilo Martinez
              </h1>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mx-auto mb-5"></div>
              <h2 className="text-lg md:text-xl text-cyan-300/90 font-light tracking-wide">
                Data Analyst & AI Developer Specializing in NLP
              </h2>
            </div>

            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="mb-5 text-base md:text-lg text-white/80 leading-relaxed font-light">
                I build intelligent applications that understand and generate language. With a Master's degree in Data Analytics and a passion for NLP, I develop solutions that range from automated content creation to personalized AI coaching.
              </p>
              <p className="mb-6 text-base md:text-lg text-white/70 leading-relaxed font-light">
                My philosophy is simple: data, used correctly, empowers us to achieve more. I build efficient, data-driven workflows that unleash the full capabilities of people and companies.
              </p>
            </div>

            {/* Enhanced CTA Buttons with liquid glass styling */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-20">
              <Link
                href="/projects"
                className="group liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white font-medium py-4 px-10 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
              >
                <span className="flex items-center justify-center gap-3 text-lg">
                  View My Work
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/contact"
                className="group liquid-glass-secondary backdrop-blur-xl bg-white/[0.04] border border-white/[0.15] text-white/90 font-medium py-4 px-10 rounded-2xl hover:bg-white/[0.08] hover:border-white/[0.25] hover:text-white transition-all duration-300 transform hover:scale-[1.02]"
              >
                <span className="text-lg">Get In Touch</span>
              </Link>
            </div>

            {/* Featured Projects Section with concentric design */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Featured Work</h2>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Project Card 1 - Enhanced liquid glass */}
                <div className="group liquid-glass-project backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10">
                  <div className="flex items-start gap-6">
                    <div className="liquid-glass-icon backdrop-blur-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-300/20 rounded-2xl p-4 group-hover:from-cyan-400/30 group-hover:to-blue-500/30 transition-all duration-300">
                      <svg className="w-8 h-8 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">Interactive 'About Me' Chatbot</h3>
                      <p className="text-white/70 mb-6 leading-relaxed">A live demo of a full-stack application built with Next.js and NLP to create an engaging, interactive user experience.</p>
                      <Link href="/about" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group/link">
                        <span className="font-medium">View Project</span>
                        <svg className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Project Card 2 - Enhanced liquid glass */}
                <div className="group liquid-glass-project backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
                  <div className="flex items-start gap-6">
                    <div className="liquid-glass-icon backdrop-blur-lg bg-gradient-to-br from-purple-400/20 to-indigo-500/20 border border-purple-300/20 rounded-2xl p-4 group-hover:from-purple-400/30 group-hover:to-indigo-500/30 transition-all duration-300">
                      <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">AI Content Creator</h3>
                      <p className="text-white/70 mb-4 leading-relaxed">A conceptual application using advanced NLP models to help marketers and writers accelerate their creative workflow.</p>
                      <span className="inline-block mb-4 px-4 py-1.5 text-sm backdrop-blur-lg bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 rounded-full border border-cyan-400/20">In Progress</span>
                      <div className="mt-4">
                        <Link href="/projects/ai-content-creator" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group/link">
                          <span className="font-medium">View Project</span>
                          <svg className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Blog Posts Section with liquid glass styling */}
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Latest Thoughts</h2>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent mx-auto mb-12"></div>
              <div className="liquid-glass-blog backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                <BlogPosts />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
