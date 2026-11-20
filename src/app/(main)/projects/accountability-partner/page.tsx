import {
  CaseStudy,
  CaseStudyCta,
  CaseStudyFigure,
  CaseStudyHeader,
  CaseStudySection,
} from '@/components/projects/case-study'

export default function AccountabilityPartnerProject() {
  return (
    <CaseStudy>
      <CaseStudyHeader
        status="Live system"
        title="Accountability Partner: public morning workout tracker"
        lede="A public commitment board tracking my daily morning workout challenge. Every workout, every morning, visible to everyone."
        facts={[
          ['Started', 'October 2025'],
          ['Rule', 'Work out before 8:30 AM, every day'],
          ['Source', 'WHOOP API, refreshed every 6 hours'],
        ]}
      />

      <CaseStudyFigure src="/images/previews_main/accountable.png" alt="Morning workout accountability tracker preview" />

      <div className="mt-6 md:mt-10">
        <CaseStudySection title="The challenge" id="challenge">
          <p>
            In October 2025, I made a commitment: work out before 8:30 AM every single day. But personal promises are
            easy to break in private. This project makes my commitment public, a digital accountability partner that
            tracks every workout time and displays them for everyone to see.
          </p>
        </CaseStudySection>

        <CaseStudySection title="Why morning workouts matter" id="why">
          <p>
            &ldquo;Win the morning, win the day&rdquo; isn&apos;t just a cliché. It&apos;s a foundational principle for
            peak performance. Early morning exercise:
          </p>
          <ul>
            <li>
              <strong>Sets the tone</strong> for discipline and momentum throughout the day
            </li>
            <li>
              <strong>Eliminates excuses</strong> before work, meetings, or fatigue can derail plans
            </li>
            <li>
              <strong>Builds consistency</strong> through non-negotiable morning rituals
            </li>
            <li>
              <strong>Creates accountability</strong> when tracked publicly
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="Technical implementation" id="implementation">
          <ul>
            <li>
              <strong>WHOOP API integration</strong> automatically pulls workout start times
            </li>
            <li>
              <strong>Timezone normalization</strong> converts UTC timestamps to New York time for accurate tracking
            </li>
            <li>
              <strong>Interactive visualization</strong> displays workout times with color-coded success and failure
              markers
            </li>
            <li>
              <strong>Real-time updates</strong> via Incremental Static Regeneration every 6 hours
            </li>
            <li>
              <strong>Goal tracking</strong> with clear visual indicators for the 8:30 AM threshold
            </li>
          </ul>
        </CaseStudySection>

        <CaseStudySection title="The power of public accountability" id="public">
          <p>
            Making this data public transforms a personal goal into a public commitment. The psychological impact is
            profound. Knowing that my workout times are visible creates an additional layer of motivation beyond
            personal discipline. This isn&apos;t about perfection. It&apos;s about consistency, transparency, and
            building a system that makes it harder to break promises to myself.
          </p>
        </CaseStudySection>
      </div>

      <CaseStudyCta
        title="Track my progress"
        body="See how I'm doing with my morning workout commitment in real time."
        href="/apps/accountability-partner"
        label="View live tracker"
      />
    </CaseStudy>
  )
}
