import ProjectsShowcase from '@/components/projects/ProjectsShowcase'
import DirectionA from '@/components/directions/DirectionA'
import DirectionB from '@/components/directions/DirectionB'
import DirectionC from '@/components/directions/DirectionC'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'Portfolio of Juan Camilo Martinez - Applied AI Engineer in NYC. Audio/speech ML pipelines from 46 research papers, multi-agent systems, and production infrastructure.',
}

// Temporary: `?direction=a|b|c` previews the redesign directions (phase 1).
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string }>
}) {
  const { direction } = await searchParams
  if (direction === 'a') return <DirectionA />
  if (direction === 'b') return <DirectionB />
  if (direction === 'c') return <DirectionC />
  return <ProjectsShowcase currentPage="projects" />
}
