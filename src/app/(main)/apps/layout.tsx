import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apps',
  description: 'Live applications built by Juan Camilo Martinez — fitness dashboards, AI tools, trading bots, and more. Try them directly.',
}

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
