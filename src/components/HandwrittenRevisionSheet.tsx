import React, { useState, useRef } from "react";
import {
  Printer,
  Download,
  RotateCcw,
  Edit3,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  FileText,
  Palette,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { HandwrittenSheetData } from "../types";

interface HandwrittenRevisionSheetProps {
  sheetData: HandwrittenSheetData;
  onUpdateSheetData: (updated: HandwrittenSheetData) => void;
  onRegenerate: () => void;
  onClose: () => void;
  isRegenerating?: boolean;
}

export const HandwrittenRevisionSheet: React.FC<HandwrittenRevisionSheetProps> = ({
  sheetData,
  onUpdateSheetData,
  onRegenerate,
  onClose,
  isRegenerating = false,
}) => {
  // Preset Visual Styles: Clean Handwriting, Notebook Style, Exam Revision
  const [styleMode, setStyleMode] = useState<"clean" | "notebook" | "compact">(
    sheetData.styleMode || "notebook"
  );
  const [paperStyle, setPaperStyle] = useState<"ruled" | "grid" | "plain" | "parchment">(
    sheetData.paperStyle || (sheetData.styleMode === "clean" ? "plain" : sheetData.styleMode === "compact" ? "grid" : "ruled")
  );
  const [inkColor, setInkColor] = useState<"blue" | "dark" | "mixed">(
    sheetData.inkColor === "purple" ? "mixed" : (sheetData.inkColor || "blue")
  );
  const [handwritingFont, setHandwritingFont] = useState<"Kalam" | "Caveat" | "Patrick Hand">(
    sheetData.handwritingFont || (sheetData.styleMode === "clean" ? "Patrick Hand" : sheetData.styleMode === "compact" ? "Caveat" : "Kalam")
  );

  const [isEditing, setIsEditing] = useState(false);
  const [showStyleToolbar, setShowStyleToolbar] = useState(true);
  const [editFormData, setEditFormData] = useState<HandwrittenSheetData>({ ...sheetData });
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Apply quick style mode preset without triggering API
  const applyStyleMode = (mode: "clean" | "notebook" | "compact") => {
    setStyleMode(mode);
    if (mode === "clean") {
      setPaperStyle("plain");
      setHandwritingFont("Patrick Hand");
      setInkColor("dark");
    } else if (mode === "notebook") {
      setPaperStyle("ruled");
      setHandwritingFont("Kalam");
      setInkColor("blue");
    } else {
      setPaperStyle("grid");
      setHandwritingFont("Caveat");
      setInkColor("mixed");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEdits = () => {
    onUpdateSheetData({
      ...editFormData,
      styleMode,
      paperStyle,
      inkColor,
      handwritingFont,
    });
    setIsEditing(false);
  };

  // Color theme mappings
  const inkStyles = {
    blue: {
      text: "text-blue-900",
      accent: "text-blue-800",
      border: "border-blue-400/80",
      boxBg: "bg-blue-50/70",
      highlight: "bg-amber-200/80 text-blue-950",
      ruleLine: "#bfdbfe",
      penHex: "#1e3a8a",
      tapeColor: "bg-yellow-200/90 border-yellow-300",
    },
    dark: {
      text: "text-zinc-950",
      accent: "text-zinc-800",
      border: "border-zinc-400/80",
      boxBg: "bg-zinc-100/70",
      highlight: "bg-yellow-200/80 text-zinc-950",
      ruleLine: "#cbd5e1",
      penHex: "#18181b",
      tapeColor: "bg-stone-200/90 border-stone-300",
    },
    mixed: {
      text: "text-zinc-900",
      accent: "text-indigo-900",
      border: "border-indigo-300/80",
      boxBg: "bg-amber-50/60",
      highlight: "bg-yellow-300/90 text-zinc-950",
      ruleLine: "#e2e8f0",
      penHex: "#1e1b4b",
      tapeColor: "bg-amber-200/90 border-amber-300",
    },
  }[inkColor];

  // Paper Background styles
  const getPaperBackground = () => {
    switch (paperStyle) {
      case "ruled":
        return {
          backgroundColor: "#fdfbf7",
          backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, ${inkStyles.ruleLine} 28px)`,
          backgroundPosition: "0 28px",
        };
      case "grid":
        return {
          backgroundColor: "#fcfbf9",
          backgroundImage: `
            linear-gradient(to right, ${inkStyles.ruleLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${inkStyles.ruleLine} 1px, transparent 1px)
          `,
          backgroundSize: "22px 22px",
        };
      case "parchment":
        return {
          backgroundColor: "#fef9ee",
          backgroundImage: `radial-gradient(#eedcbe 0.75px, transparent 0.75px)`,
          backgroundSize: "16px 16px",
        };
      case "plain":
      default:
        return {
          backgroundColor: "#ffffff",
        };
    }
  };

  const fontClass =
    handwritingFont === "Kalam"
      ? "font-['Kalam']"
      : handwritingFont === "Caveat"
      ? "font-['Caveat'] text-[1.1rem]"
      : "font-['Patrick_Hand']";

  // PDF Generation via html2canvas + jsPDF (Exact single A4 page)
  const handleDownloadPdf = async () => {
    const el = document.getElementById("handwritten-a4-page");
    if (!el) {
      window.print();
      return;
    }
    setDownloadingPdf(true);

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      doc.addImage(imgData, "PNG", 0, 0, 210, 297);
      doc.save(`${sheetData.title.replace(/[^a-z0-9]/gi, "_")}_handwritten_revision.pdf`);
    } catch (err) {
      console.error("PDF generation fallback:", err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // High-Resolution PNG Generation via html2canvas
  const handleDownloadPng = async () => {
    const el = document.getElementById("handwritten-a4-page");
    if (!el) return;
    setDownloadingPng(true);

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `${sheetData.title.replace(/[^a-z0-9]/gi, "_")}_handwritten_revision.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("PNG generation error:", err);
    } finally {
      setDownloadingPng(false);
    }
  };

  // Quick plain text cheat sheet download
  const handleDownloadTxt = () => {
    let content = `=========================================================\n`;
    content += `  1-PAGE EXAM REVISION SHEET: ${sheetData.title.toUpperCase()}\n`;
    content += `  Subject: ${sheetData.subject} | Date: ${new Date().toLocaleDateString()}\n`;
    content += `=========================================================\n\n`;
    content += `[DEFINITION & ESSENCE]\n${sheetData.definition}\n\n`;
    content += `[KEY POINTS TO WRITE IN EXAM]\n`;
    sheetData.keyPoints.forEach((kp, i) => {
      content += `  ${i + 1}. ${kp}\n`;
    });
    const formulasList = sheetData.formulas || sheetData.formulaOrRules || [];
    if (formulasList.length > 0) {
      content += `\n[RULES & FORMULAS]\n`;
      formulasList.forEach((fr) => {
        content += `  - ${fr}\n`;
      });
    }
    if (sheetData.steps && sheetData.steps.length > 0) {
      content += `\n[PROCEDURE / STEPS]\n`;
      sheetData.steps.forEach((st, i) => {
        content += `  Step ${i + 1}: ${st}\n`;
      });
    }
    if (sheetData.example || sheetData.tinyExample) {
      content += `\n[EXAMPLE]\n  "${sheetData.example || sheetData.tinyExample}"\n`;
    }
    if (sheetData.codeSnippet) {
      content += `\n[ESSENTIAL SYNTAX / CODE]\n${sheetData.codeSnippet}\n`;
    }
    if (sheetData.examTips && sheetData.examTips.length > 0) {
      content += `\n[EXAM ROOM TIPS & PITFALLS]\n`;
      sheetData.examTips.forEach((tip) => {
        content += `  ! ${tip}\n`;
      });
    }
    const kwList = sheetData.importantTerms || sheetData.mustRememberKeywords || [];
    if (kwList.length > 0) {
      content += `\n[MUST-REMEMBER EXAM KEYWORDS]\n`;
      content += kwList.map((kw) => `#${kw}`).join("  ") + "\n";
    }
    content += `\n=========================================================\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `${sheetData.title.replace(/[^a-z0-9]/gi, "_")}_revision_sheet.txt`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formulasList = sheetData.formulas || sheetData.formulaOrRules || [];
  const keywordsList = sheetData.importantTerms || sheetData.mustRememberKeywords || [];
  const exampleText = sheetData.example || sheetData.tinyExample;

  return (
    <div className="space-y-6">
      {/* Non-printing Control Header (Feature 12: User Controls) */}
      <div className="print:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Full Notes</span>
            </button>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <span>✍️</span>
              <span>1-Page Handwritten Revision Sheet</span>
            </span>
          </div>

          {/* Action Buttons: Generate/Regenerate, Change Style, Download PDF, Download PNG, Print, Edit Sheet */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* ✏️ Edit Sheet */}
            <button
              id="action-edit-handwritten-btn"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isEditing
                  ? "bg-amber-600 text-white shadow-sm"
                  : "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Close Editor" : "✏️ Edit Sheet"}</span>
            </button>

            {/* 🎨 Change Style */}
            <button
              id="action-change-style-btn"
              onClick={() => setShowStyleToolbar(!showStyleToolbar)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                showStyleToolbar
                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                  : "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              <span>🎨 Change Style</span>
            </button>

            {/* 📄 Download PDF */}
            <button
              id="action-download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              title="Download 1-page A4 PDF directly"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? "Generating PDF..." : "📄 Download PDF"}</span>
            </button>

            {/* 🖼️ Download PNG */}
            <button
              id="action-download-png-btn"
              onClick={handleDownloadPng}
              disabled={downloadingPng}
              title="Download high-resolution PNG image"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{downloadingPng ? "Rendering PNG..." : "🖼️ Download PNG"}</span>
            </button>

            {/* 🖨️ Print */}
            <button
              id="action-print-handwritten-btn"
              onClick={handlePrint}
              title="Print directly or save as PDF via system dialog"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ Print</span>
            </button>

            {/* 🔄 Regenerate */}
            <button
              id="action-regenerate-handwritten-btn"
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Re-extract concise points from notes with AI"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>{isRegenerating ? "Extracting..." : "🔄 Regenerate"}</span>
            </button>
          </div>
        </div>

        {/* Customization Toolbar (Feature 6: Handwriting Styles & Feature 7: Color Options) */}
        {showStyleToolbar && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
            {/* Preset Handwriting Style: ✍️ Clean, 📒 Notebook, 📝 Exam Revision */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>Style Preset:</span>
              </span>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-850">
                {[
                  { id: "clean", label: "✍️ Clean Handwriting" },
                  { id: "notebook", label: "📒 Notebook Style" },
                  { id: "compact", label: "📝 Exam Revision" },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => applyStyleMode(style.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      styleMode === style.id
                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Options: Blue Ink, Black Ink, Mixed Highlight */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Ink Color:</span>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-850">
                {[
                  { id: "blue", label: "🖊️ Blue Ink", color: "text-blue-700" },
                  { id: "dark", label: "🖋️ Black Ink", color: "text-zinc-800" },
                  { id: "mixed", label: "🖍️ Mixed Highlight", color: "text-amber-800" },
                ].map((ink) => (
                  <button
                    key={ink.id}
                    onClick={() => setInkColor(ink.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      inkColor === ink.id
                        ? "bg-white dark:bg-gray-700 font-bold shadow-xs " + ink.color
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    {ink.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Pattern & Font Details */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500">Paper:</span>
                <select
                  value={paperStyle}
                  onChange={(e) => setPaperStyle(e.target.value as any)}
                  className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <option value="ruled">Ruled Notebook</option>
                  <option value="grid">Grid Sheet</option>
                  <option value="plain">Clean White</option>
                  <option value="parchment">Ivory Parchment</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500">Font:</span>
                <select
                  value={handwritingFont}
                  onChange={(e) => setHandwritingFont(e.target.value as any)}
                  className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <option value="Kalam">Kalam (Notebook)</option>
                  <option value="Patrick Hand">Patrick Hand (Clean)</option>
                  <option value="Caveat">Caveat (Cursive)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL / DRAWER (Feature 14: Edit Mode) */}
      {isEditing && (
        <div className="print:hidden bg-amber-50/90 dark:bg-gray-850 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-5 space-y-4 shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600" />
              <span>✏️ Edit Revision Sheet Content</span>
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdits}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Topic Title</label>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Subject</label>
              <input
                type="text"
                value={editFormData.subject}
                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Definition (1–2 concise sentences)</label>
              <textarea
                rows={2}
                value={editFormData.definition}
                onChange={(e) => setEditFormData({ ...editFormData, definition: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Key Points (One point per line, keep concise)</label>
              <textarea
                rows={3}
                value={editFormData.keyPoints.join("\n")}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    keyPoints: e.target.value.split("\n").filter((p) => p.trim()),
                  })
                }
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Rules / Formulas (One per line)</label>
              <textarea
                rows={3}
                value={(editFormData.formulas || editFormData.formulaOrRules || []).join("\n")}
                onChange={(e) => {
                  const arr = e.target.value.split("\n").filter((p) => p.trim());
                  setEditFormData({
                    ...editFormData,
                    formulas: arr,
                    formulaOrRules: arr,
                  });
                }}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Exam Tips / Pitfalls (One per line)</label>
              <textarea
                rows={3}
                value={editFormData.examTips.join("\n")}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    examTips: e.target.value.split("\n").filter((p) => p.trim()),
                  })
                }
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Must-Remember Keywords (Comma-separated buzzwords)</label>
              <input
                type="text"
                value={(editFormData.importantTerms || editFormData.mustRememberKeywords || []).join(", ")}
                onChange={(e) => {
                  const kw = e.target.value.split(",").map((k) => k.trim()).filter(Boolean);
                  setEditFormData({
                    ...editFormData,
                    importantTerms: kw,
                    mustRememberKeywords: kw,
                  });
                }}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature 4 & 13: Printable Single A4 Handwritten Sheet Container */}
      <div className="flex justify-center overflow-x-auto pb-8">
        <div
          ref={printRef}
          id="handwritten-a4-page"
          style={getPaperBackground()}
          className={`relative w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] p-[9mm] pl-[16mm] sm:pl-[18mm] rounded-2xl sm:rounded-none shadow-2xl print:shadow-none print:m-0 print:p-[8mm] print:pl-[14mm] border border-stone-300 dark:border-stone-700 print:border-none overflow-hidden select-text text-left flex flex-col justify-between transition-colors ${fontClass} ${inkStyles.text}`}
        >
          {/* Ruled Notebook Left Margin Line & Binder Holes */}
          {paperStyle === "ruled" && (
            <>
              {/* Pink Notebook Margin Line */}
              <div
                className="absolute top-0 bottom-0 left-[13mm] w-[1.5px] bg-rose-300/80 pointer-events-none"
                style={{ zIndex: 1 }}
              />
              {/* Binder Hole Punch Rings */}
              <div className="absolute left-[3.5mm] top-[38mm] w-[5mm] h-[5mm] rounded-full bg-stone-200/90 dark:bg-stone-800 shadow-inner border border-stone-300/60 pointer-events-none print:hidden" />
              <div className="absolute left-[3.5mm] top-[148mm] w-[5mm] h-[5mm] rounded-full bg-stone-200/90 dark:bg-stone-800 shadow-inner border border-stone-300/60 pointer-events-none print:hidden" />
              <div className="absolute left-[3.5mm] top-[256mm] w-[5mm] h-[5mm] rounded-full bg-stone-200/90 dark:bg-stone-800 shadow-inner border border-stone-300/60 pointer-events-none print:hidden" />
            </>
          )}

          {/* Top Header Block */}
          <div className="relative pb-2.5 border-b-2 border-stone-800/20 space-y-0.5">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold opacity-80">
              <span className="tracking-wider uppercase">
                📖 {sheetData.subject} • EXAM REVISION SHEET
              </span>
              <span className="text-[11px] opacity-75">
                Date: {new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3 pt-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight relative inline-block">
                <span className={`px-2 py-0.5 rounded ${inkStyles.highlight} -rotate-1 inline-block shadow-xs`}>
                  {sheetData.title}
                </span>
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-current opacity-75">
                1-PAGE EXAM RECAP
              </span>
            </div>
          </div>

          {/* Section 1: Definition (Crisp, 1-2 lines) */}
          <div className="mt-2 relative">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-wide mb-1">
              <span>📌</span>
              <span className="underline decoration-wavy decoration-yellow-400">
                DEFINITION & ESSENCE:
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border ${inkStyles.border} ${inkStyles.boxBg} leading-snug text-xs sm:text-sm font-semibold`}>
              <p>{sheetData.definition}</p>
            </div>
          </div>

          {/* Section 2: Optional Flow / Process Diagram (Feature 8) */}
          {sheetData.diagram && sheetData.diagram.nodes && sheetData.diagram.nodes.length >= 2 && (
            <div className="mt-2 p-2 rounded-xl border border-current/25 bg-white/40 dark:bg-stone-900/30">
              <div className="flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider mb-1 opacity-80">
                <span>📊</span>
                <span>{sheetData.diagram.title || "Process Flow / Architecture"}:</span>
              </div>
              <div className="flex items-center justify-between gap-1 overflow-x-auto py-0.5">
                {sheetData.diagram.nodes.map((node, i) => (
                  <React.Fragment key={i}>
                    <div className="px-2 py-1 rounded-md border border-current/40 bg-yellow-100/70 dark:bg-yellow-950/40 text-center text-xs font-bold shrink-0 shadow-2xs">
                      {node}
                    </div>
                    {i < sheetData.diagram!.nodes.length - 1 && (
                      <span className="font-black text-sm select-none shrink-0 opacity-75">
                        →
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Middle Modular Two-Column Layout */}
          <div className="grid grid-cols-12 gap-3 mt-2 flex-1 overflow-hidden">
            {/* Left Column (Key Points, Steps, Code/Example) */}
            <div className="col-span-7 flex flex-col justify-between space-y-2">
              {/* ⭐ Key Points */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-wide">
                  <span>⭐</span>
                  <span className="underline decoration-yellow-400">KEY POINTS TO WRITE IN EXAM:</span>
                </div>
                <ul className="space-y-0.5 text-xs sm:text-[13px] leading-tight pl-1">
                  {sheetData.keyPoints.slice(0, 5).map((point, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-black text-xs mt-0.5 select-none shrink-0">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps / Process (if available) */}
              {sheetData.steps && sheetData.steps.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>🔄</span>
                    <span className="underline decoration-yellow-400">STEPS / PROCEDURE:</span>
                  </div>
                  <ol className="space-y-0.5 text-xs leading-snug pl-1">
                    {sheetData.steps.slice(0, 4).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="font-bold select-none shrink-0">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Differences / Comparison Table or Bullets */}
              {sheetData.differencesOrTable && sheetData.differencesOrTable.headers?.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>⚖️</span>
                    <span className="underline">KEY COMPARISON:</span>
                  </div>
                  <div className="rounded-lg border border-stone-400/80 overflow-hidden text-[11px] leading-tight">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-stone-200/60 dark:bg-stone-800/60 font-bold border-b border-stone-400/80">
                          {sheetData.differencesOrTable.headers.map((h, i) => (
                            <th key={i} className="p-1 text-left border-r border-stone-400/80 last:border-r-0">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sheetData.differencesOrTable.rows.slice(0, 3).map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-stone-300/60 last:border-b-0">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-1 border-r border-stone-300/60 last:border-r-0">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : sheetData.differences && sheetData.differences.length > 0 ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>⚖️</span>
                    <span className="underline">DIFFERENCES TO REMEMBER:</span>
                  </div>
                  <ul className="space-y-0.5 text-xs leading-tight pl-1">
                    {sheetData.differences.slice(0, 3).map((diff, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="font-bold select-none shrink-0">⟷</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Tiny Example or Code Snippet (Feature 9) */}
              {sheetData.codeSnippet ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>💻</span>
                    <span className="underline">ESSENTIAL SYNTAX / CODE:</span>
                  </div>
                  {sheetData.syntax && (
                    <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      Syntax: {sheetData.syntax}
                    </div>
                  )}
                  <div className="p-2 rounded-lg bg-stone-900 text-emerald-300 font-mono text-[11px] leading-tight overflow-hidden">
                    <pre className="whitespace-pre-wrap">{sheetData.codeSnippet}</pre>
                  </div>
                </div>
              ) : exampleText ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>💡</span>
                    <span className="underline">TINY EXAMPLE:</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${inkStyles.border} bg-amber-50/50 text-xs leading-snug italic`}>
                    "{exampleText}"
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right Column (Formulas/Rules & Sticky Exam Traps) */}
            <div className="col-span-5 flex flex-col justify-between space-y-2">
              {/* Formulas & Golden Rules Box (Feature 10) */}
              {formulasList.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-wide">
                    <span>📐</span>
                    <span className="underline decoration-yellow-400">RULES & FORMULAS:</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border-2 border-dashed ${inkStyles.border} bg-amber-50/40 space-y-1 text-xs sm:text-[13px] leading-tight`}>
                    {formulasList.slice(0, 4).map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-1 font-bold">
                        <span className="text-amber-700 select-none">•</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yellow Sticky Note: Exam Traps & Tips */}
              <div className="relative mt-1">
                {/* Visual Tape Effect */}
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 ${inkStyles.tapeColor} shadow-xs rotate-2 z-10 border`} />

                <div className="p-3 pt-3.5 rounded-lg bg-yellow-100 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-700/80 shadow-md rotate-[-0.5deg] space-y-1 text-stone-900 dark:text-stone-100 text-xs sm:text-[12px] leading-snug">
                  <div className="flex items-center gap-1 font-bold text-yellow-900 dark:text-yellow-300 text-xs uppercase tracking-wider">
                    <span>⚠️</span>
                    <span>EXAM ROOM TIPS & PITFALLS:</span>
                  </div>
                  <ul className="space-y-1">
                    {sheetData.examTips.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="font-bold text-rose-600 dark:text-rose-400 select-none">!</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: 🔑 Must-Remember Keywords & Buzzwords */}
          {keywordsList.length > 0 && (
            <div className="mt-2 pt-1.5 border-t-2 border-stone-800/20 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                <span>🔑</span>
                <span className="underline decoration-yellow-400 uppercase tracking-wider">
                  MUST-REMEMBER EXAM KEYWORDS (EXAMINERS SCORE THESE):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {keywordsList.slice(0, 8).map((kw, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md text-xs sm:text-sm font-bold border border-current/30 ${
                      idx % 3 === 0
                        ? "bg-yellow-200/70 text-yellow-950"
                        : idx % 3 === 1
                        ? "bg-emerald-200/70 text-emerald-950"
                        : "bg-blue-200/70 text-blue-950"
                    }`}
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Stamp / Signature Footer */}
          <div className="mt-1 pt-1 flex items-center justify-between text-[10px] opacity-70 font-semibold border-t border-stone-300/60">
            <span>Prepared for University Exam Revision • Single-Sheet Format</span>
            <span className="italic">Keep calm, write precisely & score full marks! 🎓</span>
          </div>
        </div>
      </div>

      {/* Print CSS Specific Rules for Exact Single A4 Page Output */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, header, footer, #action-bar, .print\\:hidden {
            display: none !important;
          }
          #handwritten-a4-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
