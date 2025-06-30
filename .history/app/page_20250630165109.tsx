"use client"

import { BlogPosts } from 'app/components/posts'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* AI Visionary Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-cyan-900"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>
      
      <section className="relative z-10 backdrop-blur-sm bg-black/20 p-8 rounded-2xl border border-white/10">
      <h1 className="mb-2 text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
        Camilo Martinez
      </h1>
      <h2 className="mb-8 text-xl text-cyan-300 font-semibold">
        Data Analyst & AI Developer Specializing in NLP
      </h2>
      <p className="mb-4 text-gray-200 leading-relaxed">
        I build intelligent applications that understand and generate language. With a Master's degree in Data Analytics and a passion for NLP, I develop solutions that range from automated content creation to personalized AI coaching.
      </p>
      <p className="mb-8 text-gray-200 leading-relaxed">
        My philosophy is simple: data, used correctly, empowers us to achieve more. I build efficient, data-driven workflows that unleash the full capabilities of people and companies.
      </p>
      
      {/* Powerful CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-start gap-4 mb-10">
        <Link 
          href="/projects" 
          className="group bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold py-3 px-8 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
        >
          <span className="flex items-center gap-2">
            View My Work
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
        <Link 
          href="/contact" 
          className="border border-cyan-400/50 text-cyan-300 font-bold py-3 px-8 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-200 transition-all transform hover:scale-105 backdrop-blur-sm"
        >
          Get In Touch
        </Link>
      </div>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  )
}
