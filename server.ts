import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  generateNotesService,
  generateQuizService,
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
    const { topic, subject, difficulty, noteType, outputLength, additionalInstructions } = req.body;

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
