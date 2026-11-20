import PageShell from '@/components/shared/page-shell'
import ScrollReveal from '@/components/shared/scroll-reveal'
import { LINKEDIN, MAILTO } from '@/lib/site'
import Chat from './chat'

const timeline = [
    {
        year: '2018',
        title: 'Petroleum Engineering, Colombia',
        description: 'Graduated. Learned to think in systems, constraints, and optimization under pressure.',
    },
    {
        year: '2022',
        title: 'NYC, MS Business Analytics, Baruch',
        description: 'Moved to New York with no safety net. Bartended four nights a week. Built ML projects every other waking hour.',
    },
    {
        year: '2023',
        title: 'Invoz.ai, from papers to production',
        description: 'Read 46 research papers. Built a speech ML pipeline that scores pronunciation across 11 dimensions. First time I felt like a real engineer.',
    },
    {
        year: '2024',
        title: 'Holus, the systems problem',
        description: 'Autonomous agents. Redis pub/sub. Silo isolation. Proved to myself that the hard part of AI is not the model. It is everything around it.',
    },
    {
        year: 'Now',
        title: 'Production AI systems, still hungry',
        description: 'Shipping audio ML, agent infrastructure, and full-stack applications from Queens. Looking for a team that builds things that matter.',
    },
]

const skills = [
    {
        title: 'Audio/Speech ML',
        description: 'Whisper, wav2vec2, Parselmouth, Silero VAD. I built a production pronunciation scoring system, not a wrapper around an API.',
    },
    {
        title: 'Multi-Agent Systems',
        description: 'LangGraph orchestration, Redis event bus, health preflight, observability, silo isolation. I think about agent reliability the way SREs think about uptime.',
    },
    {
        title: 'Full-Stack & Data',
        description: 'TypeScript, Next.js, FastAPI, PostgreSQL, Redis. I build the entire stack because waiting for someone else to unblock you is a luxury early-stage does not have.',
    },
    {
        title: 'Business-Aware Engineering',
        description: 'MS in Business Analytics means I think about cost-per-inference and unit economics at the architecture stage. Not after launch.',
    },
]

const values = [
    { title: 'Systems over motivation', desc: 'I do not rely on feeling motivated. I build structures that produce output regardless: automated pipelines, daily commits, public accountability.' },
    { title: 'Depth over breadth', desc: '46 papers for one feature. Agent orchestration for one system. I would rather master one hard problem than skim ten easy ones.' },
    { title: 'Ship then measure', desc: 'Working software is the only credible argument. I ship first, measure impact, then iterate based on what actually happened, not what I imagined would happen.' },
    { title: 'Honest about gaps', desc: 'I do not perform expertise I do not have. If I do not know something, I say so, then I go learn it. That is faster than pretending.' },
]

export default function AboutPage() {
    return (
        <PageShell currentPage="about" maxWidth="wide">
            {/* Hero */}
            <header className="rise-in grid gap-8 border-b border-line pb-12 md:grid-cols-12 md:gap-12 md:pb-16">
                <div className="md:col-span-8">
                    <h1 className="display">About Camilo</h1>
                    <p className="lede mt-6">
                        Applied AI engineer. Immigrant. Runner. I build things that work and I do not stop until they ship.
                    </p>
                </div>
                <dl className="facts self-end md:col-span-4">
                    <dt>Based in</dt>
                    <dd>Astoria, Queens, New York</dd>
                    <dt>Education</dt>
                    <dd>MS Business Analytics, Baruch College; BS Petroleum Engineering</dd>
                    <dt>Status</dt>
                    <dd>
                        <span className="status status-live text-ink">Open to Applied AI Engineer roles</span>
                    </dd>
                </dl>
            </header>

            <div className="grid gap-12 py-12 md:grid-cols-12 md:gap-16 md:py-16">
                {/* Story */}
                <ScrollReveal className="md:col-span-7">
                    <section aria-labelledby="story-heading">
                        <h2 id="story-heading" className="title-lg">The real version</h2>
                        <div className="prose mt-6">
                            <p>
                                I studied petroleum engineering in Colombia. Good at it, but knew I wanted something different. Moved to New York with a plan: get a master&apos;s degree, learn to build software, figure out the rest later.
                            </p>
                            <p>
                                &ldquo;Figure out the rest later&rdquo; turned out to mean bartending four nights a week at a cocktail bar in Manhattan while taking a full course load at Baruch. The other hours went to building things. Not tutorials. Not demos. <strong>Actual applications that real people use.</strong>
                            </p>
                            <p>
                                The project that changed everything was <strong>Invoz</strong>. I wanted to build a speech scoring system, so I read 46 research papers on audio processing and taught myself signal processing from scratch. That project became an 11-dimension pronunciation scorer running Whisper, wav2vec2, Parselmouth, and Silero VAD in production. It taught me that going genuinely deep on a hard problem is more valuable than being broadly familiar with easy ones.
                            </p>
                            <p>
                                Then I built <strong>Holus</strong>, an autonomous agent system with Redis pub/sub, silo isolation, guardrails, and self-improvement loops. That project confirmed what I suspected: <strong>the hard problems in AI are not the models. They are the systems around them.</strong> Orchestration, reliability, observability, failure recovery. The stuff that does not make good Twitter threads but determines whether your system works at 3 AM.
                            </p>
                            <p>
                                I ship production systems and keep improving them. I run regularly, I am trying to hit every street in Astoria, and I am looking for a team where the bar is high and the problems are real.
                            </p>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Timeline */}
                <ScrollReveal className="md:col-span-5">
                    <section aria-labelledby="timeline-heading">
                        <h2 id="timeline-heading" className="title-lg">Timeline</h2>
                        <ol className="row-list mt-6">
                            {timeline.map((item) => (
                                <li key={item.year} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4 py-4">
                                    <span className="pt-0.5 text-sm font-medium tabular-nums text-muted">{item.year}</span>
                                    <div>
                                        <h3 className="title-sm text-base">{item.title}</h3>
                                        <p className="body-muted mt-1 text-sm">{item.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                </ScrollReveal>
            </div>

            {/* Skills */}
            <ScrollReveal>
                <section className="border-t border-line py-12 md:py-16" aria-labelledby="skills-heading">
                    <h2 id="skills-heading" className="title-lg">What I build with</h2>
                    <dl className="row-list mt-6">
                        {skills.map((skill) => (
                            <div key={skill.title} className="grid gap-2 py-5 md:grid-cols-12 md:gap-8">
                                <dt className="title-sm md:col-span-4">{skill.title}</dt>
                                <dd className="body-muted md:col-span-8">{skill.description}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </ScrollReveal>

            {/* Values */}
            <ScrollReveal>
                <section className="border-t border-line py-12 md:py-16" aria-labelledby="values-heading">
                    <h2 id="values-heading" className="title-lg">How I work</h2>
                    <div className="mt-6 grid gap-x-12 gap-y-8 sm:grid-cols-2">
                        {values.map((v) => (
                            <div key={v.title}>
                                <h3 className="title-sm">{v.title}</h3>
                                <p className="body-muted mt-2 text-[0.9375rem]">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </ScrollReveal>

            {/* Chat */}
            <ScrollReveal>
                <section className="border-t border-line py-12 md:py-16" aria-labelledby="chat-heading">
                    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                        <h2 id="chat-heading" className="title-lg">Ask me anything</h2>
                        <p className="caption">An assistant that knows my background. Try it.</p>
                    </div>
                    <div className="panel overflow-hidden">
                        <Chat />
                    </div>
                </section>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal>
                <section className="border-t border-line py-12 md:py-16" aria-labelledby="cta-heading">
                    <h2 id="cta-heading" className="title-lg">Looking for Applied AI Engineer roles</h2>
                    <p className="body-muted mt-3 max-w-xl">Available now. Based in New York City, open to US remote.</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <a href={MAILTO} className="btn-primary">
                            Send email
                        </a>
                        <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                            Connect on LinkedIn
                        </a>
                    </div>
                </section>
            </ScrollReveal>
        </PageShell>
    )
}
