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
      title: "Topics Studied",
      value: stats.topicsStudied || (recentNotes.length + savedNotes.length ? Math.max(recentNotes.length, savedNotes.length) : 0),
      icon: BookOpen,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/50",
      label: "Unique topics explored",
    },
    {
      title: "Notes Generated",
      value: stats.notesGenerated || recentNotes.length,
      icon: Sparkles,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/50",
      label: "Total study packets created",
    },
    {
      title: "Revision Sheets",
      value: stats.revisionSheetsCreated || savedNotes.filter((n) => n.handwrittenSheet || n.revisionSheet).length,
      icon: FileText,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/50",
      label: "1-page handwritten sheets",
    },
    {
      title: "Quizzes Completed",
      value: stats.quizzesCompleted || quizHistory.length,
      icon: HelpCircle,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900/50",
      label: "Practice tests taken",
    },
    {
      title: "Average Quiz Score",
      value: stats.averageQuizScore ? `${stats.averageQuizScore}%` : "—",
      icon: Award,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/50",
      label: "Actual performance average",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📊</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              My Study Progress
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Real tracked progress across all your topics, notes, handwritten sheets, and quiz scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToGenerate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Notes</span>
          </button>
          <button
            onClick={onNavigateToQuiz}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* 5 Real Study Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{card.title}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{card.label}</p>
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
