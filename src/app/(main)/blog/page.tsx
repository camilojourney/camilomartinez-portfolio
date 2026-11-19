import { Metadata } from 'next'
import { BlogPosts } from '@/components/features/blog/posts'
import PageShell from '@/components/shared/page-shell'
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
    <PageShell currentPage="blog" maxWidth="default">
      <header className="rise-in border-b border-line pb-10 md:pb-14">
        <h1 className="display">Blog</h1>
        <p className="lede mt-6">
          Thinking through <em>AI systems</em>, engineering practice, and the mental models behind them.
        </p>
      </header>
      <section className="pt-4 md:pt-6" aria-label="All posts">
        <BlogPosts />
      </section>
    </PageShell>
  )
}
