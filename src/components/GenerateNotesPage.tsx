import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Layers,
  GraduationCap,
  AlignLeft,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  Brain,
  HelpCircle,
} from "lucide-react";
import {
  SubjectType,
  DifficultyLevel,
  NoteType,
  OutputLength,
  NoteContent,
} from "../types";
import { generateNotesApi } from "../services/api";
import { addRecentNote, saveNote } from "../services/storage";

interface GenerateNotesPageProps {
  onNotesGenerated: (note: NoteContent) => void;
  initialTopic?: string;
  initialSubject?: SubjectType;
}

export const GenerateNotesPage: React.FC<GenerateNotesPageProps> = ({
  onNotesGenerated,
  initialTopic = "",
  initialSubject = "DBMS",
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState<SubjectType>(initialSubject);
  const [customSubject, setCustomSubject] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [noteType, setNoteType] = useState<NoteType>("Exam Preparation");
  const [outputLength, setOutputLength] = useState<OutputLength>("Detailed");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialTopic, initialSubject]);

  const loadingSteps = [
    { title: "Analyzing topic & academic syllabus...", icon: BookOpen },
    { title: "Structuring 15 exam-standard sections...", icon: Layers },
    { title: "Formulating definitions & real-world analogies...", icon: Brain },
    { title: "Formatting clean code, viva answers & MCQs...", icon: Sparkles },
    { title: "Finalizing high-yield study sheet...", icon: CheckCircle },
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2400);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    if (validationError) setValidationError(null);
    if (errorMessage) setErrorMessage(null);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setValidationError("Please enter a topic to generate notes.");
      return;
    }

    if (trimmedTopic.length < 2) {
      setValidationError("Please provide a meaningful topic name (at least 2 characters).");
      return;
    }

    setValidationError(null);
    setErrorMessage(null);
    setIsLoading(true);

    const targetSubject = subject === "Other" && customSubject.trim() ? customSubject.trim() : subject;

    try {
      const result = await generateNotesApi({
        topic: trimmedTopic,
        subject: targetSubject,
        difficulty,
        noteType,
        outputLength,
        additionalInstructions: additionalInstructions.trim() || undefined,
      });

      // Save to recent notes history
      addRecentNote(result);

      // Auto save or forward to display view
      onNotesGenerated(result);
    } catch (err: any) {
      console.error("Note generation error:", err);
      setErrorMessage(
        err?.message ||
          "Gemini returned an unexpected response. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sampleChips = [
    { t: "DBMS Normalization (1NF, 2NF, 3NF, BCNF)", s: "DBMS" as SubjectType },
    { t: "Binary Search Tree Operations & Traversals", s: "Data Structures" as SubjectType },
    { t: "Python Generators and Iterators", s: "Python" as SubjectType },
    { t: "Operating System Deadlock Prevention & Bankers Algorithm", s: "Operating Systems" as SubjectType },
    { t: "TCP 3-Way Handshake vs UDP", s: "Computer Networks" as SubjectType },
    { t: "Gradient Descent and Backpropagation", s: "AI & ML" as SubjectType },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>15-Module Academic Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Generate Smart Study Notes
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Specify your subject, topic, and difficulty to generate exam-oriented notes, viva answers, and practice MCQs.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md p-6 sm:p-8 transition-colors">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Topic input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="topic-input" className="block text-sm font-semibold text-gray-900 dark:text-white">
                Topic <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-gray-600 dark:text-gray-300">e.g., DBMS Normalization</span>
            </div>

            <div className="relative">
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={handleTopicChange}
                placeholder="Enter your topic (e.g. DBMS Normalization, Python Decorators, AVL Trees...)"
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border text-sm sm:text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/60 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 transition-all ${
                  validationError
                    ? "border-rose-300 dark:border-rose-700 focus:ring-rose-500"
                    : "border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
            </div>

            {/* Validation warning */}
            {validationError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Sample topic quick chips */}
            <div className="pt-2">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1.5">Quick Suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {sampleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setTopic(chip.t);
                      setSubject(chip.s);
                      if (validationError) setValidationError(null);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300 border border-gray-200/80 dark:border-gray-700 transition-colors cursor-pointer"
                  >
                    {chip.t.split("(")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject & Difficulty row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="subject-select" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <select
                id="subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectType)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

              {subject === "Other" && (
                <input
                  type="text"
                  placeholder="Specify subject name (e.g. Software Engineering)"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  disabled={isLoading}
                  className="mt-2 w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label htmlFor="difficulty-select" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Difficulty Level
              </label>
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Beginner">Beginner (Foundational)</option>
                <option value="Intermediate">Intermediate (Semester Standard)</option>
                <option value="Advanced">Advanced (Deep Dive / Competitive)</option>
              </select>
            </div>
          </div>

          {/* Note Type & Output Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Note Type */}
            <div className="space-y-1.5">
              <label htmlFor="notetype-select" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Note Type
              </label>
              <select
                id="notetype-select"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as NoteType)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Quick Revision">Quick Revision (Crisp & High-Yield)</option>
                <option value="Detailed Notes">Detailed Notes (Full Concept Depth)</option>
                <option value="Exam Preparation">Exam Preparation (Standard University Format)</option>
                <option value="Interview Preparation">Interview Preparation (Viva & Questions)</option>
                <option value="Beginner Friendly">Beginner Friendly (Intuitive Analogies)</option>
              </select>
            </div>

            {/* Output Length */}
            <div className="space-y-1.5">
              <label htmlFor="output-length-select" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Output Length
              </label>
              <select
                id="output-length-select"
                value={outputLength}
                onChange={(e) => setOutputLength(e.target.value as OutputLength)}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Short">Short (Summary & Key Points)</option>
                <option value="Medium">Medium (Balanced)</option>
                <option value="Detailed">Detailed (Comprehensive 15 Sections)</option>
              </select>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-1.5">
            <label htmlFor="instructions-textarea" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Additional Instructions (Optional)
            </label>
            <textarea
              id="instructions-textarea"
              rows={3}
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              disabled={isLoading}
              placeholder="Tell AI anything specific you want... (e.g. 'Explain using simple language and real-life examples', 'Focus on time complexity', or 'Include C++ code with pointers')"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error Banner with Retry */}
          {errorMessage && (
            <div className="rounded-xl p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Generation could not be completed</p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              id="generate-notes-submit-btn"
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isLoading
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.99]"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>✨ Generating your notes…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>✨ Generate Notes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading Progress State */}
        {isLoading && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 animate-in fade-in duration-300">
            <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    AI Pedagogical Processor Active
                  </span>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                  Step {loadingStep + 1} of {loadingSteps.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>

              {/* Active step readout */}
              <div className="flex items-center gap-2.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                {React.createElement(loadingSteps[loadingStep].icon, {
                  className: "w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0",
                })}
                <span>{loadingSteps[loadingStep].title}</span>
              </div>

              <p className="text-[11px] text-gray-600 dark:text-gray-300 italic">
                Tip: Writing 15 structured sections including 2, 5, 10-mark exam questions, real-life analogies, and viva voce Q&A.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
