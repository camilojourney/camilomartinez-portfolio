import ProjectsShowcase from '@/components/projects/ProjectsShowcase'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'Portfolio of Juan Camilo Martinez — Applied AI Engineer in NYC. Audio/speech ML pipelines from 46 research papers, multi-agent systems, and production infrastructure.',
}

export default function Home() {
  return <ProjectsShowcase currentPage="projects" />
}
