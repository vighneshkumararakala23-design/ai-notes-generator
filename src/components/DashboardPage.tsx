import React from "react";
import {
  FileText,
  Bookmark,
  HelpCircle,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { NoteContent, QuizAttemptRecord, StudentStats } from "../types";

interface DashboardPageProps {
  stats: StudentStats;
  recentNotes: NoteContent[];
  savedNotes: NoteContent[];
  quizHistory: QuizAttemptRecord[];
  onNavigateToGenerate: () => void;
  onNavigateToQuiz: () => void;
  onNavigateToMyNotes: () => void;
  onOpenNote: (note: NoteContent) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  recentNotes,
  savedNotes,
  quizHistory,
  onNavigateToGenerate,
  onNavigateToQuiz,
  onNavigateToMyNotes,
  onOpenNote,
}) => {
  const statCards = [
    {
      title: "Notes Generated",
      value: stats.notesGenerated || recentNotes.length,
      icon: Sparkles,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/50",
      label: "Total AI study packets built",
    },
    {
      title: "Notes Saved",
      value: stats.notesSaved || savedNotes.length,
      icon: Bookmark,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/50",
      label: "Bookmarked in your library",
    },
    {
      title: "Quizzes Completed",
      value: stats.quizzesCompleted || quizHistory.length,
      icon: HelpCircle,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900/50",
      label: "Interactive practice sessions",
    },
    {
      title: "Average Quiz Score",
      value: stats.averageQuizScore ? `${stats.averageQuizScore}%` : "—",
      icon: Award,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/50",
      label: "Overall accuracy rate",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
            <span>Semester Academic Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back 👋
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
            Your personal AI study console. Review your saved exam cheat-sheets, track quiz performance, and prepare for exams faster.
          </p>

          {/* Quick Actions in Banner */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={onNavigateToGenerate}
              className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Notes</span>
            </button>
            <button
              onClick={onNavigateToQuiz}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Take Quiz</span>
            </button>
            <button
              onClick={onNavigateToMyNotes}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>My Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{card.title}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Notes & Recent Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Notes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Notes</h2>
            </div>
            <button
              onClick={onNavigateToMyNotes}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.slice(0, 5).map((note, idx) => (
                <div
                  key={note.id || idx}
                  onClick={() => onOpenNote(note)}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {note.subject}
                      </span>
                      <span className="text-[11px] text-gray-600 dark:text-gray-300">{note.difficulty}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                      {note.topicTitle}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">{note.definition}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No notes generated yet</p>
              <button
                onClick={onNavigateToGenerate}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Generate your first notes →
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Quizzes & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Quizzes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Quizzes</h2>
              </div>
              <button
                onClick={onNavigateToQuiz}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Take Quiz</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {quizHistory.length > 0 ? (
              <div className="space-y-2.5">
                {quizHistory.slice(0, 4).map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                        {q.topic}
                      </h4>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300">
                        {q.subject} • {q.totalQuestions} Questions
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          q.percentage >= 80
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : q.percentage >= 50
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {q.score}/{q.totalQuestions} ({q.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-xs text-gray-500">No quiz attempts yet.</p>
                <button
                  onClick={onNavigateToQuiz}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Start a practice quiz →
                </button>
              </div>
            )}
          </div>

          {/* Quick Study Actions Panel */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={onNavigateToGenerate}
                className="w-full text-left p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:border-blue-500 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Generate Notes for an Exam</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={onNavigateToQuiz}
                className="w-full text-left p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:border-purple-500 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Test Yourself with a 5-Q Quiz</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={onNavigateToMyNotes}
                className="w-full text-left p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:border-emerald-500 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Review Saved PDF Sheets</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
