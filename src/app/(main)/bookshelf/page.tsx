'use client';

import LiquidNav from '@/components/shared/liquid-nav'
import { Card } from '@/components/ui/Card'
import { BookOpen, Star } from 'lucide-react'

interface Book {
  title: string
  author: string
  category: string
  description: string
  amazonLink: string
  coverColor: string
  rating: number
  why: string
}

const books: Book[] = [
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'Psychology & Decision Making',
    description:
      'A groundbreaking tour of the mind that explains the two systems that drive the way we think. System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and logical.',
    amazonLink: 'https://www.amazon.com/Thinking-Fast-Slow-Daniel-Kahneman/dp/0374533555',
    coverColor: 'from-blue-400 to-cyan-500',
    rating: 5,
    why: 'Essential for understanding cognitive biases and improving decision-making in AI systems and life.',
  },
  {
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
    category: 'AI & Machine Learning',
    description:
      'The definitive textbook on deep learning, covering mathematical foundations, practical techniques, and research perspectives from leading experts in the field.',
    amazonLink: 'https://www.amazon.com/Deep-Learning-Adaptive-Computation-Machine/dp/0262035618',
    coverColor: 'from-purple-400 to-pink-500',
    rating: 5,
    why: 'The bible of deep learning. Comprehensive coverage from theory to practice.',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Productivity & Self-Improvement',
    description:
      'An easy and proven way to build good habits and break bad ones. Focuses on tiny changes that lead to remarkable results through compound growth.',
    amazonLink: 'https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299',
    coverColor: 'from-emerald-400 to-teal-500',
    rating: 5,
    why: 'Changed how I approach building systems and habits for continuous improvement.',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Software Engineering',
    description:
      'The big ideas behind reliable, scalable, and maintainable systems. Essential reading for anyone building data systems at scale.',
    amazonLink: 'https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321',
    coverColor: 'from-orange-400 to-red-500',
    rating: 5,
    why: 'Must-read for understanding modern data architecture and distributed systems.',
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'Business & Entrepreneurship',
    description:
      "How today's entrepreneurs use continuous innovation to create radically successful businesses. Build-Measure-Learn feedback loop methodology.",
    amazonLink: 'https://www.amazon.com/Lean-Startup-Entrepreneurs-Continuous-Innovation/dp/0307887898',
    coverColor: 'from-cyan-400 to-blue-500',
    rating: 4,
    why: 'Shaped my approach to building MVPs and iterating based on user feedback.',
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    category: 'History & Philosophy',
    description:
      'A narrative history of humanity from the Stone Age to the 21st century, examining how biology and history shaped human society.',
    amazonLink: 'https://www.amazon.com/Sapiens-Humankind-Yuval-Noah-Harari/dp/0062316095',
    coverColor: 'from-amber-400 to-orange-500',
    rating: 5,
    why: 'Provides context on how we got here and where we might be heading with AI.',
  },
  {
    title: 'Python for Data Analysis',
    author: 'Wes McKinney',
    category: 'Data Science',
    description:
      'Practical guide to data manipulation, analysis, and visualization using Python and pandas, written by the library’s creator.',
    amazonLink: 'https://www.amazon.com/Python-Data-Analysis-Wrangling-IPython/dp/1491957662',
    coverColor: 'from-lime-400 to-emerald-500',
    rating: 4,
    why: 'Core reference for every analytics workflow I build.',
  },
  {
    title: 'Make Time',
    author: 'Jake Knapp, John Zeratsky',
    category: 'Productivity & Self-Improvement',
    description:
      'Simple strategies to design your day around what matters most. Created by former Google designers who built the design sprint process.',
    amazonLink: 'https://www.amazon.com/Make-Time-Focus-Matters-Every/dp/0385543470',
    coverColor: 'from-yellow-400 to-amber-500',
    rating: 4,
    why: 'Great playbook for maintaining focus across multiple complex projects.',
  },
  {
    title: 'Range: Why Generalists Triumph in a Specialized World',
    author: 'David Epstein',
    category: 'Learning & Career',
    description:
      'Challenges the idea that specialization is the only path to success, showing how breadth of experience leads to innovation.',
    amazonLink: 'https://www.amazon.com/Range-Generalists-Triumph-Specialized-World/dp/0735214484',
    coverColor: 'from-teal-400 to-cyan-500',
    rating: 5,
    why: 'Validates my approach to combining AI, data science, and full-stack development.',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    category: 'Software Engineering',
    description:
      'Your journey to mastery. Timeless lessons and practical advice for software craftsmen at any level.',
    amazonLink: 'https://www.amazon.com/Pragmatic-Programmer-journey-mastery-Anniversary/dp/0135957052',
    coverColor: 'from-gray-400 to-slate-500',
    rating: 5,
    why: 'Essential principles that apply to any programming challenge or project.',
  },
]

export default function BookshelfPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="bookshelf" />

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy" />
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '2s' }}
          />
        </div>
      </div>

      <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-20">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-16 h-16 text-purple-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
            My Bookshelf
          </h1>
          <p className="text-xl md:text-2xl text-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Books that shaped my thinking on{' '}
            <span className="text-purple-400 font-semibold">AI</span>,{' '}
            <span className="text-cyan-400 font-semibold">data science</span>,{' '}
            <span className="text-pink-400 font-semibold">systems thinking</span>, and{' '}
            <span className="text-emerald-400 font-semibold">personal growth</span>.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {books.length} carefully curated recommendations across multiple disciplines
          </p>
        </div>

        <div className="max-w-7xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book, index) => (
              <a
                key={`${book.title}-${index}`}
                href={book.amazonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="group h-full border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                  <div className="p-6 h-full flex flex-col">
                    <div
                      className={`w-full h-48 bg-gradient-to-br ${book.coverColor} rounded-lg mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-lg`}
                    >
                      <BookOpen className="w-16 h-16 text-foreground" />
                    </div>

                    <div className="mb-3">
                      <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full border border-purple-400/30">
                        {book.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-purple-300 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{book.author}</p>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">{book.description}</p>

                    <div className="flex items-center gap-1 text-amber-300 mb-4">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className={`w-4 h-4 ${starIndex < book.rating ? 'fill-current' : 'text-white/20'}`}
                        />
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Why it matters:</p>
                      <p className="leading-relaxed">{book.why}</p>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
