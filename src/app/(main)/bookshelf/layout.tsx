import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bookshelf',
  description: 'Books that shaped how Juan Camilo Martinez thinks about AI, systems, strategy, and craft. Curated recommendations with personal notes.',
}

export default function BookshelfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
