import type { Metadata } from 'next'
import ProjectsShowcase from '@/components/projects/ProjectsShowcase'

export const metadata: Metadata = {
  title: 'Projects | Camilo Martinez',
  description: 'Live applications and prototypes showcasing data engineering and AI systems.',
}

export default function ProjectsPage() {
  return <ProjectsShowcase currentPage="projects" />
}
