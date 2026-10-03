import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Award,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { generatePracticeQuestionsApi, PracticeQuizData, PracticeQuestion } from "../services/api";
import { recordQuizAttempt } from "../services/storage";

type PracticeType = "5_mcq" | "10_mcq" | "true_false" | "short_answer";

interface PracticeQuizModalProps {
  topic: string;
  subject: string;
  notesContext: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToNotes?: () => void;
}

export const PracticeQuizModal: React.FC<PracticeQuizModalProps> = ({
  topic,
  subject,
  notesContext,
  isOpen,
  onClose,
  onNavigateToNotes,
}) => {
  const [selectedType, setSelectedType] = useState<PracticeType>("5_mcq");
  const [quizData, setQuizData] = useState<PracticeQuizData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // User answers state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [revealedShort, setRevealedShort] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const fetchPractice = async (type: PracticeType) => {
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    setShortAnswers({});
    setRevealedShort({});
    setIsSubmitted(false);

    try {
      const data = await generatePracticeQuestionsApi({
        topic,
        subject,
        practiceType: type,
        notesContext,
      });
      setQuizData(data);
    } catch (err: any) {
      console.error("Practice generation error:", err);
      setError(err?.message || "Failed to generate practice questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPractice(selectedType);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectOption = (qId: number, optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    const questions = quizData.questions;
    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    const percentage = Math.round((correct / questions.length) * 100);
    return { correct, total: questions.length, percentage };
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    if (quizData && selectedType !== "short_answer") {
      const { correct, total, percentage } = calculateScore();
      recordQuizAttempt({
        quizTitle: quizData.practiceTitle || `${topic} Practice`,
        topic,
        subject,
        difficulty: "Intermediate",
        totalQuestions: total,
        score: correct,
        percentage,
        userAnswers: selectedAnswers,
      });
    }
  };

  // Find missed topic tags that need revision
  const getTopicsNeedingRevision = () => {
    if (!quizData) return [];
    const missedTags = new Set<string>();
    quizData.questions.forEach((q) => {
      if (selectedAnswers[q.id] !== q.correctAnswer) {
        if (q.topicTag) missedTags.add(q.topicTag);
      }
    });
    return Array.from(missedTags);
  };

  const typeTabs: { id: PracticeType; label: string; desc: string }[] = [
    { id: "5_mcq", label: "5 MCQs", desc: "Quick 5-question multiple choice test" },
    { id: "10_mcq", label: "10 MCQs", desc: "Comprehensive 10-question evaluation" },
    { id: "true_false", label: "True / False", desc: "6 rapid concept verification questions" },
    { id: "short_answer", label: "Short Answer", desc: "5 university-style subjective exam prompts" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-blue-50/70 dark:from-gray-850 dark:via-gray-850 dark:to-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <span>🧪 Practice & Quiz Mode</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generated from notes on: <strong className="text-gray-800 dark:text-gray-200">{topic}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Practice Type Options */}
        <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {typeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedType(tab.id);
                  fetchPractice(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchPractice(selectedType)}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title="Regenerate questions"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Generating questions directly from your notes...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button
                onClick={() => fetchPractice(selectedType)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
              >
                Retry
              </button>
            </div>
          ) : quizData ? (
            <>
              {/* Score Banner (After Submit) */}
              {isSubmitted && selectedType !== "short_answer" && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-400 dark:border-emerald-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                          Your Score: {calculateScore().correct} / {calculateScore().total} ({calculateScore().percentage}%)
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {calculateScore().percentage >= 80
                            ? "Outstanding mastery! Ready for exam."
                            : calculateScore().percentage >= 60
                            ? "Good effort! Review the missed concepts below."
                            : "Keep revising! Check the explanations below."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Topics needing revision */}
                  {getTopicsNeedingRevision().length > 0 && (
                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        📌 Recommended Topics for Revision:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {getTopicsNeedingRevision().map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold border border-amber-300 dark:border-amber-800"
                          >
                            ⚠️ {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {quizData.questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCorrect = selectedAnswers[q.id] === q.correctAnswer;

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-850/60 border border-gray-200 dark:border-gray-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                          {idx + 1}. {q.question}
                        </span>
                        {q.topicTag && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                            {q.topicTag}
                          </span>
                        )}
                      </div>

                      {/* Multiple Choice / True False Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedAnswers[q.id] === optIdx;
                            let btnStyle = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750";

                            if (isSubmitted) {
                              if (optIdx === q.correctAnswer) {
                                btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold";
                              } else if (isSelected) {
                                btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 line-through";
                              }
                            } else if (isSelected) {
                              btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs";
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectOption(q.id, optIdx)}
                                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isSubmitted && optIdx === q.correctAnswer && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {isSubmitted && isSelected && optIdx !== q.correctAnswer && (
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Short Answer Input & Reveal */}
                      {selectedType === "short_answer" && (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            placeholder="Write your brief conceptual response here..."
                            value={shortAnswers[q.id] || ""}
                            onChange={(e) =>
                              setShortAnswers({ ...shortAnswers, [q.id]: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedShort({ ...revealedShort, [q.id]: !revealedShort[q.id] })
                            }
                            className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            {revealedShort[q.id] ? "Hide Ideal Answer" : "💡 Reveal Model Answer & Scoring Points"}
                          </button>
                          {revealedShort[q.id] && (
                            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200">
                              <span className="font-bold">Model Answer: </span>
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation (After Submit) */}
                      {isSubmitted && selectedType !== "short_answer" && (
                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-gray-900 dark:text-white">Explanation: </span>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-850/80">
          <div className="text-xs text-gray-500">
            {quizData ? `${quizData.questions.length} questions` : ""}
          </div>
          <div className="flex items-center gap-2">
            {!isSubmitted && selectedType !== "short_answer" ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={loading || !quizData}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Submit Answers
              </button>
            ) : (
              <button
                onClick={() => fetchPractice(selectedType)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Another Set</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
