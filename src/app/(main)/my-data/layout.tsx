import LiquidNav from '@/components/shared/liquid-nav'

export default function MyDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LiquidNav currentPage="my-data" />
      {children}
    </>
  )
}
