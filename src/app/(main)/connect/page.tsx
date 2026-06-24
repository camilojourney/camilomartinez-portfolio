import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowDownToLine, ArrowUpRight, ContactRound, Instagram, Linkedin } from 'lucide-react'
import { baseUrl } from '@/lib/site'

const profileLinks = [
  {
    label: 'Add to Contacts',
    handle: 'iPhone contact card',
    href: '/juan-camilo-martinez-contact.vcf',
    Icon: ContactRound,
    accent: 'bg-cyan-300 text-slate-950 border-cyan-200 hover:bg-cyan-200',
    iconStyle: 'bg-slate-950 text-cyan-200',
    arrowStyle: 'text-slate-500 group-hover:text-slate-950',
    download: true,
  },
  {
    label: 'Connect on LinkedIn',
    handle: 'camilomartinez-ai',
    href: 'https://www.linkedin.com/in/camilomartinez-ai/',
    Icon: Linkedin,
    accent: 'bg-white text-slate-950 border-white hover:bg-cyan-50',
    iconStyle: 'bg-[#0a66c2] text-white',
    arrowStyle: 'text-slate-500 group-hover:text-slate-950',
    download: false,
    showAtPrefix: true,
  },
  {
    label: 'Follow on Instagram',
    handle: 'camiloexperience',
    href: 'https://www.instagram.com/camiloexperience/',
    Icon: Instagram,
    accent: 'bg-white/[0.08] text-white border-white/14 hover:bg-white/[0.12]',
    iconStyle: 'bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white',
    arrowStyle: 'text-white/55 group-hover:text-white',
    download: false,
    showAtPrefix: true,
  },
]

const networkPaths = [
  'M10 24 C26 12 42 20 56 34 S82 48 92 22',
  'M8 62 C24 46 38 74 54 58 S80 38 94 70',
  'M17 88 C28 66 44 82 58 70 S78 58 88 86',
  'M21 16 C28 38 42 42 52 52 S72 70 80 40',
]

const networkNodes = [
  { cx: 10, cy: 24, r: 1.45, delay: '0s' },
  { cx: 26, cy: 18, r: 1.05, delay: '0.9s' },
  { cx: 56, cy: 34, r: 1.7, delay: '1.7s' },
  { cx: 92, cy: 22, r: 1.25, delay: '0.3s' },
  { cx: 8, cy: 62, r: 1.25, delay: '1.1s' },
  { cx: 54, cy: 58, r: 1.9, delay: '0.5s' },
  { cx: 94, cy: 70, r: 1.1, delay: '1.4s' },
  { cx: 17, cy: 88, r: 1.35, delay: '0.2s' },
  { cx: 58, cy: 70, r: 1.2, delay: '1.9s' },
  { cx: 88, cy: 86, r: 1.55, delay: '0.8s' },
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

        @keyframes network-dash {
          to { stroke-dashoffset: -48; }
        }

        @keyframes node-breathe {
          0%, 100% { opacity: 0.58; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.26); }
        }

        @keyframes field-tilt {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -10px, 0) rotate(0.45deg); }
        }

        [data-network-field] {
          animation: field-tilt 12s ease-in-out infinite;
          transform-origin: 50% 50%;
        }

        [data-network-path] {
          stroke-dasharray: 10 14;
          animation: network-dash 5.8s linear infinite;
        }

        [data-network-node] {
          animation: node-breathe 3.6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        @media (prefers-reduced-motion: reduce) {
          [data-network-field],
          [data-network-path],
          [data-network-node] {
            animation: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_82%_84%,rgba(236,72,153,0.14),transparent_34%),linear-gradient(135deg,#030712_0%,#0f172a_48%,#020617_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-90"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-[115vh] w-[115vw] -translate-x-1/2 -translate-y-1/2">
          <svg
            data-network-field
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
          <defs>
            <linearGradient id="networkStroke" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.85" />
              <stop offset="48%" stopColor="rgb(255 255 255)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="rgb(236 72 153)" stopOpacity="0.7" />
            </linearGradient>
            <filter id="networkGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {networkPaths.map((path, index) => (
            <path
              key={path}
              data-network-path
              d={path}
              fill="none"
              stroke="url(#networkStroke)"
              strokeWidth="0.22"
              strokeLinecap="round"
              style={{ animationDelay: `${index * -1.2}s` }}
            />
          ))}

          {networkPaths.map((path, index) => (
            <circle key={`${path}-pulse`} r="0.62" fill="rgb(255 255 255)" filter="url(#networkGlow)" opacity="0.9">
              <animateMotion dur={`${5.2 + index * 0.7}s`} begin={`${index * 0.8}s`} repeatCount="indefinite" path={path} />
            </circle>
          ))}

          {networkNodes.map((node) => (
            <g key={`${node.cx}-${node.cy}`} filter="url(#networkGlow)">
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r + 2.1}
                fill="rgb(34 211 238)"
                opacity="0.06"
              />
              <circle
                data-network-node
                cx={node.cx}
                cy={node.cy}
                r={node.r}
                fill="rgb(255 255 255)"
                opacity="0.78"
                style={{ animationDelay: node.delay }}
              />
            </g>
          ))}
          </svg>
        </div>
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-start px-5 pb-8 pt-24 md:px-6">
        <div className="mb-7 text-center">
          <Image
            src="/vcard/juan-camilo-contact.jpg"
            alt="Camilo Martinez"
            width={80}
            height={80}
            priority
            className="mx-auto mb-5 h-20 w-20 rounded-[1.35rem] border border-white/12 bg-white/[0.06] object-cover shadow-2xl shadow-black/25"
          />
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

        <div className="space-y-3" aria-label="Quick contact links">
          {profileLinks.map(({ label, handle, href, Icon, accent, iconStyle, arrowStyle, download, showAtPrefix }) => {
            const ActionIcon = download ? ArrowDownToLine : ArrowUpRight

            return (
            <a
              key={label}
              href={href}
              target={download ? undefined : '_blank'}
              rel={download ? undefined : 'noopener noreferrer'}
              download={download ? 'juan-camilo-martinez-contact.vcf' : undefined}
              className={`group flex items-center justify-between rounded-[1.35rem] border px-5 py-5 shadow-2xl shadow-black/22 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 ${accent}`}
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-lg font-semibold leading-tight">{label}</span>
                  <span className="mt-1 block truncate text-sm opacity-62">{showAtPrefix ? '@' : ''}{handle}</span>
                </span>
              </span>
              <ActionIcon
                className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${arrowStyle}`}
                aria-hidden="true"
              />
            </a>
            )
          })}
        </div>

        <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.18em] text-white/38">
          NYC | Applied AI | Business Analytics
        </p>
      </section>
    </div>
  )
}
