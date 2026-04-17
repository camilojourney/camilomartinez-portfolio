import Link from 'next/link'
import Image from 'next/image'
import StandardPage from '@/components/shared/standard-page'
import { Card } from '@/components/ui/Card'

export default function FocusTimeProject() {
  return (
    <StandardPage currentPage="projects" maxWidth="default">
      <div className="space-y-12">
          <header className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-emerald-200 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Live App
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Focus Time: Hyperfocus Awareness for Deep Work
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              A macOS menu bar timer that helps people with ADHD maintain awareness during hyperfocus sessions through periodic check-ins, session reviews, and calendar integration.
            </p>
          </header>

          <Card className="border-white/10 bg-white/[0.05] overflow-hidden">
            <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
              <Image
                src="/images/previews_main/Hyper-awareness.png"
                alt="Focus Time menu bar app preview"
                fill
                className="object-contain object-center md:scale-95 scale-95"
                priority
              />
            </div>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Why I Built This</h2>
            <div className="space-y-4 text-white/70 leading-relaxed text-base md:text-lg">
              <p>
                As someone with ADHD, I experience hyperfocus—those deep work sessions where hours disappear. While this superpower drives incredible productivity, it comes with a cost: forgotten meetings, skipped meals, and losing track of time entirely.
              </p>
              <p>
                Existing timers and Pomodoro apps weren't built for this. They assume you want to <em>stop</em> working, but hyperfocus doesn't work that way. What I needed was <span className="text-white/90 font-medium">gentle awareness</span>—periodic check-ins that keep me grounded without breaking flow.
              </p>
              <p>
                Focus Time sits quietly in your menu bar, asking "What are you working on?" every 15 minutes. It's not about interrupting deep work—it's about creating accountability touchpoints that help you stay intentional about where your hyperfocus energy goes.
              </p>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Technical Architecture</h2>
            <p className="text-white/60 text-sm mb-6">
              Built for privacy and performance—all data stays local, no network calls, no tracking.
            </p>
            <ul className="list-disc list-inside space-y-4 text-white/70 text-base md:text-lg">
              <li>
                <span className="text-white/90 font-medium">Tauri 2.x</span> — Rust + JavaScript hybrid framework for native macOS menu bar apps with minimal memory footprint
              </li>
              <li>
                <span className="text-white/90 font-medium">Rust backend</span> — System tray integration, macOS Calendar API (EventKit) access, and JSONL logging with zero network dependencies
              </li>
              <li>
                <span className="text-white/90 font-medium">Vanilla JavaScript frontend</span> — Lightweight, framework-free UI with smooth animations and keyboard shortcuts
              </li>
              <li>
                <span className="text-white/90 font-medium">Local-first storage</span> — All focus session data stored in JSONL format in Tauri's sandboxed app directory
              </li>
              <li>
                <span className="text-white/90 font-medium">Native macOS APIs</span> — Direct EventKit integration pulls current calendar meeting as suggested focus goal
              </li>
            </ul>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-cyan-300">🧠 Periodic Check-Ins</h3>
                <p className="text-white/70 text-base">
                  Gentle prompts every 15 minutes asking "What are you doing now?" to maintain awareness without breaking flow.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-purple-300">📊 Session Review</h3>
                <p className="text-white/70 text-base">
                  Timeline view shows all check-ins for a session, revealing your focus patterns and task-switching behavior.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-blue-300">📅 Calendar Integration</h3>
                <p className="text-white/70 text-base">
                  Automatically suggests your current calendar meeting as a focus goal—no manual goal-setting required.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-emerald-300">🔒 Privacy-First</h3>
                <p className="text-white/70 text-base">
                  All data stays on your machine. No cloud sync, no analytics, no network calls. Your focus patterns are yours alone.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Technical Challenges Solved</h2>
            <div className="space-y-4 text-white/70 leading-relaxed text-base md:text-lg">
              <p>
                <span className="text-white/90 font-medium">Tauri 2 Window Focus Issues:</span> Navigated the trade-off between <code className="text-cyan-300 bg-black/30 px-2 py-1 rounded">skipTaskbar</code> (no Dock icon) and window interactivity. Implemented <code className="text-cyan-300 bg-black/30 px-2 py-1 rounded">ActivationPolicy::Regular</code> to ensure buttons and text inputs work reliably.
              </p>
              <p>
                <span className="text-white/90 font-medium">macOS Calendar API Integration:</span> Bridged Rust with Objective-C EventKit APIs to fetch current calendar events, handling permission prompts and error states gracefully.
              </p>
              <p>
                <span className="text-white/90 font-medium">JSONL Logging for Session Data:</span> Designed append-only log format for focus check-ins that supports efficient reads, search, and future analytics without a database.
              </p>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Tech Stack</h2>
            <div className="flex flex-wrap gap-3">
              {['Tauri 2', 'Rust', 'Vanilla JS', 'macOS EventKit', 'JSONL', 'HTML/CSS'].map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-white/80 text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-purple-500/15 to-blue-500/10 border-purple-400/30 p-8 md:p-10 text-center space-y-4">
            <h3 className="text-2xl font-semibold text-white">Download Focus Time</h3>
            <p className="text-white/70">Available for macOS and Windows. All focus data stays local on your machine.</p>
            <Link
              href="/apps/focus-time"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-white font-medium transition-all duration-300 hover:scale-105 hover:border-purple-300/60 hover:text-purple-100"
            >
            Download App →
          </Link>
        </Card>
      </div>
    </StandardPage>
  )
}
