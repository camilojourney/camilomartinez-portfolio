import Link from 'next/link'
import { formatDate, getBlogPosts } from '@/app/(main)/blog/utils'

export function BlogPosts() {
  const allBlogs = getBlogPosts()

  return (
    <div className="space-y-4">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1
          }
          return 1
        })
        .map((post) => (
          <Link
            key={post.slug}
            className="group block rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/[0.05]"
            href={`/blog/${post.slug}`}
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground font-medium tabular-nums">
                {formatDate(post.metadata.publishedAt, false)}
              </p>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-cyan-300 transition-colors duration-200">
                {post.metadata.title}
              </h3>
              {post.metadata.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {post.metadata.summary}
                </p>
              )}
            </div>
          </Link>
        ))}
    </div>
  )
}
