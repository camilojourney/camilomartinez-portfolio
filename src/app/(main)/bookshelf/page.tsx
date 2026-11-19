

import PageShell from '@/components/shared/page-shell'
import { Star } from 'lucide-react'

interface Book {
  title: string
  author: string
  category: string
  description: string
  amazonLink: string
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
    rating: 4,
    why: 'Core reference for every analytics workflow I build.',
  },
  {
    title: 'Make Time',
    author: 'Jake Knapp, John Zeratsky',
    category: 'Productivity & Self-Improvement',
    description:
      'Simple strategies to design your day around what matters most. Created by former Google designers who built the design sprint process.',
    amazonLink: 'https://www.amazon.com/s?k=Make+Time+Jake+Knapp+John+Zeratsky',
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
    rating: 5,
    why: 'Essential principles that apply to any programming challenge or project.',
  },
]

export default function BookshelfPage() {
  return (
    <PageShell currentPage="bookshelf" maxWidth="wide">
      <header className="rise-in border-b border-line pb-10 md:pb-14">
        <h1 className="display">Bookshelf</h1>
        <p className="lede mt-6">
          Books that shaped my thinking on <em>AI</em>, data science, systems thinking, and personal growth.
        </p>
        <p className="caption mt-4">{books.length} recommendations. Links go to Amazon.</p>
      </header>

      <ol className="row-list" aria-label="Recommended books">
        {books.map((book, index) => (
          <li key={`${book.title}-${index}`} className="grid gap-3 py-7 md:grid-cols-12 md:gap-8 md:py-8">
            <div className="md:col-span-4">
              <h2 className="title-md">
                <a href={book.amazonLink} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                  {book.title}
                </a>
              </h2>
              <p className="caption mt-1">{book.author}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="tag">{book.category}</span>
                <span className="inline-flex items-center gap-0.5 text-ink" aria-label={`${book.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < book.rating ? 'fill-current' : 'text-line'}`} aria-hidden />
                  ))}
                </span>
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="body-muted">{book.description}</p>
              <p className="mt-3 text-[0.9375rem] text-ink">
                <span className="font-semibold">Why it matters.</span> {book.why}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  )
}
