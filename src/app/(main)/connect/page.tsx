import type { Metadata } from 'next'
import { ArrowUpRight, Instagram, Linkedin } from 'lucide-react'
import { baseUrl } from '@/lib/site'

const profileLinks = [
  {
    label: 'Connect on LinkedIn',
    handle: 'camilomartinez-ai',
    href: 'https://www.linkedin.com/in/camilomartinez-ai/',
    Icon: Linkedin,
    accent: 'bg-white text-slate-950 border-white hover:bg-cyan-50',
    iconStyle: 'bg-[#0a66c2] text-white',
    arrowStyle: 'text-slate-500 group-hover:text-slate-950',
  },
  {
    label: 'Follow on Instagram',
    handle: 'camiloexperience',
    href: 'https://www.instagram.com/camiloexperience/',
    Icon: Instagram,
    accent: 'bg-white/[0.08] text-white border-white/14 hover:bg-white/[0.12]',
    iconStyle: 'bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white',
    arrowStyle: 'text-white/55 group-hover:text-white',
  },
]

export const metadata: Metadata = {
  title: 'Connect',
  description:
    'Connect with Juan Camilo Martinez on LinkedIn and Instagram.',
  alternates: {
    canonical: `${baseUrl}/connect`,
  },
  openGraph: {
    title: 'Connect | Juan Camilo Martinez',
    description:
      'Applied AI engineer building workflow systems, agent orchestration, and evaluation-driven AI products.',
    url: `${baseUrl}/connect`,
    images: [{ url: `${baseUrl}/og?title=${encodeURIComponent('Connect with Camilo')}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect | Juan Camilo Martinez',
    description:
      'Applied AI engineer building workflow systems, agent orchestration, and evaluation-driven AI products.',
  },
}

export default function ConnectPage() {
  return (
    <div data-connect-page className="relative min-h-screen overflow-hidden">
      <style>{`
        body:has([data-connect-page]) footer,
        body:has([data-connect-page]) [data-chat-widget] {
          display: none !important;
        }
      `}</style>

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_82%_84%,rgba(236,72,153,0.14),transparent_34%),linear-gradient(135deg,#030712_0%,#0f172a_48%,#020617_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
      </div>

      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-start px-5 pb-8 pt-24 md:px-6">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] text-lg font-semibold text-white shadow-2xl shadow-black/25">
            CM
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Quick connect
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Camilo Martinez
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/62">
            Applied AI engineer building workflow systems, agents, and evaluation-driven products.
          </p>
        </div>

        <div className="space-y-3" aria-label="Social links">
          {profileLinks.map(({ label, handle, href, Icon, accent, iconStyle, arrowStyle }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center justify-between rounded-[1.35rem] border px-5 py-5 shadow-2xl shadow-black/22 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 ${accent}`}
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-lg font-semibold leading-tight">{label}</span>
                  <span className="mt-1 block truncate text-sm opacity-62">@{handle}</span>
                </span>
              </span>
              <ArrowUpRight
                className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${arrowStyle}`}
                aria-hidden="true"
              />
            </a>
          ))}
        </div>

        <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.18em] text-white/38">
          NYC | Applied AI | Business Analytics
        </p>
      </section>
    </div>
  )
}
