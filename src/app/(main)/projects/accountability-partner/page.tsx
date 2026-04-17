import Link from 'next/link'
import Image from 'next/image'
import StandardPage from '@/components/shared/standard-page'
import { Card } from '@/components/ui/Card'

export default function AccountabilityPartnerProject() {
  return (
    <StandardPage currentPage="projects" maxWidth="default">
      <div className="space-y-12">
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-4 py-2 text-amber-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            Live System
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Accountability Partner: Public Morning Workout Tracker
          </h1>
          <p className="text-lg md:text-xl text-white/70 leading-relaxed">
            A public commitment board tracking my daily morning workout challenge. Every workout, every morning, visible to everyone.
          </p>
        </header>

        <Card className="border-white/10 bg-white/[0.05] overflow-hidden">
          <div className="relative w-full h-64 md:h-80 bg-black">
            <Image
              src="/images/previews_main/accountable.png"
              alt="Morning workout accountability tracker preview"
              fill
              className="object-contain object-center md:scale-95 scale-95"
              priority
            />
          </div>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">The Challenge</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg">
            In October 2025, I made a commitment: work out before 8:30 AM every single day. But personal promises are easy to break in private. This project makes my commitment public—a digital accountability partner that tracks every workout time and displays them for everyone to see.
          </p>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Why Morning Workouts Matter</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg mb-4">
            "Win the morning, win the day" isn't just a cliché—it's a foundational principle for peak performance. Early morning exercise:
          </p>
          <ul className="list-disc list-inside space-y-3 text-white/70 text-base md:text-lg">
            <li><span className="text-white/90 font-medium">Sets the tone</span> for discipline and momentum throughout the day</li>
            <li><span className="text-white/90 font-medium">Eliminates excuses</span> before work, meetings, or fatigue can derail plans</li>
            <li><span className="text-white/90 font-medium">Builds consistency</span> through non-negotiable morning rituals</li>
            <li><span className="text-white/90 font-medium">Creates accountability</span> when tracked publicly</li>
          </ul>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Technical Implementation</h2>
          <ul className="list-disc list-inside space-y-4 text-white/70 text-base md:text-lg">
            <li><span className="text-white/90 font-medium">WHOOP API integration</span> automatically pulls workout start times</li>
            <li><span className="text-white/90 font-medium">Timezone normalization</span> converts UTC timestamps to New York time for accurate tracking</li>
            <li><span className="text-white/90 font-medium">Interactive visualization</span> displays workout times with color-coded success/failure markers</li>
            <li><span className="text-white/90 font-medium">Real-time updates</span> via ISR (Incremental Static Regeneration) every 6 hours</li>
            <li><span className="text-white/90 font-medium">Goal tracking</span> with clear visual indicators for before/after 8:30 AM threshold</li>
          </ul>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">The Power of Public Accountability</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg">
            Making this data public transforms a personal goal into a public commitment. The psychological impact is profound—knowing that my workout times are visible creates an additional layer of motivation beyond personal discipline. This isn't about perfection; it's about consistency, transparency, and building a system that makes it harder to break promises to myself.
          </p>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-amber-400/30 p-8 md:p-10 text-center space-y-4">
          <h3 className="text-2xl font-semibold text-white">Track my progress</h3>
          <p className="text-white/70">See how I'm doing with my morning workout commitment in real-time.</p>
          <Link
            href="/apps/accountability-partner"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-white font-medium transition-all duration-300 hover:scale-105 hover:border-amber-300/60 hover:text-amber-100"
          >
            View Live Tracker →
          </Link>
        </Card>
      </div>
    </StandardPage>
  )
}
