import React, { useState, useEffect } from "react";
import {
  Brain,
  X,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { teachMeInteractApi, TeachMeStepData } from "../services/api";
import { recordTopicCompleted } from "../services/storage";

interface TeachMeModalProps {
  topic: string;
  subject: string;
  notesContext: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TeachMeModal: React.FC<TeachMeModalProps> = ({
  topic,
  subject,
  notesContext,
  isOpen,
  onClose,
}) => {
  const [stepData, setStepData] = useState<TeachMeStepData | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [studentInput, setStudentInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [history, setHistory] = useState<
    {
      concept: string;
      explanation: string;
      question: string;
      studentAnswer?: string;
      feedback?: string;
    }[]
  >([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = async () => {
    setLoading(true);
    setError(null);
    setCurrentStep(1);
    setHistory([]);
    setIsFinished(false);
    setStudentInput("");
    setShowHint(false);

    try {
      const data = await teachMeInteractApi({
        topic,
        subject,
        notesContext,
        stepNumber: 1,
        totalSteps: 4,
      });
      setStepData(data);
    } catch (err: any) {
      console.error("Teach Me start error:", err);
      setError(err?.message || "Failed to start interactive tutor session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startSession();
    }
  }, [isOpen]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim() || !stepData || loading) return;

    const answer = studentInput.trim();
    setStudentInput("");
    setShowHint(false);
    setLoading(true);
    setError(null);

    try {
      const nextStepNum = currentStep + 1;
      const res = await teachMeInteractApi({
        topic,
        subject,
        notesContext,
        stepNumber: nextStepNum,
        totalSteps: 4,
        studentAnswer: answer,
        previousQuestion: stepData.question,
        previousConcept: stepData.conceptTitle,
      });

      // Record history
      setHistory((prev) => [
        ...prev,
        {
          concept: stepData.conceptTitle,
          explanation: stepData.conceptExplanation,
          question: stepData.question,
          studentAnswer: answer,
          feedback: res.feedbackOnPrevious || "Great effort! Moving forward.",
        },
      ]);

      if (currentStep >= 4 || res.isFinalStep) {
        setIsFinished(true);
        recordTopicCompleted();
      } else {
        setCurrentStep(nextStepNum);
        setStepData(res);
      }
    } catch (err: any) {
      console.error("Teach Me next step error:", err);
      setError(err?.message || "Failed to process answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/70 dark:from-gray-850 dark:via-gray-850 dark:to-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <span>🧠 Teach Me Mode</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Interactive Socratic Tutor
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Topic: <strong className="text-gray-800 dark:text-gray-200">{topic}</strong> • Step {isFinished ? 4 : currentStep} of 4
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

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5">
          <div
            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-1.5 transition-all duration-300"
            style={{ width: `${isFinished ? 100 : (currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Conversation Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* Previous Interaction History */}
          {history.map((item, idx) => (
            <div key={idx} className="space-y-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              {/* Concept */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300">
                <span className="font-bold text-gray-900 dark:text-white">Concept {idx + 1}: {item.concept}</span>
                <p className="mt-1 text-xs">{item.explanation}</p>
              </div>

              {/* Question */}
              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 pl-1">
                <span>❓ Question:</span>
                <span>{item.question}</span>
              </div>

              {/* Student Answer */}
              {item.studentAnswer && (
                <div className="flex justify-end">
                  <div className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs max-w-sm font-medium">
                    {item.studentAnswer}
                  </div>
                </div>
              )}

              {/* Tutor Feedback */}
              {item.feedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{item.feedback}</span>
                </div>
              )}
            </div>
          ))}

          {/* Current Active Step */}
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-purple-600 mx-auto" />
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Tutor is preparing the next concept...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button
                onClick={startSession}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
              >
                Restart Session
              </button>
            </div>
          ) : isFinished ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Lesson Complete! 🎉
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  You successfully walked through the fundamental concepts of <strong>{topic}</strong> with the tutor.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={startSession}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Practice Again
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : stepData ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Concept Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/60 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-purple-800 dark:text-purple-300">
                    Step {currentStep}: {stepData.conceptTitle}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Tutor Explanation
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {stepData.conceptExplanation}
                </p>
              </div>

              {/* Socratic Question */}
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border-2 border-purple-300 dark:border-purple-800 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900 dark:text-purple-200">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span>Tutor Question:</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {stepData.question}
                </p>
                {stepData.hint && (
                  <div className="pt-1">
                    {showHint ? (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
                        💡 Hint: {stepData.hint}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Need a hint?</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Input Bar (When not finished) */}
        {!isFinished && !loading && stepData && (
          <form
            onSubmit={handleSubmitAnswer}
            className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850/80 flex gap-2"
          >
            <input
              type="text"
              placeholder="Type your answer in plain English..."
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={!studentInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Answer</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
