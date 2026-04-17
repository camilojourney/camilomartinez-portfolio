import { Metadata } from 'next'
import { BlogPosts } from '@/components/features/blog/posts'
import LiquidNav from '@/components/shared/liquid-nav'
import { baseUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical writing on AI systems, speech ML, multi-agent architecture, and engineering practice by Juan Camilo Martinez.',
  openGraph: {
    title: 'Blog | Juan Camilo Martinez',
    description: 'Technical writing on AI systems, speech ML, multi-agent architecture, and engineering practice.',
    url: `${baseUrl}/blog`,
    type: 'website',
    images: [{ url: `${baseUrl}/og?title=${encodeURIComponent('Technical Blog')}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Juan Camilo Martinez',
    description: 'Technical writing on AI systems, speech ML, multi-agent architecture, and engineering practice.',
  },
  alternates: {
    types: {
      'application/rss+xml': `${baseUrl}/rss`,
    },
  },
}

export default function Page() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="blog" />
      {/* Background - brand consistent */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050810]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-[#080d1c] to-[#050810]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[15%] left-[10%] w-[600px] h-[600px] bg-blue-600/[0.04] rounded-full blur-[160px]"></div>
          <div className="absolute top-[50%] right-[5%] w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px]"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="hero-stagger hero-stagger-1 text-sm font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Technical writing
            </p>
            <h1 className="hero-stagger hero-stagger-2 text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
              Blog
            </h1>
            <p className="hero-stagger hero-stagger-3 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Thinking through <span className="text-cyan-400 font-medium">AI systems</span>, <span className="text-blue-400 font-medium">engineering practice</span>, and the mental models behind them.
            </p>
          </div>

          {/* Blog Posts */}
          <div className="hero-stagger hero-stagger-4 space-y-4">
            <BlogPosts />
          </div>
        </div>
      </div>
    </div>
  )
}
