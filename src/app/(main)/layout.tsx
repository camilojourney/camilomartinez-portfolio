/**
 * Route group layout for (main) pages.
 * Adds smooth route-transition animation on every page change.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="route-transition min-h-dvh pl-[max(0px,env(safe-area-inset-left,0px))] pr-[max(0px,env(safe-area-inset-right,0px))]"
    >
      {children}
    </div>
  )
}
