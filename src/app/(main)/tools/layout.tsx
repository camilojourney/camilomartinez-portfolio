import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resources & Tools',
  description: 'Curated learning resources, productivity templates, and frameworks from Juan Camilo Martinez. Systems, books, and proven workflows.',
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
