import React from "react";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AboutPageProps {
  onStartGenerate: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onStartGenerate }) => {
  const sections = [
    { num: 1, title: "Definition", desc: "Crisp, textbook-accurate, high-scoring university definition." },
    { num: 2, title: "Simple Explanation", desc: "Beginner-friendly intuitive conceptual explanation." },
    { num: 3, title: "Detailed Explanation", desc: "Core mechanisms, rules, and mathematical principles." },
    { num: 4, title: "Why / Where It Is Used", desc: "Practical applications and modern software architecture usage." },
    { num: 5, title: "Syntax & Formulas", desc: "Standard syntax, algorithm signatures, or mathematical formulas." },
    { num: 6, title: "Example Scenario", desc: "Clear academic walkthrough of the concept." },
    { num: 7, title: "Clean Code", desc: "Properly indented, commented, and runnable implementation." },
    { num: 8, title: "Code Explanation", desc: "Line-by-line explanation of crucial lines and logic." },
    { num: 9, title: "Expected Output", desc: "Console or execution terminal output representation." },
    { num: 10, title: "Real-Life Analogy", desc: "Memorable everyday analogy to lock the concept in memory." },
    { num: 11, title: "Important Points", desc: "Bullet-pointed summary list for 10-minute pre-exam revision." },
    { num: 12, title: "Common Mistakes", desc: "Classic exam pitfalls and misconceptions with warning flags." },
    { num: 13, title: "Exam Questions", desc: "2-mark, 5-mark, and 10-mark standard university format questions." },
    { num: 14, title: "Viva Questions", desc: "Essential oral exam questions paired with punchy answers." },
    { num: 15, title: "MCQs", desc: "Concept-testing multiple choice questions with explanations." },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Intro */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
          <GraduationCap className="w-4 h-4" />
          <span>About AI Notes Generator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Crafted for College Students
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          University syllabi are notoriously dense. Generic chatbots produce fragmented, shallow summaries.
          AI Notes Generator structures study materials around a rigorous 15-module academic blueprint designed to maximize semester exam scores.
        </p>
      </div>

      {/* 15 Modules Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            The 15-Section Exam Blueprint
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Every generated study note contains these structured modules:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((sec) => (
            <div
              key={sec.num}
              className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {sec.num}
                </span>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{sec.title}</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-8">
                {sec.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Ready Guarantee */}
      <div className="rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Zero Hallucinations Guarantee
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-xl">
            Prompts are strictly grounded to canonical computer science and engineering literature. When syntax or facts are uncertain, the system adheres to official standards.
          </p>
        </div>

        <button
          onClick={onStartGenerate}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 shrink-0 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Study Notes</span>
        </button>
      </div>
    </div>
  );
};
