import { getBlogPosts } from '@/app/(main)/blog/utils'
import { baseUrl } from '@/lib/site'

export default async function sitemap() {
  const blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  const staticRoutes = [
    '',
    '/about',
    '/apps',
    '/apps/fitness-dashboard',
    '/apps/astoria-conquest',
    '/apps/social-media-pipeline',
    '/apps/trading-bot',
    '/apps/think-clear',
    '/blog',
    '/bookshelf',
    '/contact',
    '/live-data',
    '/projects',
    '/projects/fitness-dashboard',
    '/projects/astoria-conquest',
    '/projects/social-media-pipeline',
    '/projects/ai-advisor-board',
    '/projects/rag-system',
    '/projects/trading-bot',
    '/tools',
    '/whoop-dashboard',
    '/privacy-policy',
    '/terms-of-service',
  ]

  const routes = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
