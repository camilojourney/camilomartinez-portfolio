/**
 * Route group layout for (main) pages.
 * Adds smooth route-transition animation on every page change.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="route-transition">{children}</div>
}
