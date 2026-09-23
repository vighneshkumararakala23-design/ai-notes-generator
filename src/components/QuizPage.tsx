import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlusCircle,
  AlertCircle,
  Award,
  BookOpen,
  ArrowRight,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { QuizData, QuizQuestion, SubjectType } from "../types";
import { generateQuizApi } from "../services/api";
import { recordQuizAttempt } from "../services/storage";

interface QuizPageProps {
  initialTopic?: string;
  initialSubject?: SubjectType;
  onNavigateToNotes?: (topic: string, subject: string) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({
  initialTopic = "",
  initialSubject = "DBMS",
  onNavigateToNotes,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState<SubjectType>(initialSubject);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("Intermediate");

  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialSubject) setSubject(initialSubject);
  }, [initialTopic, initialSubject]);

  const handleStartGenerateQuiz = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = topic.trim();
    if (!trimmed) {
      setValidationError("Please enter a topic to test yourself on.");
      return;
    }
    if (trimmed.length < 2) {
      setValidationError("Please enter a valid topic name (at least 2 characters).");
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    setUserAnswers({});
    setIsSubmitted(false);

    try {
      const data = await generateQuizApi({
        topic: trimmed,
        subject,
        questionCount,
        difficulty,
      });
      setQuizData(data);
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      setApiError(err?.message || "Failed to generate quiz. Please try a different topic or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    if (!quizData) return;

    let correctCount = 0;
    quizData.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / quizData.questions.length) * 100);

    // Save to history & stats
    recordQuizAttempt({
      quizTitle: quizData.quizTitle,
      topic: quizData.topic,
      subject: quizData.subject,
      difficulty: quizData.difficulty || difficulty,
      totalQuestions: quizData.questions.length,
      score: correctCount,
      percentage,
      userAnswers,
    });

    setIsSubmitted(true);

    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback if canvas-confetti is restricted
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTryAgain = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewQuiz = () => {
    setQuizData(null);
    setUserAnswers({});
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate score if submitted
  const score = quizData
    ? quizData.questions.reduce((acc, q) => (userAnswers[q.id] === q.correctAnswer ? acc + 1 : acc), 0)
    : 0;
  const percentage = quizData ? Math.round((score / quizData.questions.length) * 100) : 0;
  const answeredCount = Object.keys(userAnswers).length;
  const allAnswered = quizData ? answeredCount === quizData.questions.length : false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Interactive Exam Simulator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          AI Quiz Generator
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Test your conceptual understanding with AI-generated university exam questions and instant feedback.
        </p>
      </div>

      {/* Configuration Form (shown when no active quiz or after clicking New Quiz) */}
      {!quizData && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-md transition-colors space-y-6">
          <form onSubmit={handleStartGenerateQuiz} className="space-y-5">
            {/* Topic Input */}
            <div className="space-y-1.5">
              <label htmlFor="quiz-topic-input" className="block text-sm font-semibold text-gray-900 dark:text-white">
                Quiz Topic <span className="text-rose-500">*</span>
              </label>
              <input
                id="quiz-topic-input"
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isLoading}
                placeholder="e.g., DBMS Normalization, Binary Trees, Python List Comprehensions..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {validationError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 pt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Subject, Question Count, Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Subject */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectType)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="Python">Python</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="DBMS">DBMS</option>
                  <option value="AI & ML">AI & ML</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="C/C++">C/C++</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value={5}>5 Questions (Quick Test)</option>
                  <option value={10}>10 Questions (Full Mock)</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="Beginner">Beginner (Basic Concept)</option>
                  <option value="Intermediate">Intermediate (Semester Level)</option>
                  <option value="Advanced">Advanced (Gate / Competitive)</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {apiError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                {apiError}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    <span>Generating Quiz Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Quiz Card */}
      {quizData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  {quizData.subject}
                </span>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {quizData.difficulty || difficulty} • {quizData.questions.length} Questions
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                {quizData.quizTitle || `${quizData.topic} Quiz`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNewQuiz}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                New Quiz
              </button>
              {onNavigateToNotes && (
                <button
                  onClick={() => onNavigateToNotes(quizData.topic, quizData.subject)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Notes</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Banner (When Submitted) */}
          {isSubmitted && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-lg text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Quiz Completed
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                  Score: {score} / {quizData.questions.length} ({percentage}%)
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {percentage >= 80
                    ? "Outstanding mastery! You have strong conceptual command of this exam topic."
                    : percentage >= 60
                    ? "Good attempt! Review the explanations below to refine tricky areas."
                    : "Needs revision. Review the questions with wrong answers and check the notes."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleTryAgain}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={handleNewQuiz}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Generate New Quiz</span>
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-5">
            {quizData.questions.map((q, idx) => {
              const selectedOpt = userAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = selectedOpt === q.correctAnswer;

              return (
                <div
                  key={q.id || idx}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4 transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                      : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </p>

                    {isSubmitted && (
                      <span className="shrink-0">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((option, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = selectedOpt === optIdx;
                      const isCorrectChoice = optIdx === q.correctAnswer;

                      let buttonStyle =
                        "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-700";

                      if (!isSubmitted && isSelected) {
                        buttonStyle =
                          "border-purple-600 bg-purple-50 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 ring-2 ring-purple-500/20 font-semibold";
                      }

                      if (isSubmitted) {
                        if (isCorrectChoice) {
                          buttonStyle =
                            "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/30";
                        } else if (isSelected && !isCorrectChoice) {
                          buttonStyle =
                            "border-rose-400 bg-rose-50 dark:bg-rose-950 text-rose-950 dark:text-rose-200 font-semibold line-through";
                        } else {
                          buttonStyle = "border-gray-200 dark:border-gray-800 text-gray-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer ${buttonStyle}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? "bg-purple-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {isSubmitted && q.explanation && (
                    <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 text-xs text-purple-950 dark:text-purple-200 leading-relaxed">
                      <span className="font-bold">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Submit Action */}
          {!isSubmitted && (
            <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-lg flex items-center justify-between gap-4">
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Answered: <span className="font-bold text-purple-600">{answeredCount}</span> of{" "}
                <span className="font-bold">{quizData.questions.length}</span> questions
              </div>

              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={answeredCount === 0}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
                  answeredCount > 0
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 active:scale-98"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                }`}
              >
                Submit Answers & Show Score
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
