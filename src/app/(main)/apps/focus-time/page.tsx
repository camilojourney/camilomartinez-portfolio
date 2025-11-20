'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Apple, Monitor, Check, BookOpen, Github, Clock, Brain, Calendar, Lock, BarChart3, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import Link from 'next/link'
import LiquidNav from '@/components/shared/liquid-nav'
import Image from 'next/image'

export default function FocusTimeDownloadPage() {
  const [platform, setPlatform] = useState<'mac' | 'windows'>('mac')

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <LiquidNav currentPage="apps" />

      {/* Advanced Neural Network Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-blue-950/40"></div>

        {/* Animated neural network pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="neural-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="1" fill="url(#grad1)" opacity="0.5">
                  <animate attributeName="r" values="1;2;1" dur="3s" repeatCount="indefinite" />
                </circle>
                <line x1="50" y1="50" x2="100" y2="0" stroke="url(#grad1)" strokeWidth="0.5" opacity="0.3" />
                <line x1="50" y1="50" x2="100" y2="100" stroke="url(#grad1)" strokeWidth="0.5" opacity="0.3" />
                <line x1="50" y1="50" x2="0" y2="100" stroke="url(#grad1)" strokeWidth="0.5" opacity="0.3" />
              </pattern>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-grid)" />
          </svg>
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Content */}
      <div className="relative pt-24 md:pt-32 px-4 md:px-6 pb-20">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-7xl mx-auto mb-6"
        >
          <Link
            href="/apps"
            className="inline-flex items-center space-x-2 text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Apps</span>
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-20 max-w-6xl mx-auto"
        >
          {/* Glowing Brain Logo */}
          <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center mb-12 relative"
          >
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-cyan-500/30 rounded-full blur-3xl scale-150 animate-pulse-slow"></div>

            <div className="relative w-40 h-40 md:w-48 md:h-48">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
              <Image
                src="/images/previews_main/Hyper-awareness.png"
                alt="Focus Time logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>

          {/* Title with dramatic effect */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-8xl font-black mb-6 tracking-tight"
          >
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              MASTER YOUR
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              FOCUS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-12"
          >
            The ultimate menu bar app for hyperfocus awareness
          </motion.p>

          {/* Download Buttons - Prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.a
              href={platform === 'mac' ? '/downloads/focus-time-macos.dmg' : '/downloads/focus-time-windows.exe'}
              download
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              {platform === 'mac' ? <Apple className="w-7 h-7" /> : <Monitor className="w-7 h-7" />}
              <span>Download for {platform === 'mac' ? 'macOS' : 'Windows'}</span>
              <Download className="w-6 h-6" />
            </motion.a>

            <motion.button
              onClick={() => setPlatform(platform === 'mac' ? 'windows' : 'mac')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-white/5 hover:bg-white/10 border-2 border-white/20 text-white font-semibold rounded-2xl transition-all duration-300"
            >
              {platform === 'mac' ? <Monitor className="w-6 h-6" /> : <Apple className="w-6 h-6" />}
              <span>Switch to {platform === 'mac' ? 'Windows' : 'macOS'}</span>
            </motion.button>
          </motion.div>

          {/* Secondary Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link
              href="/projects/focus-time"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-sm font-medium rounded-xl transition-all duration-300"
            >
              <BookOpen className="w-4 h-4" />
              <span>How I built this</span>
            </Link>
            <a
              href="https://github.com/yourusername/focus-time"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-sm font-medium rounded-xl transition-all duration-300"
            >
              <Github className="w-4 h-4" />
              <span>View Source</span>
            </a>
          </motion.div>
        </motion.section>

        {/* Three Core Features - Bold Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="max-w-7xl mx-auto mb-20"
        >
          <div className="relative rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-blue-950/30 to-slate-950/40 backdrop-blur-xl p-8 md:p-12 overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-50"></div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Boost Awareness */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 mb-6 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl border-2 border-purple-400/40 flex items-center justify-center">
                    <Clock className="w-12 h-12 md:w-14 md:h-14 text-purple-300" strokeWidth={2} />
                  </div>
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-wide">
                  BOOST<br />AWARENESS
                </h3>
                <p className="text-white/60 text-sm md:text-base">
                  Periodic check-ins every 15 minutes
                </p>
              </motion.div>

              {/* Sharpen Focus */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 mb-6 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl border-2 border-blue-400/40 flex items-center justify-center">
                    <Zap className="w-12 h-12 md:w-14 md:h-14 text-blue-300" strokeWidth={2} />
                  </div>
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-wide">
                  SHARPEN<br />FOCUS
                </h3>
                <p className="text-white/60 text-sm md:text-base">
                  Stay grounded during hyperfocus
                </p>
              </motion.div>

              {/* Enhance Insights */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 mb-6 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-cyan-600/20 to-emerald-600/20 rounded-2xl border-2 border-cyan-400/40 flex items-center justify-center">
                    <BarChart3 className="w-12 h-12 md:w-14 md:h-14 text-cyan-300" strokeWidth={2} />
                  </div>
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-wide">
                  ENHANCE<br />INSIGHTS
                </h3>
                <p className="text-white/60 text-sm md:text-base">
                  Review your focus patterns
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* App Preview Mockup */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="max-w-5xl mx-auto mb-20"
        >
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-8 md:p-16 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5"></div>

            {/* Mockup placeholder - you can replace with actual screenshot */}
            <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-4">
                <Brain className="w-20 h-20 mx-auto text-purple-400/50" />
                <p className="text-white/40 text-sm">App Preview</p>
              </div>

              {/* Optional: Floating elements to simulate UI */}
              <div className="absolute top-4 left-4 bg-purple-500/20 border border-purple-400/30 rounded-lg px-4 py-2 text-purple-200 text-xs font-medium">
                🧠 15:00
              </div>
              <div className="absolute bottom-4 right-4 bg-blue-500/20 border border-blue-400/30 rounded-lg px-4 py-2 text-blue-200 text-xs font-medium">
                Check-in ready
              </div>
            </div>
          </div>
        </motion.section>

        {/* Why Choose Focus Time */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          className="max-w-6xl mx-auto mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Built for <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ADHD Minds</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: 'Hyperfocus Aware',
                description: 'Gentle check-ins every 15 minutes keep you grounded without breaking deep work flow',
                gradient: 'from-purple-500/20 to-pink-500/20',
                border: 'border-purple-400/30'
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: 'Privacy First',
                description: 'All data stays local. No cloud sync, no analytics, no tracking. Your focus is yours alone',
                gradient: 'from-blue-500/20 to-cyan-500/20',
                border: 'border-blue-400/30'
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: 'Calendar Smart',
                description: 'Auto-suggests your current meeting as a focus goal with macOS Calendar integration',
                gradient: 'from-cyan-500/20 to-emerald-500/20',
                border: 'border-cyan-400/30'
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Pattern Insights',
                description: 'Review session timelines to understand your focus patterns and task-switching behavior',
                gradient: 'from-emerald-500/20 to-green-500/20',
                border: 'border-emerald-400/30'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.3 + index * 0.1 }}
                className={`relative group rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient} backdrop-blur-sm p-6 hover:scale-[1.02] transition-all duration-300`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} border ${feature.border} flex items-center justify-center flex-shrink-0 text-white`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack Badge */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="text-white/60 text-sm font-medium">Built with:</span>
            {['Tauri 2', 'Rust', 'macOS', 'EventKit'].map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-400/20 bg-purple-500/10 text-purple-200 text-xs font-medium"
              >
                <Check className="w-3 h-3" />
                {tech}
              </span>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
