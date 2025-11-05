import type { Metadata } from 'next'
import { baseUrl } from '@/app/sitemap'
import ProjectsShowcase from '@/components/projects/ProjectsShowcase'

export const metadata: Metadata = {
  title: 'Camilo Martinez | AI Engineer - Live Projects & Portfolio',
  description: 'Explore live AI projects: Real-time fitness analytics, geospatial routing, multi-agent advisors, self-improving chatbots, social media automation, and privacy-first speech coaching.',
  keywords: [
    'AI engineer portfolio',
    'machine learning projects',
    'data engineering',
    'full-stack developer',
    'speech AI',
    'LLM systems',
    'geospatial routing',
    'fitness analytics',
  ],
  openGraph: {
    title: 'Camilo Martinez | AI Engineer - Live Projects',
    description: 'AI Engineer portfolio with live applications in ML, data pipelines, and full-stack development.',
    url: `${baseUrl}/projects`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Camilo Martinez Portfolio',
      },
    ],
  },
  alternates: {
    canonical: `${baseUrl}/projects`,
  },
}

export default function Home() {
  return <ProjectsShowcase currentPage="projects" />
}
