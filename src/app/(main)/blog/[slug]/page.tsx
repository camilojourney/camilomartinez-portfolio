import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CustomMDX } from '@/components/features/blog/mdx'
import { formatDate, getBlogPosts } from '../utils'
import { baseUrl } from '@/lib/site'
import LiquidNav from '@/components/shared/liquid-nav'

interface BlogPost {
  slug: string;
  metadata: {
    title: string;
    publishedAt: string;
    summary?: string;
    image?: string;
  };
  content: string;
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function getReadingTime(content: string): number {
  const wordsPerMinute = 238
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export async function generateStaticParams() {
  const posts = getBlogPosts()
  return posts.map((post: BlogPost) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPosts().find((post: BlogPost) => post.slug === slug)
  if (!post) {
    return
  }

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata

  const ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Blog({ params }: PageProps) {
  const { slug } = await params
  const allPosts = getBlogPosts().sort((a, b) =>
    new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt) ? -1 : 1
  )
  const postIndex = allPosts.findIndex((post: BlogPost) => post.slug === slug)

  if (postIndex === -1) {
    notFound()
  }

  const post = allPosts[postIndex]!
  const prevPost = postIndex < allPosts.length - 1 ? allPosts[postIndex + 1] : null
  const nextPost = postIndex > 0 ? allPosts[postIndex - 1] : null
  const readingTime = getReadingTime(post.content)

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="blog" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050810]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-[#080d1c] to-[#050810]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[15%] left-[10%] w-[600px] h-[600px] bg-blue-600/[0.04] rounded-full blur-[160px]"></div>
          <div className="absolute top-[50%] right-[5%] w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px]"></div>
        </div>
      </div>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              '@type': 'Person',
              name: 'Juan Camilo Martinez',
            },
          }),
        }}
      />
      <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors duration-200 mb-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            All posts
          </Link>
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight mb-6">
              {post.metadata.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={post.metadata.publishedAt}>
                {formatDate(post.metadata.publishedAt)}
              </time>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{readingTime} min read</span>
            </div>
          </header>
          <article className="prose prose-invert prose-lg prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-cyan-400 prose-strong:text-white/90 prose-code:text-cyan-300 max-w-none">
            <CustomMDX source={post.content} />
          </article>
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prevPost ? (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.04]"
              >
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Previous</span>
                <p className="mt-2 text-foreground font-medium group-hover:text-foreground transition-colors">
                  {prevPost.metadata.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-right transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.04]"
              >
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Next</span>
                <p className="mt-2 text-foreground font-medium group-hover:text-foreground transition-colors">
                  {nextPost.metadata.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
