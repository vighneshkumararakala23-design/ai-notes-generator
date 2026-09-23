import React, { useState } from "react";
import { X, Save, Check } from "lucide-react";
import { NoteContent } from "../types";

interface EditNoteModalProps {
  note: NoteContent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNote: NoteContent) => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onSave,
}) => {
  const [topicTitle, setTopicTitle] = useState(note.topicTitle);
  const [definition, setDefinition] = useState(note.definition);
  const [simpleExplanation, setSimpleExplanation] = useState(note.simpleExplanation);
  const [detailedExplanation, setDetailedExplanation] = useState(note.detailedExplanation);
  const [whyWhereUsed, setWhyWhereUsed] = useState(note.whyWhereUsed);
  const [syntax, setSyntax] = useState(note.syntax || "");
  const [code, setCode] = useState(note.code || "");
  const [codeExplanation, setCodeExplanation] = useState(note.codeExplanation || "");
  const [realLifeExample, setRealLifeExample] = useState(note.realLifeExample);
  const [importantPointsText, setImportantPointsText] = useState(
    note.importantPoints.join("\n")
  );
  const [commonMistakesText, setCommonMistakesText] = useState(
    note.commonMistakes.join("\n")
  );

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: NoteContent = {
      ...note,
      topicTitle,
      definition,
      simpleExplanation,
      detailedExplanation,
      whyWhereUsed,
      syntax: syntax || undefined,
      code: code || undefined,
      codeExplanation: codeExplanation || undefined,
      realLifeExample,
      importantPoints: importantPointsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      commonMistakes: commonMistakesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Study Notes</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Customize definitions, explanations, code, and key points to your preference.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {/* Topic Title */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Topic Title
            </label>
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Definition */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              1. Definition
            </label>
            <textarea
              rows={3}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Simple Explanation */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              2. Simple Explanation
            </label>
            <textarea
              rows={3}
              value={simpleExplanation}
              onChange={(e) => setSimpleExplanation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              3. Detailed Explanation
            </label>
            <textarea
              rows={4}
              value={detailedExplanation}
              onChange={(e) => setDetailedExplanation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Why Where Used */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              4. Why / Where It Is Used
            </label>
            <textarea
              rows={2}
              value={whyWhereUsed}
              onChange={(e) => setWhyWhereUsed(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Code */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              7. Code Snippet
            </label>
            <textarea
              rows={5}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-950 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Real Life Analogy */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              10. Real-Life Example
            </label>
            <textarea
              rows={2}
              value={realLifeExample}
              onChange={(e) => setRealLifeExample(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Important Points (one per line) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              11. Important Points (one per line)
            </label>
            <textarea
              rows={4}
              value={importantPointsText}
              onChange={(e) => setImportantPointsText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Common Mistakes (one per line) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              12. Common Mistakes (one per line)
            </label>
            <textarea
              rows={3}
              value={commonMistakesText}
              onChange={(e) => setCommonMistakesText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
