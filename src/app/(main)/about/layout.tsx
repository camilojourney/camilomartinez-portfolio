import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'The story of Juan Camilo Martinez — from petroleum engineering in Colombia to Applied AI Engineer in NYC. Audio/speech ML, multi-agent systems, and relentless building.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
