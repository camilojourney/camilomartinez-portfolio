# Invoz.ai: Privacy-First Speech Coach

> **On-device ambient dictation + real-time grammar correction + personalized pronunciation feedback powered by federated learning.**

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [MVP User Experience](#mvp-user-experience)
3. [Technical Architecture](#technical-architecture)
4. [MVP Feature Set](#mvp-feature-set)
5. [Development Timeline](#development-timeline)
6. [Phase 2: Advanced Features](#phase-2-advanced-features)
7. [Competitive Advantages](#competitive-advantages)

---

## Product Vision

### Product Statement
Invoz is a privacy-first, on-device, ambient dictation tool that transforms spoken thoughts into grammatically correct text in any application.

### Core Values
| Value | Description |
|-------|-------------|
| **Productivity** | Instantly dictate polished text anywhere on your desktop, eliminating the need to type and self-edit. |
| **Coaching** | Passively and privately analyze your speech patterns to provide aggregated, actionable feedback on your most common grammatical and pronunciation errors, helping you improve your communication clarity over time. |

### Target User (MVP)
Non-native English-speaking professionals in tech-adjacent roles who rely on written and spoken communication and are motivated to improve their clarity and confidence.

---

## MVP User Experience

### Core User Flow

1. **Summon:** User presses a global hotkey (e.g., `Option + Space`)
2. **Dictate:** A minimal floating microphone widget appears. The user speaks naturally.
3. **Insert:** The on-device AI pipeline generates a grammatically corrected version and automatically injects it into the active text field
4. **Review (Later):** The app silently logs phonetic and grammatical errors. Users can later open the dashboard to view their aggregated mistakes and progress.

---

## Technical Architecture

### Design Principles
- **100% On-Device:** No cloud dependency; all AI models run locally
- **Privacy-First:** Voice data never leaves the machine
- **Performance-Focused:** Lightweight, fast, always-available
- **Cross-Platform:** macOS and Windows support from day one

### Stack Overview

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Desktop App Shell** | **Tauri + Rust** | Superior performance (~40MB memory vs. 200MB+ Electron), smaller bundle (~10MB vs. 100MB+), faster startup (<0.5s vs. 1-2s). Rust backend provides security and memory safety. |
| **Global Hotkey & Widget** | **OS-native APIs** | Reliable, fast system-wide shortcut registration. Floating borderless window always accessible. |
| **Text Injection** | **AXAPI (macOS) / UIA (Windows)** | Most robust method for injecting text into other applications. Avoids brittle keystroke simulation. |
| **Speech-to-Text (ASR)** | **Whisper + whisper.cpp** | State-of-the-art accuracy for non-native accents and noisy environments. Highly optimized for consumer CPUs/GPUs. |
| **Grammatical Correction (GEC)** | **Phi-3.5 Mini or Llama 3.1 8B** | Small, quantized LLM suitable for on-device inference via Ollama or LM Studio. |
| **Phonetic Analysis** | **CUPE / HuBERT** | Specialized, lightweight acoustic model for granular phoneme recognition without full ASR overhead. |
| **Storage** | **SQLite (encrypted)** | Serverless, reliable, on-device-only. Ensures no sensitive data leaves the machine. |

---

## MVP Feature Set

### Productivity Feature (Real-Time)

**Grammatical Error Correction (GEC)**
- Fixes spelling, punctuation, and common grammatical mistakes
- Provides clean, polished text output ready to use immediately

### Coaching Features (Logged for Aggregated Feedback)

Based on research into factors that most affect non-native speaker intelligibility:

#### 1. High-Impact Consonant Errors
- `/θ/` vs. `/t/` (e.g., "think" vs. "tink")
- `/r/` vs. `/l/` (e.g., "right" vs. "light")

#### 2. Key Vowel Length/Quality Errors
- Long `/iː/` vs. short `/ɪ/` (e.g., "leave" vs. "live")
- Critical vowel pair confusions that cause embarrassing misunderstandings

#### 3. Final Consonant Deletion
- Dropped `-ed` (past tense verb endings)
- Dropped `-s` (plural markers)

---

## Development Timeline: MVP (16 Weeks)

### Phase 1: AI Pipeline Prototyping (Weeks 1-4)
**Goal:** Validate feasibility and accuracy of on-device AI models

**Milestone:**
- Command-line tool that takes audio file and outputs:
  1. Raw transcription
  2. Grammatically corrected transcription
  3. Sequence of detected phonemes

### Phase 2: System Integration & App Shell (Weeks 5-8)
**Goal:** Build the "invisible" application infrastructure

**Milestone:**
- Functional Tauri shell
- Global hotkey launches app
- Floating widget appears and accepts speech input
- Successfully injects hard-coded text into other applications via Accessibility APIs

### Phase 3: Full Integration & UI Build (Weeks 9-12)
**Goal:** Connect AI pipeline to app shell and build basic UI

**Milestone:**
- Complete core loop: press hotkey → speak → corrected text appears in target application
- Errors silently and correctly logged to SQLite database

### Phase 4: Feedback, Polish & Alpha Release (Weeks 13-16)
**Goal:** Build feedback dashboard and prepare for closed alpha

**Milestone:**
- Distributable installer for macOS and Windows
- Simple dashboard visualizing user's most common errors
- Stable enough for release to small group of target users

---

## Phase 2: Advanced Features & Version 2.0 (20-Week Timeline)

### Phase 2 Vision
Evolve from powerful productivity tool into a private, personal AI speech coach that helps users become more confident and intelligible English speakers through data-driven, actionable feedback.

### Sprint 1: Advanced Phonetic Engine (Weeks 17-22)

#### 1.1 Integrate Phonetic Recognition Model
- Deploy **CUPE** or fine-tuned **HuBERT** as native binary in Rust backend
- Real-time phoneme sequence generation from raw audio

#### 1.2 Develop Phonetic Diffing & Pattern Recognition
- **Segmental Error Detection:** Compare user phonemes vs. canonical phonemes
  - Target errors: consonant substitutions, vowel length, final consonant deletion
- **Connected Speech Detection:** Analyze phonemes at word boundaries
  - Linking (liaison): failure to link final consonant to initial vowel
  - Elision: failure to drop expected sounds in clusters
  - Assimilation: failure to modify sounds based on neighbors

#### 1.3 Implement Word Stress & Rhythm Detection
- Segment audio into syllables
- Calculate acoustic prominence (loudness, pitch, duration)
- Compare against canonical stress pattern
- Flag "Word Stress" errors when user's stressed syllable doesn't match expected

#### 1.4 Expand Database Schema
- New `pronunciation_errors` table with error types including:
  - `CONNECTED_SPEECH_LINKING`
  - `CONNECTED_SPEECH_ELISION`
  - `WORD_STRESS`

### Sprint 2: Dashboard & Profiles (Weeks 23-26)

#### 2.1 Local User Profile System
- Simple settings table for preferences (native language, learning goals)
- Enables future personalization without data collection

#### 2.2 Feedback Dashboard UI
- Summary view: top 3 most common errors
- Trend chart: error frequency over time
- Detailed error log: specific examples with explanations
- Built with React/Svelte in Tauri webview

#### 2.3 Data Visualization Logic
- Rust backend exposes API endpoints for frontend queries
- Aggregation queries (COUNT, GROUP BY) for charts

### Sprint 3: Federated Learning Infrastructure (Weeks 27-32)

#### 3.1 Set Up Aggregation Server
- Cloud server running TensorFlow Federated or PySyft
- Implements **Federated Averaging (FedAvg)** algorithm
- **Critical:** Server has zero access to user data

#### 3.2 Client-Side Training Logic
- **Background process** periodically:
  1. Downloads latest global model from aggregation server
  2. Trains on local device using user's private speech data (locally stored)
  3. Calculates model delta (mathematical difference)
  4. Sends *only anonymous delta* back to server
  5. **User voice data NEVER leaves device**

#### 3.3 Secure & Efficient Communication
- HTTPS encryption for all client-server communication
- **Parameter-Efficient Fine-Tuning (PEFT):** Only subset of parameters transmitted
- Dramatically reduces bandwidth requirements

### Sprint 4: Integration, Beta & Refinement (Weeks 33-36)

#### 4.1 Final Integration & End-to-End Testing
- Merge Federated Learning client into main app
- Rigorous testing of entire user flow

#### 4.2 Closed Beta Program
- Recruit 50-100 users from target demographic
- Collect quantitative (usage data) and qualitative (surveys) feedback
- Focus on coaching feature effectiveness and connected speech accuracy

#### 4.3 Refinement & Polish
- Address critical bugs from beta feedback
- Refine dashboard UI/UX
- Tune Phonetic Diffing Algorithm thresholds based on real-world data
- Prepare final V2.0 build for public release

---

## Phase 2: Core Logic Components (Variables for Tuning)

### 1. Phonetic Diffing & Pattern Recognition Algorithm
**Importance:** The "brain" of the coach. Moves beyond simple phoneme comparison to identify patterns across word boundaries and detect connected speech phenomena.

**Key Variables to Tune:**
- **Error Thresholds:** How much acoustic deviation to flag as error (adjustable by user proficiency)
- **Feature Weighting:** Weight certain phonetic mismatches more heavily (e.g., voicing errors vs. minor vowel shifts)
- **Connected Speech Ruleset:** Strictness of rules for detecting linking, elision, assimilation

### 2. Federated Learning Aggregation Strategy
**Importance:** Governs how models improve over time. User data is heterogeneous (different accents, microphones, noise levels), so naive aggregation can degrade performance.

**Key Variables to Tune:**
- **Adaptive Optimization:** Weight user updates differently based on data quality or contribution size
- **Personalized FL:** Hybrid approach—strong global model + slight fine-tuning per user device
- **Update Compression:** Use PEFT to send only small parameter subsets for efficiency

### 3. GEC-LLM Prompt Engineering
**Importance:** Quality of primary productivity feature depends almost entirely on prompt quality.

**Key Variables to Tune:**
- **Instructional Detail:** Specific rules ("preserve proper nouns," "maintain formal tone")
- **Few-Shot Examples:** Guide model output with good correction examples
- **Output Formatting:** Structured output (JSON) easier for app to parse

---

## Competitive Advantages

1. **Privacy by Design:** No cloud dependency. Voice data never leaves your device.
2. **Productivity + Coaching:** Dual value: immediate dictation help + long-term communication improvement
3. **Federated Learning Moat:** Continuous model improvement from user patterns without data collection
4. **Hyperlocal Performance:** On-device execution means no latency, no network dependency, always available
5. **Accessibility:** Non-native English speakers finally have a tool that understands their accent and helps them improve

---

## Key Technical Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| **Accessibility API Reliability** | Early prototype with AXAPI and UIA; explore workarounds; vendor-specific solutions if needed |
| **Phonetic Model Accuracy on Diverse Accents** | Source diverse training data; fine-tune models on target accents; user feedback loop |
| **On-Device Model Latency** | Aggressive model quantization; benchmark early; offload non-critical tasks to async |
| **Federated Learning Complexity** | Start with simple FedAvg; build incrementally; test extensively before public release |
| **Battery & CPU Usage** | Profile extensively; run resource-intensive tasks in background windows; optimize inference |

---

## Success Metrics (MVP)

- Achieves >95% grammatical correction accuracy on target user accents
- <500ms latency from speech end to text injection
- Memory footprint <100MB (idle)
- Successfully injects text into 90%+ of common applications
- 50+ target users in closed alpha with >80% reported feature usefulness

---

## Next Steps

1. ✅ **Product Canvas & Research** (in progress)
2. ⏳ **Phase 1 Prototyping:** AI pipeline validation (Nov-Dec 2025)
3. ⏳ **Phase 2 App Shell:** Tauri + system integration (Jan-Feb 2026)
4. ⏳ **Phase 3 Integration:** Full feature + basic UI (Mar-Apr 2026)
5. ⏳ **Phase 4 Alpha:** Dashboard + closed testing (May 2026)

---

## References & Inspirations

- **Whisper:** OpenAI's speech-to-text model
- **whisper.cpp:** Optimized Whisper inference for CPU/GPU
- **CUPE:** Contextless Universal Phoneme Encoder
- **HuBERT:** Self-supervised learning for speech
- **STAT:** Speech Transcription Analysis Tool
- **Federated Learning:** Google's FL research; TensorFlow Federated; PySyft
- **Tauri:** Lightweight desktop app framework
- **Ollama:** Local LLM inference engine

