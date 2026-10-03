import React, { useState, useEffect } from "react";
import {
  Target,
  Copy,
  Check,
  RotateCcw,
  X,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { generateExamAnswerApi } from "../services/api";

type AnswerType = "2 Marks" | "5 Marks" | "10 Marks" | "Definition" | "Difference Between";

interface ExamAnswerModalProps {
  topic: string;
  subject: string;
  notesContext: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExamAnswerModal: React.FC<ExamAnswerModalProps> = ({
  topic,
  subject,
  notesContext,
  isOpen,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<AnswerType>("5 Marks");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cached answers per type to avoid redundant API calls
  const [cache, setCache] = useState<Partial<Record<AnswerType, string>>>({});

  const fetchAnswer = async (typeToFetch: AnswerType, forceRefresh = false) => {
    if (!forceRefresh && cache[typeToFetch]) {
      setAnswer(cache[typeToFetch]!);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await generateExamAnswerApi({
        topic,
        subject,
        answerType: typeToFetch,
        notesContext,
      });
      setAnswer(res.answer);
      setCache((prev) => ({ ...prev, [typeToFetch]: res.answer }));
    } catch (err: any) {
      console.error("Exam answer error:", err);
      setError(err?.message || "Failed to generate exam answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnswer(selectedType);
    }
  }, [isOpen]);

  const handleSelectType = (newType: AnswerType) => {
    setSelectedType(newType);
    fetchAnswer(newType);
  };

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const answerTypePills: { id: AnswerType; label: string; desc: string }[] = [
    { id: "2 Marks", label: "2 Marks", desc: "Crisp definition + 2 key scoring points (35-50 words)" },
    { id: "5 Marks", label: "5 Marks", desc: "Structured explanation + bullet points + example (120-180 words)" },
    { id: "10 Marks", label: "10 Marks", desc: "Detailed breakdown + architecture + example (280-400 words)" },
    { id: "Definition", label: "Definition", desc: "Academic 1-2 sentence definition" },
    { id: "Difference Between", label: "Difference Between", desc: "Structured comparison criteria & table" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-gray-850 dark:via-gray-850 dark:to-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <span>🎯 Exam Answer Generator</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Exam-ready model answer for: <strong className="text-gray-800 dark:text-gray-200">{topic}</strong>
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

        {/* Answer Type Selector Tabs */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850/60">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Select Exam Format:</span>
            <span>Target Weightage</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {answerTypePills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => handleSelectType(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === pill.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={pill.desc}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Content Display */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm leading-relaxed">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Drafting {selectedType} answer from your notes...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button
                onClick={() => fetchAnswer(selectedType, true)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-sans bg-gray-50/50 dark:bg-gray-850/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              {answer}
            </div>
          )}
        </div>

        {/* Modal Footer Controls: Copy Answer & Regenerate */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-850/40">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Based directly on your study notes
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAnswer(selectedType, true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
            <button
              onClick={handleCopy}
              disabled={loading || !answer}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Answer"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
