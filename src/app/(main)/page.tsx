`¡`"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";
import { Chatbot } from '@/components/features/Chatbot';

export default function PortfolioPage() {
  const FADE_UP_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 100 
      } 
    },
  };

  return (
    <main className="container max-w-4xl mx-auto py-24 sm:py-32 px-4">
      <motion.div
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        variants={{ show: { transition: { staggerChildren: 0.15 } } }}
        className="text-center"
      >
        <motion.h1 variants={FADE_UP_VARIANTS} className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl text-accent">
          Camilo Martinez
        </motion.h1>
        <motion.h2 variants={FADE_UP_VARIANTS} className="mt-4 text-xl sm:text-2xl text-foreground">
          AI Developer & Data Analyst
        </motion.h2>
        <motion.p variants={FADE_UP_VARIANTS} className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          I build intelligent applications that understand and generate language, turning complex data into actionable insights.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="p-6 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div>
            <h3 className="text-lg font-semibold text-accent">🤖 AI-Powered Chatbot</h3>
            <p className="mt-2 text-muted-foreground">An interactive 'About Me' section powered by the OpenAI API with conversation memory.</p>
          </div>
          <span className="mt-4 flex items-center text-sm font-medium text-accent">
            Explore Feature <ArrowRight className="ml-2 h-4 w-4" />
          </span>
        </Card>
        <Card className="p-6 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div>
            <h3 className="text-lg font-semibold text-accent">🏃‍♂️ WHOOP Data Pipeline</h3>
            <p className="mt-2 text-muted-foreground">A complete fitness data pipeline with OAuth 2.0 and automated daily collection.</p>
          </div>
           <span className="mt-4 flex items-center text-sm font-medium text-accent">
            View Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </span>
        </Card>
      </motion.div>

      {/* Interactive 'About Me' Chatbot Section */}
      <div id="chatbot-section" className="mt-24">
        <h2 className="text-3xl font-semibold tracking-tight text-center text-accent">Interactive 'About Me'</h2>
        <p className="mt-4 text-muted-foreground text-center">Ask my AI assistant anything about my work.</p>
        <Chatbot />
      </div>
    </main>
  );
}
