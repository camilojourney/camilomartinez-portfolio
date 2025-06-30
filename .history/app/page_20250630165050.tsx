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
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Camilo Martinez
      </h1>
      <h2 className="mb-8 text-xl text-neutral-600 dark:text-neutral-400">
        Data Analyst & AI Developer Specializing in NLP
      </h2>
      <p className="mb-4">
        I build intelligent applications that understand and generate language. With a Master's degree in Data Analytics and a passion for NLP, I develop solutions that range from automated content creation to personalized AI coaching.
      </p>
      <p className="mb-8">
        My philosophy is simple: data, used correctly, empowers us to achieve more. I build efficient, data-driven workflows that unleash the full capabilities of people and companies.
      </p>
      <div className="mb-8">
        <p className="mb-4 text-neutral-700 dark:text-neutral-300">
          Interested in collaborating? View my projects or contact me.
        </p>
      </div>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  )
}
