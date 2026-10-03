import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  X,
  Loader2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { explainSimplerApi } from "../services/api";

interface ExplainSimplerModalProps {
  topic: string;
  subject: string;
  initialConcept?: string;
  importantConcepts?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainSimplerModal: React.FC<ExplainSimplerModalProps> = ({
  topic,
  subject,
  initialConcept = "",
  importantConcepts = [],
  isOpen,
  onClose,
}) => {
  const [selectedConcept, setSelectedConcept] = useState<string>(
    initialConcept || topic
  );
  const [customInput, setCustomInput] = useState<string>("");
  const [explanation, setExplanation] = useState<{
    simplifiedExplanation: string;
    simpleExample: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cached explanations
  const [cache, setCache] = useState<
    Record<string, { simplifiedExplanation: string; simpleExample: string }>
  >({});

  const handleExplain = async (conceptToExplain: string) => {
    if (!conceptToExplain || !conceptToExplain.trim()) return;

    if (cache[conceptToExplain]) {
      setExplanation(cache[conceptToExplain]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await explainSimplerApi({
        conceptOrSection: conceptToExplain,
        topic,
        subject,
      });
      setExplanation(data);
      setCache((prev) => ({ ...prev, [conceptToExplain]: data }));
    } catch (err: any) {
      console.error("Explain simpler error:", err);
      setError(err?.message || "Failed to simplify concept.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const target = initialConcept || topic;
      setSelectedConcept(target);
      handleExplain(target);
    }
  }, [isOpen, initialConcept, topic]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!explanation) return;
    const text = `💡 Simplified Concept: ${selectedConcept}\n\n${explanation.simplifiedExplanation}\n\nExample: ${explanation.simpleExample}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-yellow-50/70 dark:from-gray-850 dark:via-gray-850 dark:to-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <span>💡 Explain Simpler</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Turn complex academic concepts into intuitive plain-English understanding
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

        {/* Quick Concept Chips (Feature 4: Important Concepts for Revision) */}
        {importantConcepts.length > 0 && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span>🔥</span>
                <span>Important Concepts (Click to explain):</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedConcept(topic);
                  handleExplain(topic);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedConcept === topic
                    ? "bg-amber-500 text-white font-bold shadow-xs"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700"
                }`}
              >
                ⭐ {topic} (Whole Topic)
              </button>
              {importantConcepts.map((concept, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedConcept(concept);
                    handleExplain(concept);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedConcept === concept
                      ? "bg-amber-500 text-white font-bold shadow-xs"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700"
                  }`}
                >
                  ⭐ {concept}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Query Input */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customInput.trim()) {
                setSelectedConcept(customInput.trim());
                handleExplain(customInput.trim());
                setCustomInput("");
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Or type any specific term, theorem, or phrase..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!customInput.trim() || loading}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Explain
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Explaining:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
                {selectedConcept}
              </span>
            </h4>
            {explanation && !loading && (
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Translating into plain English and intuitive real-world analogies...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          ) : explanation ? (
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Simple Explanation */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <span>✨</span>
                  <span>Simple Explanation</span>
                </span>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {explanation.simplifiedExplanation}
                </p>
              </div>

              {/* Simple Example / Analogy */}
              {explanation.simpleExample && (
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1">
                    <span>💡</span>
                    <span>Everyday Example / Analogy</span>
                  </span>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed italic">
                    "{explanation.simpleExample}"
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
