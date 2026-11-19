import Link from 'next/link'
import { formatDate, getBlogPosts } from '@/app/(main)/blog/utils'

export function BlogPosts() {
  const allBlogs = getBlogPosts()

  return (
    <div className="row-list">
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
          <article key={post.slug} className="grid gap-1 py-6 md:grid-cols-12 md:gap-8">
            <time
              dateTime={post.metadata.publishedAt}
              className="text-sm tabular-nums text-muted md:col-span-3 md:pt-1"
            >
              {formatDate(post.metadata.publishedAt, false)}
            </time>
            <div className="md:col-span-9">
              <h2 className="title-md">
                <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                  {post.metadata.title}
                </Link>
              </h2>
              {post.metadata.summary && (
                <p className="body-muted mt-2 line-clamp-2 text-[0.9375rem]">{post.metadata.summary}</p>
              )}
            </div>
          </article>
        ))}
    </div>
  )
}
