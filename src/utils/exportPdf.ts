import { jsPDF } from "jspdf";
import { NoteContent } from "../types";

export function downloadNotesAsPdf(note: NoteContent): void {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Header styling
    doc.setFillColor(37, 99, 235); // Royal Blue
    doc.rect(0, 0, pageWidth, 55, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("AI Notes Generator - Exam Study Notes", margin, 34);

    y = 75;

    // Title & Meta
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text(note.topicTitle, margin, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const metaLine = `Subject: ${note.subject} | Level: ${note.difficulty || "Intermediate"} | Type: ${note.noteType || "Exam Notes"} | Date: ${new Date().toLocaleDateString()}`;
    doc.text(metaLine, margin, y);
    y += 18;

    // Horizontal rule
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    const addSection = (title: string, content: string | string[] | undefined, isCode = false) => {
      if (!content) return;
      if (Array.isArray(content) && content.length === 0) return;

      checkPageBreak(40);

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138); // deep blue
      doc.text(title, margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);

      if (Array.isArray(content)) {
        content.forEach((item) => {
          checkPageBreak(20);
          const lines = doc.splitTextToSize(`• ${item}`, maxLineWidth - 10);
          doc.text(lines, margin + 8, y);
          y += lines.length * 13 + 4;
        });
        y += 6;
      } else {
        if (isCode) {
          doc.setFont("courier", "normal");
          doc.setFontSize(9);
          doc.setTextColor(31, 41, 55);
        }
        const lines = doc.splitTextToSize(content, maxLineWidth);
        lines.forEach((line: string) => {
          checkPageBreak(14);
          doc.text(line, margin, y);
          y += 13;
        });
        y += 8;
        if (isCode) {
          doc.setFont("helvetica", "normal");
        }
      }
    };

    // 1. Definition
    addSection("1. Definition", note.definition);

    // 2. Simple Explanation
    addSection("2. Simple Explanation", note.simpleExplanation);

    // 3. Detailed Explanation
    addSection("3. Detailed Explanation", note.detailedExplanation);

    // 4. Why / Where It Is Used
    addSection("4. Why & Where It Is Used", note.whyWhereUsed);

    // 5. Syntax
    if (note.syntax) {
      addSection("5. Syntax / Mathematical Representation", note.syntax, true);
    }

    // 6. Example
    addSection("6. Example", note.example);

    // 7. Code
    if (note.code) {
      addSection("7. Code Implementation", note.code, true);
    }

    // 8. Code Explanation
    if (note.codeExplanation) {
      addSection("8. Code Explanation", note.codeExplanation);
    }

    // 9. Output
    if (note.output) {
      addSection("9. Expected Output", note.output, true);
    }

    // 10. Real-Life Example
    addSection("10. Real-Life Analogy", note.realLifeExample);

    // 11. Important Points
    addSection("11. Important Points for Revision", note.importantPoints);

    // 12. Common Mistakes
    addSection("12. Common Mistakes & Exam Pitfalls", note.commonMistakes);

    // 13. Exam Questions
    if (note.examQuestions) {
      checkPageBreak(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("13. University Exam Questions", margin, y);
      y += 15;

      if (note.examQuestions.twoMarks?.length) {
        addSection("• 2-Mark Short Questions:", note.examQuestions.twoMarks);
      }
      if (note.examQuestions.fiveMarks?.length) {
        addSection("• 5-Mark Descriptive Questions:", note.examQuestions.fiveMarks);
      }
      if (note.examQuestions.tenMarks?.length) {
        addSection("• 10-Mark Comprehensive Questions:", note.examQuestions.tenMarks);
      }
    }

    // 14. Viva Questions
    if (note.vivaQuestions?.length) {
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("14. Viva Voce Questions & Answers", margin, y);
      y += 14;

      note.vivaQuestions.forEach((vq, i) => {
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        const qLines = doc.splitTextToSize(`Q${i + 1}: ${vq.question}`, maxLineWidth);
        doc.text(qLines, margin, y);
        y += qLines.length * 12 + 2;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 65, 81);
        const aLines = doc.splitTextToSize(`Ans: ${vq.answer}`, maxLineWidth);
        doc.text(aLines, margin + 10, y);
        y += aLines.length * 12 + 6;
      });
    }

    // 15. MCQs
    if (note.mcqs?.length) {
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("15. Multiple Choice Practice Questions (MCQs)", margin, y);
      y += 14;

      note.mcqs.forEach((mcq, idx) => {
        checkPageBreak(45);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        const qLines = doc.splitTextToSize(`${idx + 1}. ${mcq.question}`, maxLineWidth);
        doc.text(qLines, margin, y);
        y += qLines.length * 12 + 4;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
        mcq.options.forEach((opt, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          const isCorrect = optIdx === mcq.correctAnswer;
          const optText = `   ${letter}) ${opt} ${isCorrect ? " ✓ [Correct]" : ""}`;
          const optLines = doc.splitTextToSize(optText, maxLineWidth);
          doc.text(optLines, margin, y);
          y += optLines.length * 12 + 2;
        });

        if (mcq.explanation) {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(107, 114, 128);
          const expLines = doc.splitTextToSize(`   Explanation: ${mcq.explanation}`, maxLineWidth);
          doc.text(expLines, margin, y);
          y += expLines.length * 11 + 6;
        }
      });
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`AI Notes Generator • ${note.topicTitle} • Page ${p} of ${totalPages}`, margin, pageHeight - 20);
    }

    const safeTitle = note.topicTitle.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    doc.save(`${safeTitle}_exam_notes.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    // Fallback to browser print window
    window.print();
  }
}
