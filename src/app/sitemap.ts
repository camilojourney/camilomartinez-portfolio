import { getBlogPosts } from 'app/blog/utils'

export const baseUrl = 'https://camilomartinez.co'

export default async function sitemap() {
  let blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }))

  let routes = [
    '',
    '/about',
    '/blog', 
    '/contact',
    '/live-data',
    '/my-stats',
    '/projects',
    '/tools',
    '/whoop-dashboard',
    '/privacy-policy', 
    '/terms-of-service'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
