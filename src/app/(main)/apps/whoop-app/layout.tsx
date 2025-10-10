import LiquidNav from '@/components/shared/liquid-nav'

export default function FitnessDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LiquidNav currentPage="apps" />
      {children}
    </>
  )
}
