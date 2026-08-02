import { getBlogPosts } from '@/app/(main)/blog/utils'
import { projects } from '@/data/projects'
import { baseUrl } from '@/lib/site'

export default async function sitemap() {
  const blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  const projectRoutes = projects.map((p) => ({
    url: p.caseStudyHref.startsWith('http') ? p.caseStudyHref : `${baseUrl}${p.caseStudyHref}`,
    lastModified: new Date().toISOString().split('T')[0],
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
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...staticRoutes, ...projectRoutes, ...blogs]
}
