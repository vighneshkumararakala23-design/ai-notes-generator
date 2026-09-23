import React from "react";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  FileCheck2,
  HelpCircle,
  FolderKanban,
  Download,
  Bookmark,
  Target,
  Zap,
  CheckCircle2,
  GraduationCap,
  Code2,
  ListOrdered,
  Award,
} from "lucide-react";

interface HomePageProps {
  onStartGenerate: (presetTopic?: string, presetSubject?: string) => void;
  onExploreFeatures: () => void;
  onOpenMyNotes: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartGenerate,
  onExploreFeatures,
  onOpenMyNotes,
}) => {
  const quickTopics = [
    { topic: "DBMS Normalization", subject: "DBMS" },
    { topic: "Python Decorators", subject: "Python" },
    { topic: "Binary Search Trees", subject: "Data Structures" },
    { topic: "OS Deadlock Handling", subject: "Operating Systems" },
    { topic: "Backpropagation Algorithm", subject: "AI & ML" },
    { topic: "TCP/IP vs OSI Model", subject: "Computer Networks" },
  ];

  const features = [
    {
      icon: Sparkles,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
      title: "AI Notes Generation",
      desc: "Instantly turns any topic or complex chapter into clean, cohesive, multi-section notes with textbook rigor.",
    },
    {
      icon: FileCheck2,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
      title: "Exam-Oriented Notes",
      desc: "Specifically structured with definitions, 2/5/10-mark university questions, viva answers, and common exam traps.",
    },
    {
      icon: HelpCircle,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50",
      title: "AI Quiz Generator",
      desc: "Generates custom 4-choice interactive practice quizzes with immediate scoring and detailed explanations.",
    },
    {
      icon: FolderKanban,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50",
      title: "Subject Organization",
      desc: "Organized across core engineering and college subjects: Python, DBMS, OS, Networks, Math, AI/ML, and more.",
    },
    {
      icon: Download,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50",
      title: "PDF Export",
      desc: "One-click download of neatly formatted, printable study sheets ready to take to the examination hall.",
    },
    {
      icon: Bookmark,
      color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900/50",
      title: "Save Notes",
      desc: "Save notes to your personal library, review anytime offline, edit revisions, or track your learning progress.",
    },
    {
      icon: Target,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50",
      title: "Personalized Learning",
      desc: "Tailor notes by target difficulty, note style (quick revision vs in-depth), output length, and custom prompts.",
    },
    {
      icon: Zap,
      color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/50",
      title: "Fast Generation",
      desc: "Powered by Google Gemini 3.8 Flash for low-latency generation of comprehensive 15-module study packets.",
    },
  ];

  const noteSectionsSummary = [
    "1. Definition",
    "2. Simple Explanation",
    "3. Detailed Concepts",
    "4. Why / Where Used",
    "5. Syntax / Formulas",
    "6. Illustrative Example",
    "7. Clean Code Snippet",
    "8. Line Explanation",
    "9. Expected Output",
    "10. Real-Life Analogy",
    "11. Important Points",
    "12. Common Exam Pitfalls",
    "13. 2/5/10-Mark Questions",
    "14. Viva Voce Q&A",
    "15. Practice MCQs",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-gray-100 dark:border-gray-800">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.2),rgba(0,0,0,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Powered by Gemini 3.8 Flash • Built for College Students</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                Turn Any Topic Into{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  Smart, Exam-Ready Notes
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Generate clear, structured and personalized study notes with AI in seconds.
                Complete with definitions, real-world examples, runnable code, viva answers, and university exam questions.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  id="hero-generate-notes-btn"
                  onClick={() => onStartGenerate()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-98 transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Notes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="hero-explore-features-btn"
                  onClick={onExploreFeatures}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-base transition-all cursor-pointer"
                >
                  <span>Explore Features</span>
                </button>
              </div>

              {/* Quick Try Topics */}
              <div className="pt-4 text-left">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5 text-center lg:text-left">
                  Try Popular Exam Topics:
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  {quickTopics.map((item) => (
                    <button
                      key={item.topic}
                      onClick={() => onStartGenerate(item.topic, item.subject)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800/80 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    >
                      {item.topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Abstract Educational Graphic / Interactive Preview Illustration */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow backdrop */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-xl opacity-25" />

                {/* Main Card UI Preview */}
                <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-5">
                  {/* Top bar */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300 ml-2">DBMS_Normalization.pdf</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Exam Ready
                    </span>
                  </div>

                  {/* Note Mock Content */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        1. Textbook Definition
                      </span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        “Normalization is the systematic approach of decomposing tables to eliminate data redundancy and insertion, update, and deletion anomalies.”
                      </p>
                    </div>

                    {/* Mini code preview */}
                    <div className="rounded-lg bg-gray-900 p-3 text-[11px] font-mono text-emerald-400 space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between text-gray-500 text-[10px] pb-1 border-b border-gray-800">
                        <span>sql_schema.sql</span>
                        <Code2 className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <p><span className="text-purple-400">CREATE TABLE</span> Students_3NF (</p>
                      <p className="pl-3">student_id <span className="text-yellow-400">INT PRIMARY KEY</span>,</p>
                      <p className="pl-3">dept_id <span className="text-yellow-400">INT REFERENCES</span> Department(id)</p>
                      <p>);</p>
                    </div>

                    {/* Exam highlight badge */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <span className="font-semibold text-gray-900 dark:text-white block">2 & 5-Mark Qs</span>
                        <span className="text-gray-600 dark:text-gray-300 text-[10px]">3 University Questions included</span>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                        <span className="font-semibold text-gray-900 dark:text-white block">Viva Voce</span>
                        <span className="text-gray-600 dark:text-gray-300 text-[10px]">Short oral answers pre-computed</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating floating badges */}
                  <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" /> 15 Structured Sections
                    </span>
                    <button
                      onClick={() => onStartGenerate("DBMS Normalization", "DBMS")}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Generate this note →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-gray-50/70 dark:bg-gray-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Complete Academic Arsenal
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Everything You Need to Ace College Exams
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Engineered specifically for engineering, computer science, and university coursework to save hours of messy textbook skimming.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{feature.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The 15-Section Standard Blueprint */}
      <section className="py-20 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-gray-900 text-white p-8 sm:p-12 lg:p-16 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
              <GraduationCap className="w-96 h-96" />
            </div>

            <div className="max-w-3xl space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Award className="w-4 h-4 text-blue-400" />
                <span>Strict University Format Standard</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Never Miss an Exam Question Again
              </h3>

              <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
                Standard AI chat gives generic answers. Our generator is instructed with a comprehensive 15-section academic template:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {noteSectionsSummary.map((sec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-200 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sec}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onStartGenerate()}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-950 font-bold text-sm shadow-md transition-colors cursor-pointer"
                >
                  Generate 15-Section Notes
                </button>
                <button
                  onClick={onOpenMyNotes}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-colors cursor-pointer"
                >
                  View Saved Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
