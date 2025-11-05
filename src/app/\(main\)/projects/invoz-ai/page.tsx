import Link from 'next/link'
import Image from 'next/image'
import StandardPage from '@/components/shared/stand-page'
import { Card } from '@/components/ui/Card'

export default function InvozAiProject() {
  return (
    <StandardPage currentPage="projects" maxWidth="default">
      <div className="space-y-12">
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-blue-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
            In Progress
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Invoz.ai: Privacy-First Speech Coach
          </h1>
          <p className="text-lg md:text-xl text-white/70 leading-relaxed">
            On-device ambient dictation tool with real-time grammatical correction and personalized pronunciation feedback powered by federated learning—all while keeping your voice data 100% private.
          </p>
        </header>

        <Card className="border-white/10 bg-white/[0.05] overflow-hidden">
          <div className="relative w-full h-64 md:h-80 bg-black">
            <Image
              src="/images/previews_main/invoz_ai.png"
              alt="Invoz.ai speech coach interface"
              fill
              className="object-contain object-center md:scale-95 scale-95"
              priority
            />
          </div>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">The Vision</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg">
            Invoz transforms how non-native English speakers improve their communication clarity. By combining on-device AI for dictation, real-time grammar correction, and passive pronunciation coaching, Invoz helps professionals become more confident and intelligible speakers—without ever sending voice data to the cloud.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Core Value: Productivity</h3>
              <p className="text-white/60 text-sm">Instantly dictate polished text anywhere, eliminating typing and self-editing friction.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Core Value: Coaching</h3>
              <p className="text-white/60 text-sm">Passively analyze speech patterns to provide actionable feedback on grammar and pronunciation.</p>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">How It Works: MVP User Flow</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/30 text-blue-300 font-semibold text-sm">1</div>
              </div>
              <div>
                <h3 className="text-white font-semibold">Summon</h3>
                <p className="text-white/70 text-sm">User presses a global hotkey (e.g., Option + Space).</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/30 text-blue-300 font-semibold text-sm">2</div>
              </div>
              <div>
                <h3 className="text-white font-semibold">Dictate</h3>
                <p className="text-white/70 text-sm">A minimal floating microphone widget appears. The user speaks their thoughts naturally.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/30 text-blue-300 font-semibold text-sm">3</div>
              </div>
              <div>
                <h3 className="text-white font-semibold">Insert</h3>
                <p className="text-white/70 text-sm">The on-device AI pipeline generates a grammatically corrected version and automatically injects it into the active text field.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/30 text-blue-300 font-semibold text-sm">4</div>
              </div>
              <div>
                <h3 className="text-white font-semibold">Review Later</h3>
                <p className="text-white/70 text-sm">The app silently logs phonetic and grammatical errors. Users can open the dashboard to view their aggregated mistakes and track progress.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Technical Architecture: Privacy by Design</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg mb-6">
            The entire AI pipeline runs 100% on-device using optimized open-source models. No voice data ever leaves your machine.
          </p>
          <div className="space-y-6">
            <div className="border-l-2 border-blue-400/50 pl-4">
              <h3 className="text-white font-semibold">Desktop App Shell</h3>
              <p className="text-white/70 text-sm">Built with Tauri and Rust for superior performance, security, and a tiny footprint (~10MB vs. 100MB+ for Electron).</p>
            </div>
            <div className="border-l-2 border-blue-400/50 pl-4">
              <h3 className="text-white font-semibold">On-Device AI Pipeline</h3>
              <ul className="text-white/70 text-sm space-y-2 mt-2 list-disc list-inside">
                <li><span className="text-white/90 font-medium">Whisper.cpp:</span> Quantized ASR model for accurate speech-to-text, especially for non-native accents.</li>
                <li><span className="text-white/90 font-medium">Phi-3.5 Mini / Llama 3.1 8B:</span> Small LLM for real-time grammatical correction via Ollama or LM Studio.</li>
                <li><span className="text-white/90 font-medium">CUPE / HuBERT:</span> Phonetic analysis engine for detecting pronunciation errors and connected speech patterns.</li>
              </ul>
            </div>
            <div className="border-l-2 border-blue-400/50 pl-4">
              <h3 className="text-white font-semibold">Local Storage</h3>
              <p className="text-white/70 text-sm">SQLite database encrypted and stored locally. All error logs, user data, and statistics remain on-device.</p>
            </div>
            <div className="border-l-2 border-blue-400/50 pl-4">
              <h3 className="text-white font-semibold">System Integration</h3>
              <p className="text-white/70 text-sm">Global hotkey registration and text injection via macOS Accessibility API (AXAPI) and Windows UI Automation (UIA).</p>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">MVP Phonetic & Grammatical Features</h2>
          <p className="text-white/70 leading-relaxed text-base md:text-lg mb-6">
            The MVP focuses on high-impact pronunciation errors that significantly affect intelligibility and confidence:
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Productivity Feature (Real-Time)</h3>
              <p className="text-white/70 text-sm"><span className="font-medium">Grammatical Error Correction:</span> Fixes spelling, punctuation, and common grammatical mistakes instantly.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Coaching Features (Logged for Aggregated Feedback)</h3>
              <ul className="text-white/70 text-sm space-y-2 list-disc list-inside">
                <li><span className="font-medium">Consonant Substitutions:</span> /θ/ vs. /t/ ("think" vs. "tink"), /r/ vs. /l/ ("right" vs. "light")</li>
                <li><span className="font-medium">Vowel Length/Quality:</span> Long /iː/ vs. short /ɪ/ ("leave" vs. "live"), which can cause misunderstandings</li>
                <li><span className="font-medium">Final Consonant Deletion:</span> Dropped word endings in -ed (past tense) and -s (plurals) that impact clarity</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Development Roadmap: MVP to Version 2.0</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-blue-300 font-semibold flex items-center gap-2">
                <span className="text-white/40">Phase 1-2 (MVP)</span> AI Pipeline & App Shell
              </h3>
              <p className="text-white/70 text-sm mt-2">Build and validate on-device AI models; create Tauri desktop app with hotkey and text injection; basic error logging to SQLite.</p>
            </div>
            <div>
              <h3 className="text-blue-300 font-semibold flex items-center gap-2">
                <span className="text-white/40">Phase 3-4 (V2.0)</span> Advanced Coaching & Federated Learning
              </h3>
              <p className="text-white/70 text-sm mt-2">Phonetic analysis engine with connected speech detection (linking, elision, assimilation); personalized feedback dashboard; foundational federated learning infrastructure for continuous model improvement.</p>
              <p className="text-white/50 text-xs mt-2">Federated Learning: Private model updates aggregated on a secure server, creating a virtuous cycle where global models improve from user data without ever collecting it.</p>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-white/[0.05] p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Why Invoz Matters</h2>
          <ul className="space-y-4 text-white/70 text-base md:text-lg">
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold">→</span>
              <span><span className="text-white font-medium">Productivity Superpower:</span> Dictation that *actually works* without manual editing or AI hallucinations.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold">→</span>
              <span><span className="text-white font-medium">Privacy Guarantee:</span> No voice data leaves your device. Ever. This is the antithesis of cloud-based speech tools.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold">→</span>
              <span><span className="text-white font-medium">Personalized Coaching:</span> Discover your unique pronunciation patterns and track improvement over weeks and months.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold">→</span>
              <span><span className="text-white font-medium">Long-Term Moat:</span> Federated learning creates a powerful advantage: continuous model improvement from anonymized user patterns.</span>
            </li>
          </ul>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border-blue-400/30 p-8 md:p-10 text-center space-y-4">
          <h3 className="text-2xl font-semibold text-white">Current Status: MVP Development</h3>
          <p className="text-white/70">Building Phase 1: AI pipeline validation and Tauri app shell. Target: Working dictation + grammar correction by end of 2025.</p>
          <p className="text-white/50 text-sm">Stay tuned for updates and a public beta.</p>
        </Card>
      </div>
    </StandardPage>
  )
}
