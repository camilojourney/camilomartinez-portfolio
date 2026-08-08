import { getBlogPosts } from '@/app/(main)/blog/utils'
import { projects } from '@/data/projects'
import { baseUrl } from '@/lib/site'

export default async function sitemap() {
  const blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  const today = new Date().toISOString().split('T')[0]

  const projectRoutes = projects
    .filter((p) => !p.caseStudyHref.startsWith('http'))
    .map((p) => ({
      url: `${baseUrl}${p.caseStudyHref}`,
      lastModified: today,
    }))

  const staticRoutes = [
    '',
    '/about',
    '/blog',
    '/bookshelf',
    '/connect',
    '/contact',
    '/live-data',
    '/projects',
    '/tools',
    '/privacy-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: today,
  }))

  return [...staticRoutes, ...projectRoutes, ...blogs]
}
