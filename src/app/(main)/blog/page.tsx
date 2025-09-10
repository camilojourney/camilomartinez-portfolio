import { BlogPosts } from '@/components/features/blog/posts'
import LiquidNav from '@/components/shared/liquid-nav'

export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}

export default function Page() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="blog" />
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
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500">
            <div className="p-8 md:p-12">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
                  Latest Thoughts
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                  Insights, experiences, and thoughts on <span className="text-cyan-400 font-semibold">data analytics</span>, <span className="text-blue-400 font-semibold">AI development</span>, and the intersection of technology and creativity.
                </p>
              </div>

              {/* Blog Posts */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                <BlogPosts />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
