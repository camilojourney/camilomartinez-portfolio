import { BlogPosts } from 'app/components/posts'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* AI Visionary Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-cyan-900"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navigation overlay */}
      <div className="absolute top-0 left-0 w-full z-50 p-8">
        <nav className="flex space-x-6">
          <a href="/" className="text-white hover:text-cyan-400 transition-colors">home</a>
          <a href="/blog" className="text-white hover:text-cyan-400 transition-colors">blog</a>
          <a href="/contact" className="text-white hover:text-cyan-400 transition-colors">contact</a>
        </nav>
      </div>

      <div className="relative z-10 h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-8">
          <section className="backdrop-blur-sm bg-black/20 p-8 rounded-2xl border border-white/10 max-w-4xl w-full">
            <h1 className="mb-2 text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Camilo Martinez
            </h1>
            <h2 className="mb-8 text-xl text-cyan-300 font-semibold">
              Data Analyst & AI Developer Specializing in NLP
            </h2>
            <p className="mb-4 text-gray-200 leading-relaxed">
              I build intelligent applications that understand and generate language. With a Master's degree in Data Analytics and a passion for NLP, I develop solutions that range from automated content creation to personalized AI coaching.
            </p>
            <p className="mb-8 text-gray-200 leading-relaxed">
              My philosophy is simple: data, used correctly, empowers us to achieve more. I build efficient, data-driven workflows that unleash the full capabilities of people and companies.
            </p>

            {/* Powerful CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-start gap-4 mb-10">
              <Link
                href="/projects"
                className="group bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold py-3 px-8 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
              >
                <span className="flex items-center gap-2">
                  View My Work
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/contact"
                className="border border-cyan-400/50 text-cyan-300 font-bold py-3 px-8 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-200 transition-all transform hover:scale-105 backdrop-blur-sm"
              >
                Get In Touch
              </Link>
            </div>

            {/* Featured Projects Section */}
            <div className="my-16">
              <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Featured Work</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Project Card 1 */}
                <div className="group bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-2">Interactive 'About Me' Chatbot</h3>
                    <p className="text-gray-300">A live demo of a full-stack application built with Next.js and NLP to create an engaging, interactive user experience.</p>
                  </div>
                  <Link href="/about" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
                    View Project
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Project Card 2 */}
                <div className="group bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-cyan-300 mb-2">AI Content Creator</h3>
                    <p className="text-gray-300">A conceptual application using advanced NLP models to help marketers and writers accelerate their creative workflow.</p>
                    <span className="inline-block mt-2 px-3 py-1 text-xs bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 rounded-full border border-cyan-400/30">In Progress</span>
                  </div>
                  <Link href="/projects/ai-content-creator" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
                    View Project
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Blog Posts Section */}
            <div className="my-8">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Latest Thoughts</h2>
              <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
                <BlogPosts />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
