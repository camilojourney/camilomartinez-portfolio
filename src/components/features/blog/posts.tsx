import Link from 'next/link'
import { formatDate, getBlogPosts } from '@/app/(main)/blog/utils'

function getReadingTime(content: string): number {
  const wordsPerMinute = 238
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

// Deterministic gradient based on slug
const gradients = [
  'from-cyan-500/20 via-blue-600/20 to-indigo-700/20',
  'from-blue-500/20 via-indigo-600/20 to-purple-700/20',
  'from-indigo-500/20 via-purple-600/20 to-pink-700/20',
  'from-teal-500/20 via-cyan-600/20 to-blue-700/20',
  'from-sky-500/20 via-blue-600/20 to-cyan-700/20',
]

function getGradient(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export function BlogPosts() {
  const allBlogs = getBlogPosts()

  return (
    <div className="space-y-6">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1
          }
          return 1
        })
        .map((post) => {
          const readingTime = getReadingTime(post.content)
          const gradient = getGradient(post.slug)

          return (
            <Link
              key={post.slug}
              className="group block rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.04] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]"
              href={`/blog/${post.slug}`}
            >
              {/* Gradient header strip */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

              <div className="p-6 md:p-8">
                {/* Meta row */}
                <div className="flex items-center gap-3 text-sm text-white/40 mb-3">
                  <time dateTime={post.metadata.publishedAt}>
                    {formatDate(post.metadata.publishedAt, false)}
                  </time>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{readingTime} min read</span>
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-semibold text-white/90 tracking-tight mb-3 group-hover:text-white transition-colors duration-200">
                  {post.metadata.title}
                </h2>

                {/* Excerpt */}
                {post.metadata.summary && (
                  <p className="text-white/50 leading-relaxed line-clamp-2 group-hover:text-white/60 transition-colors duration-200">
                    {post.metadata.summary}
                  </p>
                )}

                {/* Read more indicator */}
                <div className="mt-4 flex items-center gap-2 text-cyan-400/60 text-sm font-medium group-hover:text-cyan-400 transition-colors duration-200">
                  <span>Read article</span>
                  <svg
                    className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}
    </div>
  )
}
