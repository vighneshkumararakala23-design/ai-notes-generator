import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  generateNotesService,
  generateQuizService,
  explainSimplerService,
  showExampleService,
  generateExamQuestionsService,
  generateVivaQuestionsService,
  generateRevisionSheetService,
  generateHandwrittenSheetService,
  askAiAboutNotesService,
  generateExamAnswerService,
  teachMeInteractService,
  generatePracticeQuestionsService,
  classifyGeminiError,
} from "./api/_lib/geminiService";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    timestamp: new Date().toISOString(),
  });
});

// Generate Notes Endpoint
app.post("/api/generate-notes", async (req: Request, res: Response) => {
  try {
    const {
      topic,
      subject,
      difficulty,
      studyMode,
      learningLevel,
      noteType,
      outputLength,
      additionalInstructions,
    } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: "Please enter a valid, meaningful topic name (at least 2 characters).",
      });
      return;
    }

    const result = await generateNotesService({
      topic,
      subject,
      difficulty,
      studyMode,
      learningLevel,
      noteType,
      outputLength,
      additionalInstructions,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Gemini generation error:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Explain Simpler Endpoint
app.post("/api/explain-simpler", async (req: Request, res: Response) => {
  try {
    const { conceptOrSection, topic, subject } = req.body;
    if (!conceptOrSection || typeof conceptOrSection !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide the concept or section to explain simpler.",
      });
      return;
    }

    const result = await explainSimplerService({
      conceptOrSection,
      topic: topic || "Concept",
      subject,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in explain-simpler:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Show Example Endpoint
app.post("/api/show-example", async (req: Request, res: Response) => {
  try {
    const { concept, topic, subject } = req.body;
    if (!concept || typeof concept !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide the concept to generate an example for.",
      });
      return;
    }

    const result = await showExampleService({
      concept,
      topic: topic || "Concept",
      subject,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in show-example:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Generate Exam Questions Endpoint
app.post("/api/generate-exam-questions", async (req: Request, res: Response) => {
  try {
    const { topic, subject, notesContext } = req.body;
    if (!topic || typeof topic !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic.",
      });
      return;
    }

    const result = await generateExamQuestionsService({
      topic,
      subject,
      notesContext,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in generate-exam-questions:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Generate Viva Endpoint
app.post("/api/generate-viva", async (req: Request, res: Response) => {
  try {
    const { topic, subject, notesContext } = req.body;
    if (!topic || typeof topic !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic.",
      });
      return;
    }

    const result = await generateVivaQuestionsService({
      topic,
      subject,
      notesContext,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in generate-viva:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Generate Revision Sheet Endpoint
app.post("/api/generate-revision-sheet", async (req: Request, res: Response) => {
  try {
    const { topic, subject, notesContext } = req.body;
    if (!topic || typeof topic !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic.",
      });
      return;
    }

    const result = await generateRevisionSheetService({
      topic,
      subject,
      notesContext,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in generate-revision-sheet:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Generate Handwritten Sheet Endpoint
app.post("/api/generate-handwritten-sheet", async (req: Request, res: Response) => {
  try {
    const { topic, subject, notesContext, existingNote } = req.body;
    if (!topic || typeof topic !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic.",
      });
      return;
    }

    const result = await generateHandwrittenSheetService({
      topic,
      subject,
      notesContext,
      existingNote,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in generate-handwritten-sheet:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Ask AI About Notes Endpoint
app.post("/api/ask-ai", async (req: Request, res: Response) => {
  try {
    const { question, topic, notesSummary, conversationHistory } = req.body;
    if (!question || typeof question !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a question to ask AI.",
      });
      return;
    }

    const result = await askAiAboutNotesService({
      question,
      topic: topic || "Topic",
      notesSummary: notesSummary || "",
      conversationHistory,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: {
        answer: result.answer,
      },
    });
  } catch (error: any) {
    console.error("Error in ask-ai:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Generate Exam Answer Endpoint (Feature 2)
app.post("/api/generate-exam-answer", async (req: Request, res: Response) => {
  try {
    const { topic, subject, answerType, notesContext } = req.body;
    if (!topic || typeof topic !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic.",
      });
      return;
    }

    const result = await generateExamAnswerService({
      topic,
      subject,
      answerType: answerType || "5 Marks",
      notesContext,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: {
        topic: result.topic,
        answerType: result.answerType,
        answer: result.answer,
      },
    });
  } catch (error: any) {
    console.error("Error in generate-exam-answer:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Interactive Teach Me Endpoint (Feature 7)
app.post("/api/teach-me", async (req: Request, res: Response) => {
  try {
    const {
      topic,
      subject,
      notesContext,
      stepNumber,
      totalSteps,
      studentAnswer,
      previousQuestion,
      previousConcept,
    } = req.body;

    if (!topic || typeof topic !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic.",
      });
      return;
    }

    const result = await teachMeInteractService({
      topic,
      subject,
      notesContext,
      stepNumber: Number(stepNumber) || 1,
      totalSteps: Number(totalSteps) || 4,
      studentAnswer,
      previousQuestion,
      previousConcept,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in teach-me:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Generate Practice Questions Endpoint (Feature 6)
app.post("/api/generate-practice", async (req: Request, res: Response) => {
  try {
    const { topic, subject, practiceType, notesContext } = req.body;
    if (!topic || typeof topic !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic.",
      });
      return;
    }

    const result = await generatePracticeQuestionsService({
      topic,
      subject,
      practiceType: practiceType || "5_mcq",
      notesContext,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in generate-practice:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Generate Quiz Endpoint
app.post("/api/generate-quiz", async (req: Request, res: Response) => {
  try {
    const { topic, subject, questionCount, difficulty } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid topic to generate a quiz.",
      });
      return;
    }

    const result = await generateQuizService({
      topic,
      subject,
      questionCount,
      difficulty,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
});

// Vite & Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the standalone HTTP listener if not executed in a serverless function context or imported as module
const isDirectRun = !process.env.VERCEL && Boolean(
  process.argv[1] && (
    process.argv[1].endsWith("server.ts") ||
    process.argv[1].endsWith("server.cjs") ||
    process.argv[1].endsWith("server.js")
  )
);

if (isDirectRun) {
  startServer();
}

export default app;
