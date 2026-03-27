import { getBlogPosts } from '@/app/(main)/blog/utils'
import { baseUrl } from '@/lib/site'
import { projects } from '@/data/projects'

export default async function sitemap() {
  const blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  // Dynamic project case study pages from data
  const projectRoutes = projects
    .map((p) => p.caseStudyHref)
    .filter(Boolean)
    .map((href) => ({
      url: `${baseUrl}${href}`,
      lastModified: new Date().toISOString().split('T')[0],
    }))

  // Dynamic app pages from data
  const appRoutes = projects
    .filter((p) => p.appHref && !p.isExternalApp)
    .map((p) => p.appHref!)
    .filter((href) => href.startsWith('/'))
    .map((href) => ({
      url: `${baseUrl}${href}`,
      lastModified: new Date().toISOString().split('T')[0],
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
    '/apps/focus-time',
    '/apps/accountability-partner',
    '/apps/whoop-app',
    '/blog',
    '/bookshelf',
    '/contact',
    '/live-data',
    '/projects',
    '/tools',
    '/whoop-dashboard',
    '/privacy-policy',
    '/terms-of-service',
  ]

  const routes = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  // Deduplicate by URL
  const allRoutes = [...routes, ...projectRoutes, ...appRoutes, ...blogs]
  const seen = new Set<string>()
  return allRoutes.filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })
}
