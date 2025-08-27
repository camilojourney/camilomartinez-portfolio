import { BlogPosts } from '@/components/features/blog/posts'
import LiquidPage from '@/components/shared/liquid-page'

export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}

export default function Page() {
  return (
    <LiquidPage currentPage="blog" backgroundVariant="warm">
      <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-12 max-w-4xl w-full shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extralight text-white mb-6 drop-shadow-lg">
            Latest Thoughts
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mx-auto mb-8"></div>
          <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto font-light">
            Insights, experiences, and thoughts on data analytics, AI development, and the intersection of technology and creativity.
          </p>
        </div>

        {/* Blog Posts */}
        <div className="liquid-glass-blog backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
          <BlogPosts />
        </div>
      </section>
    </LiquidPage>
  )
}
