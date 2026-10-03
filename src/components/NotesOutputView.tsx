import React, { useState } from "react";
import {
  Copy,
  Check,
  Edit3,
  Save,
  Download,
  RotateCcw,
  HelpCircle,
  Share2,
  BookOpen,
  Code,
  Terminal,
  Lightbulb,
  AlertTriangle,
  GraduationCap,
  ListChecks,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Sparkles,
  Send,
  Loader2,
  X,
  Brain,
  Zap,
} from "lucide-react";
import { NoteContent, AskAiMessage, HandwrittenSheetData } from "../types";
import { downloadNotesAsPdf } from "../utils/exportPdf";
import { saveNote } from "../services/storage";
import {
  explainSimplerApi,
  showExampleApi,
  generateExamQuestionsApi,
  generateVivaQuestionsApi,
  generateRevisionSheetApi,
  generateHandwrittenSheetApi,
  askAiApi,
} from "../services/api";
import { HandwrittenRevisionSheet } from "./HandwrittenRevisionSheet";
import { ExamAnswerModal } from "./ExamAnswerModal";
import { ExplainSimplerModal } from "./ExplainSimplerModal";
import { TeachMeModal } from "./TeachMeModal";
import { PracticeQuizModal } from "./PracticeQuizModal";
import { recordRevisionSheetCreated } from "../services/storage";

interface NotesOutputViewProps {
  note: NoteContent;
  onRegenerate: () => void;
  onGenerateQuizForTopic: (topic: string, subject: string) => void;
  onEditNote: (updatedNote: NoteContent) => void;
}

export const NotesOutputView: React.FC<NotesOutputViewProps> = ({
  note,
  onRegenerate,
  onGenerateQuizForTopic,
  onEditNote,
}) => {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Interactive MCQs practice states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showMCQExplanations, setShowMCQExplanations] = useState<Record<number, boolean>>({});

  // Accordion states for Viva & Exam Qs
  const [openVivaIndex, setOpenVivaIndex] = useState<Record<number, boolean>>({ 0: true });

  // 5. Explain Simpler inline storage: key -> { simplified: string; example: string; loading: boolean }
  const [simplifiedSections, setSimplifiedSections] = useState<
    Record<string, { simplified: string; example: string; loading: boolean }>
  >({});

  // 6. Show Example inline storage: key -> { example: string; why: string; loading: boolean }
  const [onDemandExamples, setOnDemandExamples] = useState<
    Record<string, { example: string; why: string; loading: boolean }>
  >({});

  // 7. AI Study Tools separate loading states
  const [loadingExamQuestions, setLoadingExamQuestions] = useState(false);
  const [loadingViva, setLoadingViva] = useState(false);
  const [loadingRevisionSheet, setLoadingRevisionSheet] = useState(false);
  const [revisionSheetModal, setRevisionSheetModal] = useState<string | null>(note.revisionSheet || null);

  // NEW FEATURE: One-Page Handwritten Revision Sheet State
  const [showHandwrittenSheet, setShowHandwrittenSheet] = useState(false);
  const [loadingHandwritten, setLoadingHandwritten] = useState(false);
  const [handwrittenData, setHandwrittenData] = useState<HandwrittenSheetData | null>(
    note.handwrittenSheet || null
  );

  // Modals for AI Study Assistant tools
  const [isExamAnswerOpen, setIsExamAnswerOpen] = useState(false);
  const [isExplainSimplerOpen, setIsExplainSimplerOpen] = useState(false);
  const [explainSimplerConcept, setExplainSimplerConcept] = useState<string>("");
  const [isTeachMeOpen, setIsTeachMeOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);

  const handleOpenHandwrittenSheet = async () => {
    if (handwrittenData) {
      setShowHandwrittenSheet(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoadingHandwritten(true);
    try {
      const context = `Title: ${note.topicTitle}
Subject: ${note.subject}
Definition: ${note.definition}
Explanation: ${note.simpleExplanation}
Key Points: ${(note.importantPoints || []).join("\n- ")}
How It Works: ${note.howItWorks || note.detailedExplanation || ""}
Example: ${note.example || ""}
Code: ${note.code || ""}
Important Notes: ${(note.importantNotes || []).join("\n- ")}
Mistakes: ${(note.commonMistakes || []).join("\n- ")}`;

      const data = await generateHandwrittenSheetApi({
        topic: note.topicTitle,
        subject: note.subject,
        notesContext: context,
        existingNote: note,
      });

      setHandwrittenData(data);
      recordRevisionSheetCreated();
      onEditNote({
        ...note,
        handwrittenSheet: data,
      });
      setShowHandwrittenSheet(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Handwritten extraction error:", err);
      // Instant smart fallback from current note data so user is never blocked
      const fallbackData: HandwrittenSheetData = {
        title: note.topicTitle,
        subject: note.subject,
        definition: note.definition,
        keyPoints: note.importantPoints?.slice(0, 6) || ["Core academic concept and properties"],
        formulaOrRules: note.importantNotes?.slice(0, 3) || ["Key exam condition and rule"],
        tinyExample: note.example ? note.example.slice(0, 100) : undefined,
        codeSnippet: note.code ? note.code.slice(0, 150) : undefined,
        examTips: note.commonMistakes?.slice(0, 3) || ["State definitions precisely in exam answer"],
        mustRememberKeywords: note.importantConcepts || [note.topicTitle, "Core Concept"],
      };
      setHandwrittenData(fallbackData);
      setShowHandwrittenSheet(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoadingHandwritten(false);
    }
  };

  // 9. Ask AI About Notes state
  const [askAiQuery, setAskAiQuery] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [chatMessages, setChatMessages] = useState<AskAiMessage[]>([]);

  const handleExplainSimpler = async (key: string, textToSimplify: string) => {
    if (simplifiedSections[key]?.simplified) {
      // Toggle off if already showing
      setSimplifiedSections((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }

    setSimplifiedSections((prev) => ({
      ...prev,
      [key]: { simplified: "", example: "", loading: true },
    }));

    try {
      const res = await explainSimplerApi({
        conceptOrSection: textToSimplify,
        topic: note.topicTitle,
        subject: note.subject,
      });
      setSimplifiedSections((prev) => ({
        ...prev,
        [key]: {
          simplified: res.simplifiedExplanation,
          example: res.simpleExample,
          loading: false,
        },
      }));
    } catch {
      setSimplifiedSections((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleShowExample = async (key: string, conceptName: string) => {
    if (onDemandExamples[key]?.example) {
      setOnDemandExamples((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }

    setOnDemandExamples((prev) => ({
      ...prev,
      [key]: { example: "", why: "", loading: true },
    }));

    try {
      const res = await showExampleApi({
        concept: conceptName,
        topic: note.topicTitle,
        subject: note.subject,
      });
      setOnDemandExamples((prev) => ({
        ...prev,
        [key]: {
          example: res.example,
          why: res.whyItRepresents,
          loading: false,
        },
      }));
    } catch {
      setOnDemandExamples((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleGenerateExamQuestions = async () => {
    if (loadingExamQuestions) return;
    setLoadingExamQuestions(true);
    try {
      const context = `${note.definition}\n${note.simpleExplanation}\n${note.importantPoints?.join("; ")}`;
      const res = await generateExamQuestionsApi({
        topic: note.topicTitle,
        subject: note.subject,
        notesContext: context,
      });
      onEditNote({
        ...note,
        examQuestions: res,
      });
      setTimeout(() => {
        document.getElementById("section-exam-questions")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error("Exam questions error:", err);
    } finally {
      setLoadingExamQuestions(false);
    }
  };

  const handleGenerateVivaQuestions = async () => {
    if (loadingViva) return;
    setLoadingViva(true);
    try {
      const context = `${note.definition}\n${note.simpleExplanation}\n${note.importantPoints?.join("; ")}`;
      const res = await generateVivaQuestionsApi({
        topic: note.topicTitle,
        subject: note.subject,
        notesContext: context,
      });
      onEditNote({
        ...note,
        vivaQuestions: res,
      });
      setTimeout(() => {
        document.getElementById("section-viva-questions")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error("Viva error:", err);
    } finally {
      setLoadingViva(false);
    }
  };

  const handleGenerateRevisionSheet = async () => {
    if (loadingRevisionSheet) return;
    if (revisionSheetModal) {
      setRevisionSheetModal(null);
      return;
    }
    setLoadingRevisionSheet(true);
    try {
      const context = `${note.definition}\n${note.simpleExplanation}\n${note.importantPoints?.join("; ")}`;
      const sheet = await generateRevisionSheetApi({
        topic: note.topicTitle,
        subject: note.subject,
        notesContext: context,
      });
      setRevisionSheetModal(sheet);
      onEditNote({
        ...note,
        revisionSheet: sheet,
      });
    } catch (err: any) {
      console.error("Revision sheet error:", err);
    } finally {
      setLoadingRevisionSheet(false);
    }
  };

  const handleSendAskAi = async (overrideText?: string) => {
    const query = (overrideText || askAiQuery).trim();
    if (!query || isAskingAi) return;

    const userMsg: AskAiMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setAskAiQuery("");
    setIsAskingAi(true);

    try {
      const notesSummary = `Topic: ${note.topicTitle}\nSubject: ${note.subject}\nDefinition: ${note.definition}\nExplanation: ${note.simpleExplanation}\nKey Points: ${note.importantPoints?.join("; ")}\nImportant Notes: ${note.importantNotes?.join("; ")}`;
      const conversationHistory = chatMessages.map((m) => ({
        role: m.sender,
        text: m.text,
      }));

      const answer = await askAiApi({
        question: query,
        topic: note.topicTitle,
        notesSummary,
        conversationHistory,
      });

      const aiMsg: AskAiMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: AskAiMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "I couldn't process that question right now. Please try asking again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleCopyAll = () => {
    let fullText = `# 📌 ${note.topicTitle}\nSubject: ${note.subject} | Level: ${note.difficulty || "Intermediate"}\n\n`;
    fullText += `### Definition\n${note.definition}\n\n`;
    fullText += `### Simple Explanation\n${note.simpleExplanation}\n\n`;
    if (note.importantPoints?.length) {
      fullText += `### ⭐ Key Points\n${note.importantPoints.map((p) => `- ${p}`).join("\n")}\n\n`;
    }
    const howWorks = note.howItWorks || (note.detailedExplanation !== note.simpleExplanation ? note.detailedExplanation : "");
    if (howWorks) {
      fullText += `### 🔍 How It Works\n${howWorks}\n\n`;
    }
    if (note.example) {
      fullText += `### 💡 Example\n${note.example}\n\n`;
    }
    const realLife = note.realLifeExample || note.whyWhereUsed;
    if (realLife) {
      fullText += `### 🌍 Real-Life Use\n${realLife}\n\n`;
    }
    if (note.syntax) {
      fullText += `### 💻 Syntax\n\`\`\`\n${note.syntax}\n\`\`\`\n\n`;
    }
    if (note.code) {
      fullText += `### 💻 Code\n\`\`\`\n${note.code}\n\`\`\`\n\n`;
    }
    if (note.codeExplanation) {
      fullText += `${note.codeExplanation}\n\n`;
    }
    if (note.output) {
      fullText += `**Output:**\n\`\`\`\n${note.output}\n\`\`\`\n\n`;
    }
    if (note.importantNotes && note.importantNotes.length > 0) {
      fullText += `### ⚠️ Important Notes\n${note.importantNotes.map((n) => `- ${n}`).join("\n")}\n\n`;
    }
    if (note.commonMistakes && note.commonMistakes.length > 0) {
      fullText += `### ⚠️ Common Mistakes\n${note.commonMistakes.map((m) => `- ${m}`).join("\n")}\n\n`;
    }
    if (note.examQuestions && ((note.examQuestions.twoMarks?.length ?? 0) > 0 || (note.examQuestions.fiveMarks?.length ?? 0) > 0 || (note.examQuestions.tenMarks?.length ?? 0) > 0)) {
      fullText += `### Exam Questions\n`;
      if (note.examQuestions.twoMarks?.length) fullText += `2-Marks:\n${note.examQuestions.twoMarks.map((q) => `- ${q}`).join("\n")}\n`;
      if (note.examQuestions.fiveMarks?.length) fullText += `5-Marks:\n${note.examQuestions.fiveMarks.map((q) => `- ${q}`).join("\n")}\n`;
      if (note.examQuestions.tenMarks?.length) fullText += `10-Marks:\n${note.examQuestions.tenMarks.map((q) => `- ${q}`).join("\n")}\n`;
      fullText += `\n`;
    }
    if (note.vivaQuestions && note.vivaQuestions.length > 0) {
      fullText += `### Viva Questions\n${note.vivaQuestions.map((v, i) => `Q${i + 1}: ${v.question}\nA: ${v.answer}`).join("\n\n")}\n\n`;
    }
    if (note.mcqs && note.mcqs.length > 0) {
      fullText += `### MCQs\n${note.mcqs.map((m, i) => `${i + 1}. ${m.question}\n${m.options.map((o, idx) => `   ${String.fromCharCode(65 + idx)}) ${o}`).join("\n")}\nCorrect: ${String.fromCharCode(65 + m.correctAnswer)} - ${m.explanation}`).join("\n\n")}\n`;
    }

    navigator.clipboard.writeText(fullText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!note.code) return;
    navigator.clipboard.writeText(note.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSaveNote = () => {
    saveNote(note);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDownloadPdf = () => {
    downloadNotesAsPdf(note);
  };

  const handleShare = () => {
    const shareText = `Check out these exam notes on "${note.topicTitle}" for ${note.subject} generated by AI Notes Generator!`;
    if (navigator.share) {
      navigator
        .share({
          title: `${note.topicTitle} - Exam Notes`,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {
          navigator.clipboard.writeText(window.location.href);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
        });
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n${window.location.href}`);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleSelectMCQ = (qIndex: number, optIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
    setShowMCQExplanations((prev) => ({ ...prev, [qIndex]: true }));
  };

  const toggleViva = (idx: number) => {
    setOpenVivaIndex((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (showHandwrittenSheet && handwrittenData) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HandwrittenRevisionSheet
          sheetData={handwrittenData}
          onUpdateSheetData={(updated) => {
            setHandwrittenData(updated);
            onEditNote({ ...note, handwrittenSheet: updated });
          }}
          onRegenerate={async () => {
            setLoadingHandwritten(true);
            try {
              const context = `Title: ${note.topicTitle}
Subject: ${note.subject}
Definition: ${note.definition}
Explanation: ${note.simpleExplanation}
Key Points: ${(note.importantPoints || []).join("\n- ")}
How It Works: ${note.howItWorks || note.detailedExplanation || ""}
Example: ${note.example || ""}
Code: ${note.code || ""}
Important Notes: ${(note.importantNotes || []).join("\n- ")}
Mistakes: ${(note.commonMistakes || []).join("\n- ")}`;

              const data = await generateHandwrittenSheetApi({
                topic: note.topicTitle,
                subject: note.subject,
                notesContext: context,
                existingNote: note,
              });

              setHandwrittenData(data);
              onEditNote({
                ...note,
                handwrittenSheet: data,
              });
            } catch (err: any) {
              console.error("Failed to regenerate handwritten sheet:", err);
            } finally {
              setLoadingHandwritten(false);
            }
          }}
          onClose={() => setShowHandwrittenSheet(false)}
          isRegenerating={loadingHandwritten}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Sticky Action Toolbar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 shadow-md transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Note Title & Meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                {note.subject}
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                {note.difficulty || "Intermediate"} • {note.noteType || "Exam Preparation"}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-gray-900 dark:text-white truncate">
              {note.topicTitle}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Copy */}
            <button
              id="action-copy-notes-btn"
              onClick={handleCopyAll}
              title="Copy notes to clipboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            {/* Edit */}
            <button
              id="action-edit-notes-btn"
              onClick={() => onEditNote(note)}
              title="Edit notes content"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Save */}
            <button
              id="action-save-notes-btn"
              onClick={handleSaveNote}
              title="Save to My Notes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? "Saved!" : "Save"}</span>
            </button>

            {/* Download PDF */}
            <button
              id="action-download-pdf-btn"
              onClick={handleDownloadPdf}
              title="Export as PDF document"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Handwritten Sheet Button */}
            <button
              id="action-handwritten-sheet-btn"
              onClick={handleOpenHandwrittenSheet}
              disabled={loadingHandwritten}
              title="Generate 1-Page Handwritten Revision Sheet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingHandwritten ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <span>✍️</span>
              )}
              <span>Handwritten Sheet</span>
            </button>

            {/* Regenerate */}
            <button
              id="action-regenerate-btn"
              onClick={onRegenerate}
              title="Regenerate notes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>

            {/* Generate Quiz */}
            <button
              id="action-quiz-from-note-btn"
              onClick={() => onGenerateQuizForTopic(note.topicTitle, note.subject)}
              title="Generate a 5-question test on this topic"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Generate Quiz</span>
            </button>

            {/* Share */}
            <button
              id="action-share-note-btn"
              onClick={handleShare}
              title="Share notes"
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {shareSuccess && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            Link copied to clipboard for sharing!
          </p>
        )}
      </div>

      {/* Main Document Body - Pristine Academic Paper Aesthetic */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-lg p-6 sm:p-10 space-y-10 transition-colors">
        {/* Document Header Cover */}
        <div className="border-b border-gray-200 dark:border-gray-800 pb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700 dark:text-gray-300">
            <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              AI Notes Generator • University Examination Series
            </span>
            <span>Date: {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {note.topicTitle}
          </h1>

          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              Subject: {note.subject}
            </span>
            <span className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
              Level: {note.difficulty || "Intermediate"}
            </span>
            <span className="px-3 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
              Format: {note.noteType || "Exam Preparation"}
            </span>
          </div>
        </div>

        {/* PROMINENT CARD: 📝 Create Handwritten Revision Sheet (New Feature) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-amber-300/80 dark:border-amber-700/60 p-5 sm:p-6 shadow-md transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  New Revision Feature
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                One-Page Handwritten Revision Sheet
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Transform these study notes into a realistic <strong>single A4 handwritten revision sheet</strong>. Designed specifically for last-minute exam revision with definitions, rules, formulas, key exam traps, and must-remember keywords.
              </p>
            </div>
            <button
              id="action-create-handwritten-sheet-btn"
              onClick={handleOpenHandwrittenSheet}
              disabled={loadingHandwritten}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {loadingHandwritten ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting 1-Page Revision Sheet...</span>
                </>
              ) : (
                <>
                  <span>✍️</span>
                  <span>Generate Handwritten Revision Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI STUDY TOOLS BAR (Feature 7: Separate AI Requests) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-purple-50/70 to-indigo-50/90 dark:from-gray-800/90 dark:via-purple-950/40 dark:to-gray-850 border border-blue-100 dark:border-gray-800 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>AI Study Tools</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Generate instant on-demand exam materials without reloading your notes
              </p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              ⚡ On-Demand AI Tools
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Generate Quiz */}
            <button
              type="button"
              onClick={() => onGenerateQuizForTopic(note.topicTitle, note.subject)}
              className="p-3 rounded-xl bg-white dark:bg-gray-850 border border-purple-200 dark:border-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-sm text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🧠</span>
                <span className="font-bold text-xs sm:text-sm text-purple-700 dark:text-purple-300 group-hover:underline">
                  Generate Quiz
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1">
                Interactive 5–15 Q test
              </p>
            </button>

            {/* 2. Exam Questions */}
            <button
              type="button"
              onClick={handleGenerateExamQuestions}
              disabled={loadingExamQuestions}
              className="p-3 rounded-xl bg-white dark:bg-gray-850 border border-blue-200 dark:border-blue-900/50 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                {loadingExamQuestions ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <span className="text-base">📝</span>
                )}
                <span className="font-bold text-xs sm:text-sm text-blue-700 dark:text-blue-300 group-hover:underline">
                  Exam Questions
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1">
                2, 5 & 10 mark questions
              </p>
            </button>

            {/* 3. Viva Questions */}
            <button
              type="button"
              onClick={handleGenerateVivaQuestions}
              disabled={loadingViva}
              className="p-3 rounded-xl bg-white dark:bg-gray-850 border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                {loadingViva ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <span className="text-base">🎤</span>
                )}
                <span className="font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 group-hover:underline">
                  Viva Questions
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1">
                Oral exam Q&As
              </p>
            </button>

            {/* 4. Handwritten Revision Sheet */}
            <button
              type="button"
              onClick={handleOpenHandwrittenSheet}
              disabled={loadingHandwritten}
              className="p-3 rounded-xl bg-white dark:bg-gray-850 border border-amber-200 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                {loadingHandwritten ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                ) : (
                  <span className="text-base">⚡</span>
                )}
                <span className="font-bold text-xs sm:text-sm text-amber-700 dark:text-amber-300 group-hover:underline">
                  Handwritten Sheet
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1">
                1-page A4 exam revision
              </p>
            </button>
          </div>
        </div>

        {/* 1-PAGE REVISION SHEET MODAL / CARD */}
        {revisionSheetModal && (
          <div className="p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  1-Page Rapid Exam Revision Sheet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevisionSheetModal(null)}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Close Sheet
              </button>
            </div>
            <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed bg-white dark:bg-gray-900 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40">
              {revisionSheetModal}
            </div>
          </div>
        )}

        {/* SECTION: ⭐ MOST IMPORTANT CONCEPTS (Feature 4) */}
        {((note.importantConcepts && note.importantConcepts.length > 0) || (note.importantPoints && note.importantPoints.length > 0)) && (
          <section id="section-important-concepts" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Most Important Concepts
                </h3>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                Core syllabus pillars for revision
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(note.importantConcepts && note.importantConcepts.length > 0
                ? note.importantConcepts
                : note.importantPoints.slice(0, 5)
              ).map((concept, idx) => {
                const key = `concept-${idx}`;
                const simplified = simplifiedSections[key];
                const ex = onDemandExamples[key];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 shadow-sm space-y-2.5 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex-1 leading-snug">
                        {concept}
                      </p>
                    </div>

                    {/* Quick Micro-Actions */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => handleExplainSimpler(key, concept)}
                        disabled={simplified?.loading}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {simplified?.loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>Explain Simpler</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShowExample(key, concept)}
                        disabled={ex?.loading}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {ex?.loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>💡</span>
                        )}
                        <span>Show Example</span>
                      </button>
                    </div>

                    {/* Simplified inline result */}
                    {simplified?.simplified && (
                      <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            Simplified:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSimplifiedSections((prev) => {
                                const copy = { ...prev };
                                delete copy[key];
                                return copy;
                              });
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p>{simplified.simplified}</p>
                        {simplified.example && (
                          <p className="pt-1 text-blue-800 dark:text-blue-300 border-t border-blue-200/50 dark:border-blue-900/50">
                            <span className="font-semibold">Analogy:</span> {simplified.example}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Example inline result */}
                    {ex?.example && (
                      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            <span>💡</span> Example:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setOnDemandExamples((prev) => {
                                const copy = { ...prev };
                                delete copy[key];
                                return copy;
                              });
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p>{ex.example}</p>
                        {ex.why && (
                          <p className="pt-1 text-amber-800 dark:text-amber-300 border-t border-amber-200/50 dark:border-amber-900/50">
                            <span className="font-semibold">Why this represents it:</span> {ex.why}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION: DEFINITION */}
        {note.definition && (
          <section id="section-definition" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📌</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Definition</h3>
              </div>
              <button
                type="button"
                onClick={() => handleExplainSimpler("definition", note.definition)}
                disabled={simplifiedSections["definition"]?.loading}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {simplifiedSections["definition"]?.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Explain Simpler</span>
              </button>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
              <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                {note.definition}
              </p>
            </div>
            {simplifiedSections["definition"]?.simplified && (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Simpler Explanation:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSimplifiedSections((prev) => {
                        const copy = { ...prev };
                        delete copy["definition"];
                        return copy;
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p>{simplifiedSections["definition"].simplified}</p>
                {simplifiedSections["definition"].example && (
                  <p className="pt-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300">
                    <span className="font-bold">Everyday Example:</span> {simplifiedSections["definition"].example}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* SECTION: SIMPLE EXPLANATION */}
        {note.simpleExplanation && (
          <section id="section-simple-explanation" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Simple Explanation</h3>
              </div>
              <button
                type="button"
                onClick={() => handleExplainSimpler("simpleExplanation", note.simpleExplanation)}
                disabled={simplifiedSections["simpleExplanation"]?.loading}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {simplifiedSections["simpleExplanation"]?.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Explain Simpler</span>
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed pl-1">
              {note.simpleExplanation}
            </p>
            {simplifiedSections["simpleExplanation"]?.simplified && (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Ultra-Simple Breakdown:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSimplifiedSections((prev) => {
                        const copy = { ...prev };
                        delete copy["simpleExplanation"];
                        return copy;
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p>{simplifiedSections["simpleExplanation"].simplified}</p>
                {simplifiedSections["simpleExplanation"].example && (
                  <p className="pt-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300">
                    <span className="font-bold">Everyday Example:</span> {simplifiedSections["simpleExplanation"].example}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* SECTION: ⭐ KEY POINTS */}
        {note.importantPoints && note.importantPoints.length > 0 && (
          <section id="section-key-points" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Key Points
              </h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {note.importantPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs sm:text-sm text-gray-800 dark:text-gray-200 flex items-start gap-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SECTION: 🔍 HOW IT WORKS (Step-by-step) */}
        {(note.howItWorks || (note.detailedExplanation && note.detailedExplanation !== note.simpleExplanation)) && (
          <section id="section-how-it-works" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">How It Works</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleExplainSimpler(
                    "howItWorks",
                    note.howItWorks || note.detailedExplanation || ""
                  )
                }
                disabled={simplifiedSections["howItWorks"]?.loading}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {simplifiedSections["howItWorks"]?.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Explain Simpler</span>
              </button>
            </div>
            <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line pl-1 p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800">
              {note.howItWorks || note.detailedExplanation}
            </div>
            {simplifiedSections["howItWorks"]?.simplified && (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Simplified Working Process:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSimplifiedSections((prev) => {
                        const copy = { ...prev };
                        delete copy["howItWorks"];
                        return copy;
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p>{simplifiedSections["howItWorks"].simplified}</p>
                {simplifiedSections["howItWorks"].example && (
                  <p className="pt-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300">
                    <span className="font-bold">Analogy:</span> {simplifiedSections["howItWorks"].example}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* SECTION: 💡 EXAMPLE */}
        {note.example && (
          <section id="section-example" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Example</h3>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed pl-3">
              {note.example}
            </div>
          </section>
        )}

        {/* SECTION: 🌍 REAL-LIFE USE */}
        {(note.realLifeExample || note.whyWhereUsed) && (
          <section id="section-real-life" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌍</span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Real-Life Use</h3>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>{note.realLifeExample || note.whyWhereUsed}</div>
            </div>
          </section>
        )}

        {/* SECTION: 💻 SYNTAX / CODE */}
        {(note.syntax || note.code) && (
          <section id="section-syntax-code" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💻</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Syntax / Code</h3>
              </div>
              {note.code && (
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{codeCopied ? "Copied" : "Copy Code"}</span>
                </button>
              )}
            </div>

            {note.syntax && (
              <div className="rounded-xl bg-gray-900 dark:bg-gray-950 border border-gray-800 p-4 font-mono text-sm text-cyan-300 overflow-x-auto">
                <pre>{note.syntax}</pre>
              </div>
            )}

            {note.code && (
              <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto shadow-inner">
                <pre>{note.code}</pre>
              </div>
            )}

            {note.codeExplanation && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 pl-1 whitespace-pre-line">
                {note.codeExplanation}
              </div>
            )}

            {note.output && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-3.5 font-mono text-xs sm:text-sm text-yellow-300 overflow-x-auto flex items-start gap-2">
                <Terminal className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <pre>{note.output}</pre>
              </div>
            )}
          </section>
        )}

        {/* SECTION: ⚠️ IMPORTANT NOTES */}
        {note.importantNotes && note.importantNotes.length > 0 && (
          <section id="section-important-notes" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Important Notes & Exam Rules
              </h3>
            </div>
            <ul className="space-y-2">
              {note.importantNotes.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-2.5"
                >
                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">📌</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SECTION: ⚠️ COMMON MISTAKES */}
        {note.commonMistakes && note.commonMistakes.length > 0 && (
          <section id="section-common-mistakes" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Common Student Mistakes in Exams
              </h3>
            </div>
            <div className="space-y-2">
              {note.commonMistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 flex items-start gap-3 text-xs sm:text-sm text-rose-950 dark:text-rose-200"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{mistake}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: EXAM QUESTIONS (Rendered only if present) */}
        {note.examQuestions && ((note.examQuestions.twoMarks?.length ?? 0) > 0 || (note.examQuestions.fiveMarks?.length ?? 0) > 0 || (note.examQuestions.tenMarks?.length ?? 0) > 0) && (
          <section id="section-exam-questions" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                University Exam Questions
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 2 Marks */}
              {note.examQuestions.twoMarks?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-sm text-blue-600 dark:text-blue-400">2-Mark Questions</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold">
                      Short Answer
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    {note.examQuestions.twoMarks.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-gray-400">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5 Marks */}
              {note.examQuestions.fiveMarks?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">5-Mark Questions</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold">
                      Descriptive
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    {note.examQuestions.fiveMarks.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-gray-400">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 10 Marks */}
              {note.examQuestions.tenMarks?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-sm text-purple-600 dark:text-purple-400">10-Mark Questions</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-semibold">
                      Comprehensive
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    {note.examQuestions.tenMarks.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-gray-400">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION: VIVA QUESTIONS (Rendered only if present) */}
        {note.vivaQuestions && note.vivaQuestions.length > 0 && (
          <section id="section-viva-questions" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Viva Voce Questions & Answers
                </h3>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">Click to reveal answer</span>
            </div>

            <div className="space-y-2.5">
              {note.vivaQuestions.map((item, idx) => {
                const isOpen = !!openVivaIndex[idx];
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-850 transition-all"
                  >
                    <button
                      onClick={() => toggleViva(idx)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Q{idx + 1}:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.question}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/50 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 mr-1.5">Viva Answer:</span>
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {/* SECTION: MCQS (Rendered only if present) */}
        {note.mcqs && note.mcqs.length > 0 && (
          <section id="section-mcqs" className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Practice Questions (MCQs)
                </h3>
              </div>
              <button
                onClick={() => onGenerateQuizForTopic(note.topicTitle, note.subject)}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                Take as Full Interactive Quiz →
              </button>
            </div>

            <div className="space-y-4">
              {note.mcqs.map((mcq, qIdx) => {
                const selected = selectedAnswers[qIdx];
                const isAnswered = selected !== undefined;
                return (
                  <div
                    key={qIdx}
                    className="p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 space-y-3"
                  >
                    <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">{qIdx + 1}.</span>
                      {mcq.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mcq.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = optIdx === mcq.correctAnswer;
                        const isChosen = selected === optIdx;

                        let btnStyle = "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900";
                        if (isAnswered) {
                          if (isCorrect) {
                            btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold";
                          } else if (isChosen && !isCorrect) {
                            btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectMCQ(qIdx, optIdx)}
                            className={`text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer ${btnStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {letter}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                        <span className="font-bold">Explanation:</span> {mcq.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION: 💬 ASK AI ABOUT MY NOTES (Feature 9) */}
        <section id="section-ask-ai" className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Ask AI About These Notes
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Have questions, need another example, or want clarification? Ask anything grounded in these notes.
                </p>
              </div>
            </div>
          </div>

          {/* Conversation history */}
          {chatMessages.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-850/60 border border-gray-200 dark:border-gray-800">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 dark:text-gray-300 px-1 mt-1 font-medium">
                    {msg.sender === "user" ? "You" : "AI Study Assistant"} • {msg.timestamp}
                  </span>
                </div>
              ))}
              {isAskingAi && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>AI is thinking about your notes...</span>
                </div>
              )}
            </div>
          )}

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Suggested:</span>
            {[
              "Explain this with a simple everyday example",
              "What are the common university exam questions on this?",
              "Summarize this into 3 memory points",
              "What are the key differences to remember?",
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isAskingAi}
                onClick={() => handleSendAskAi(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAskAi();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={askAiQuery}
              onChange={(e) => setAskAiQuery(e.target.value)}
              disabled={isAskingAi}
              placeholder="Ask anything about these notes... (e.g. 'Explain 2NF with a simple example')"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isAskingAi || !askAiQuery.trim()}
              className="px-4 sm:px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
            >
              {isAskingAi ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </section>

        {/* Bottom Quick Quiz Prompt */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Ready to test your memory?</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Take a quick 5-question AI quiz generated directly from these notes.
            </p>
          </div>
          <button
            onClick={() => onGenerateQuizForTopic(note.topicTitle, note.subject)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Take AI Quiz on This Topic</span>
          </button>
        </div>
      </div>
    </div>
  );
};
