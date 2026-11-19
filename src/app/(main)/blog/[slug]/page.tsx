import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CustomMDX } from '@/components/features/blog/mdx'
import { formatDate, getBlogPosts } from '../utils'
import { baseUrl } from '@/lib/site'
import PageShell from '@/components/shared/page-shell'

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
    <PageShell currentPage="blog" maxWidth="narrow">
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
      <Link href="/blog" className="link-quiet mobile-link-target inline-flex items-center gap-2 text-sm">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        All posts
      </Link>
      <header className="rise-in mb-10 mt-6 border-b border-line pb-8">
        <h1 className="display text-[clamp(2.25rem,5vw,3.75rem)]">{post.metadata.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span>{readingTime} min read</span>
        </div>
      </header>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
      <nav className="mt-16 grid gap-4 border-t border-line pt-8 md:grid-cols-2" aria-label="Adjacent posts">
        {prevPost ? (
          <Link href={`/blog/${prevPost.slug}`} className="panel group p-5 transition-colors hover:border-ink">
            <span className="text-xs uppercase tracking-wide text-muted">Previous</span>
            <p className="mt-2 font-medium text-ink group-hover:text-accent">{prevPost.metadata.title}</p>
          </Link>
        ) : (
          <div />
        )}
        {nextPost ? (
          <Link href={`/blog/${nextPost.slug}`} className="panel group p-5 text-right transition-colors hover:border-ink">
            <span className="text-xs uppercase tracking-wide text-muted">Next</span>
            <p className="mt-2 font-medium text-ink group-hover:text-accent">{nextPost.metadata.title}</p>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </PageShell>
  )
}
