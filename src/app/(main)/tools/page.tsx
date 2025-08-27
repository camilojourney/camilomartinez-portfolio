'use client'

import LiquidPage from '@/components/shared/liquid-page'

export default function ToolsPage() {
  return (
    <LiquidPage currentPage="tools" backgroundVariant="purple">
      <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-12 max-w-5xl w-full shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extralight text-white mb-4 drop-shadow-lg">Tools</h1>
          <p className="text-white max-w-2xl mx-auto font-light">Curated systems I use and share to help with communication, productivity, and health. First up: a battle-tested productivity system in Notion.</p>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mx-auto mt-6"></div>
        </div>

        {/* Productivity System Card */}
        <div className="space-y-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-light text-white">✅ SIGNAL-BASED PRODUCTIVITY SYSTEM</h2>
            <p className="text-white mt-2 italic">Clarity, Focus, and Execution — for Teams or Solo Work</p>
          </div>

          <hr className="border-white/10" />

          <section className="prose prose-invert prose-headings:font-light max-w-none tools-prose">
            <h3>🧠 Why This System Exists</h3>
            <p>Most people don’t fail because they’re lazy.<br/>They fail because they’re overwhelmed by noise.</p>
            <p>Too many options.<br/>Too many tabs.<br/>Too many distractions dressed as tasks.</p>
            <p>This system brings you back to <strong>what truly matters.</strong><br/>It’s built around two pillars:</p>

            <hr />

            <h3>📝 TASK IVY LEE</h3>
            <p><em>“Where action happens.”</em></p>
            <p>
              This database is named after <strong>Ivy Lee</strong>, a productivity consultant from the early 1900s.<br/>
              He was hired by Charles Schwab, president of Bethlehem Steel, to help his executives become more effective.
            </p>
            <p>Ivy Lee gave them a simple rule:</p>
            <blockquote>
              <p>
                “Each night, write down the 6 most important things you need to do tomorrow.<br/>
                Prioritize them. Start with the first one. Don’t move to the next until it’s done.”
              </p>
            </blockquote>
            <p>
              That method transformed how Schwab's team worked — and it’s still relevant 100 years later.
            </p>
            <p>
              <strong>TASK IVY LEE</strong> is built on that same principle:<br/>
              <strong>Define your signal. Focus on it. Eliminate the rest.</strong>
            </p>
            <p>
              But unlike 1900, you're not limited to pen and paper — you now have automation, visibility, and project integration.
            </p>

            <hr />

            <h3>🧱 FRONTLINES</h3>
            <p><em>“Where your energy is deployed.”</em></p>
            <p>
              Every battle needs a frontline.
            </p>
            <p>
              This database holds your <strong>strategic initiatives</strong> — your campaigns.<br/>
              Whether it's launching a product, building a brand, or learning a new skill, this is where you define what you're fighting for.
            </p>
            <p>
              Each item in <strong>FRONTLINES</strong> is a project that deserves your attention.<br/>
              And each task in <strong>TASK IVY LEE</strong> is a step toward winning that war.
            </p>

            <h2>⚙️ How It Works</h2>
            <p>This system is split into two interconnected layers:</p>

            <h3>1. ✅ TASK IVY LEE — Daily Execution Layer</h3>
            <p>This is your <strong>operating table</strong>. You start here every day.</p>
            <h4>🔹 What to Add:</h4>
            <p>Add any task, idea, or follow-up here — from small actions to sub-tasks of bigger projects.</p>
            <h4>🔹 What to Set:</h4>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Use it to...</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>🎯 <code>Focus</code></td>
                    <td>
                      Classify how you treat the task:
                      <ul>
                        <li><code>to do</code> → This is your signal. Do it today.</li>
                        <li><code>to do later</code> → Not now. Park it.</li>
                        <li><code>to watch</code> → Pending, waiting on someone/something.</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td>✔️ <code>Status</code></td>
                    <td>Mark progress: <code>none</code>, <code>done</code>, or <code>eliminate</code></td>
                  </tr>
                  <tr>
                    <td>📅 <code>Due</code></td>
                    <td>Add a due date (optional)</td>
                  </tr>
                  <tr>
                    <td>⏰ <code>Delay</code></td>
                    <td>Automatically shows if you're on track or late</td>
                  </tr>
                  <tr>
                    <td>✅ <code>Complete on</code></td>
                    <td>Auto-filled when task is marked <code>done</code></td>
                  </tr>
                  <tr>
                    <td>🍀 <code>Project</code></td>
                    <td>Link the task to a project in <strong>FRONTLINES</strong></td>
                  </tr>
                  <tr>
                    <td>📌 <code>Subtasks</code></td>
                    <td>Break big tasks into smaller ones (linked entries)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2. 🧠 FRONTLINES — Strategic Layer</h3>
            <p>
              This is where your campaigns live. The battles you're fighting across your personal or professional life.
            </p>
            <h4>🔹 What to Add:</h4>
            <p>Add one project per outcome, initiative, or mission you’re actively focused on.</p>
            <p>Examples:</p>
            <ul>
              <li>“Launch V1 of AI Content Agent”</li>
              <li>“Finish Online Course”</li>
              <li>“Build Personal Brand on LinkedIn”</li>
            </ul>
            <h4>🔹 What to Set:</h4>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Use it to...</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>🏷 <code>Project Name</code></td>
                    <td>Name the initiative</td>
                  </tr>
                  <tr>
                    <td>🔵 <code>Status</code></td>
                    <td>Use phases like <code>Planning</code>, <code>In Progress</code>, <code>Review</code>, <code>Complete</code></td>
                  </tr>
                  <tr>
                    <td>📅 <code>Dates</code></td>
                    <td>Optional: define project duration</td>
                  </tr>
                  <tr>
                    <td>🧠 <code>Tasks IVE LEE</code></td>
                    <td>Automatically shows all tasks linked from TASK IVY LEE</td>
                  </tr>
                  <tr>
                    <td>🧱 <code>Dependencies</code></td>
                    <td>Use <code>Blocked By</code> and <code>Is Blocking</code> if you want to track flow</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>🧭 Daily Ritual</h2>
            <h4>☀️ Morning:</h4>
            <ul>
              <li>Open <strong>TASK IVY LEE</strong></li>
              <li>Filter for tasks with:
                <ul>
                  <li><code>Status = none</code></li>
                  <li><code>Focus = to do</code></li>
                </ul>
              </li>
              <li>Choose your top 1–3 signal tasks.</li>
              <li>Get to work.</li>
            </ul>
            <h4>🌙 Evening:</h4>
            <ul>
              <li>Mark completed tasks as <code>done</code></li>
              <li>Mark irrelevant ones as <code>eliminate</code></li>
              <li>Let <code>Complete on</code> and <code>Delay</code> update automatically</li>
            </ul>

            <h2>📆 Weekly Review</h2>
            <ol>
              <li>Open <strong>FRONTLINES</strong></li>
              <li>Review project <code>Status</code> and use <code>Sign Off?</code> to reflect</li>
              <li>Open <code>Tasks IVE LEE</code> to view all open tasks under each project</li>
              <li>Promote relevant <code>to do later</code> tasks</li>
              <li>Clean up eliminated or outdated entries</li>
            </ol>

            <h2>🔥 Why It Works</h2>
            <ul>
              <li>🧠 You only see what matters today</li>
              <li>🔄 You build a rhythm of decision → action → reflection</li>
              <li>💡 You reduce noise, context-switching, and overwhelm</li>
              <li>🧱 You always know what you’re working on — and why</li>
            </ul>

            <h3>🧬 Recap: System Flow</h3>
            <pre className="whitespace-pre-wrap leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 text-white"><code>{`FRONTLINES = What you're fighting for  
  ⬇  
TASK IVY LEE = How you’ll win it  

THIS ISI THE TEXT 

and the following is the page whre people would go and duplicate the work. 

https://camilomartinez.notion.site/Management-253e98e30a3080cd84acca32ff86621a?pvs=74`}</code></pre>
          </section>

          {/* CTA */}
          <div className="text-center">
            <a
              href="https://camilomartinez.notion.site/Management-253e98e30a3080cd84acca32ff86621a?pvs=74"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-medium backdrop-blur-xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 border border-emerald-300/30 hover:from-emerald-400/30 hover:to-cyan-400/30 hover:border-emerald-200/40 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-emerald-900/20"
            >
              <span>Duplicate the Templates — Free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <p className="text-white text-sm mt-3">Notion workspace — instant copy. Video walkthrough coming soon.</p>
          </div>
        </div>
      </section>
    </LiquidPage>
  )
}
