import { generateNotesService, classifyGeminiError } from "./_lib/geminiService";

// Helper to safely parse incoming request body across Vercel / Express / Node HTTP
async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk: any) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  // CORS & Security Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed. Please use POST.`,
    });
  }

  try {
    const body = await parseRequestBody(req);
    const { topic, subject, difficulty, noteType, outputLength, additionalInstructions } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid, meaningful topic name (at least 2 characters).",
      });
    }

    const result = await generateNotesService({
      topic,
      subject,
      difficulty,
      noteType,
      outputLength,
      additionalInstructions,
    });

    return res.status(200).json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("[Vercel API /api/generate-notes] Error:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    return res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
}
