import {
  CaseStudy,
  CaseStudyCta,
  CaseStudyFigure,
  CaseStudyHeader,
  CaseStudySection,
  TechList,
} from '@/components/projects/case-study'

export default function FocusTimeProject() {
  return (
    <CaseStudy>
      <CaseStudyHeader
        status="Live app"
        title="Focus Time: hyperfocus awareness for deep work"
        lede="A macOS menu bar timer that helps people with ADHD maintain awareness during hyperfocus sessions through periodic check-ins, session reviews, and calendar integration."
        facts={[
          ['Platform', 'macOS and Windows'],
          ['Stack', 'Tauri 2, Rust, vanilla JavaScript'],
          ['Data', 'Local only, no network calls'],
        ]}
      />

      <CaseStudyFigure src="/images/previews_main/Hyper-awareness.png" alt="Focus Time menu bar app preview" />

      <div className="mt-6 md:mt-10">
        <CaseStudySection title="Why I built this" id="why">
          <p>
            As someone with ADHD, I experience hyperfocus: those deep work sessions where hours disappear. While this
            superpower drives incredible productivity, it comes with a cost: forgotten meetings, skipped meals, and
            losing track of time entirely.
          </p>
          <p>
            Existing timers and Pomodoro apps weren&apos;t built for this. They assume you want to <em>stop</em> working,
            but hyperfocus doesn&apos;t work that way. What I needed was <strong>gentle awareness</strong>: periodic
            check-ins that keep me grounded without breaking flow.
          </p>
          <p>
            Focus Time sits quietly in your menu bar, asking &ldquo;What are you working on?&rdquo; every 15 minutes.
            It&apos;s not about interrupting deep work. It&apos;s about creating accountability touchpoints that help you
            stay intentional about where your hyperfocus energy goes.
          </p>
        </CaseStudySection>

        <CaseStudySection title="Technical architecture" id="architecture">
          <p>Built for privacy and performance. All data stays local, no network calls, no tracking.</p>
          <ul>
            <li>
              <strong>Tauri 2.x</strong>: Rust + JavaScript hybrid framework for native macOS menu bar apps with minimal
              memory footprint
            </li>
            <li>
              <strong>Rust backend</strong>: system tray integration, macOS Calendar API (EventKit) access, and JSONL
              logging with zero network dependencies
            </li>
            <li>
              <strong>Vanilla JavaScript frontend</strong>: lightweight, framework-free UI with smooth animations and
              keyboard shortcuts
            </li>
            <li>
              <strong>Local-first storage</strong>: all focus session data stored in JSONL format in Tauri&apos;s sandboxed
              app directory
            </li>
            <li>
              <strong>Native macOS APIs</strong>: direct EventKit integration pulls the current calendar meeting as a
              suggested focus goal
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="Key features" id="features">
          <ul>
            <li>
              <strong>Periodic check-ins.</strong> Gentle prompts every 15 minutes asking &ldquo;What are you doing
              now?&rdquo; to maintain awareness without breaking flow.
            </li>
            <li>
              <strong>Session review.</strong> Timeline view shows all check-ins for a session, revealing your focus
              patterns and task-switching behavior.
            </li>
            <li>
              <strong>Calendar integration.</strong> Automatically suggests your current calendar meeting as a focus
              goal. No manual goal-setting required.
            </li>
            <li>
              <strong>Privacy-first.</strong> All data stays on your machine. No cloud sync, no analytics, no network
              calls. Your focus patterns are yours alone.
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="Technical challenges solved" id="challenges">
          <p>
            <strong>Tauri 2 window focus issues.</strong> Navigated the trade-off between <code>skipTaskbar</code> (no
            Dock icon) and window interactivity. Implemented <code>ActivationPolicy::Regular</code> to ensure buttons and
            text inputs work reliably.
          </p>
          <p>
            <strong>macOS Calendar API integration.</strong> Bridged Rust with Objective-C EventKit APIs to fetch current
            calendar events, handling permission prompts and error states gracefully.
          </p>
          <p>
            <strong>JSONL logging for session data.</strong> Designed an append-only log format for focus check-ins that
            supports efficient reads, search, and future analytics without a database.
          </p>
        </CaseStudySection>

        <CaseStudySection title="Tech stack" id="stack">
          <TechList items={['Tauri 2', 'Rust', 'Vanilla JS', 'macOS EventKit', 'JSONL', 'HTML/CSS']} />
        </CaseStudySection>
      </div>

      <CaseStudyCta
        title="Download Focus Time"
        body="Available for macOS and Windows. All focus data stays local on your machine."
        href="/apps/focus-time"
        label="Download app"
      />
    </CaseStudy>
  )
}
