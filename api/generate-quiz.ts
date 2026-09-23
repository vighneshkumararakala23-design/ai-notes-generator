import { generateQuizService, classifyGeminiError } from "./_lib/geminiService";

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
    const { topic, subject, questionCount, difficulty } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid topic to generate a quiz.",
      });
    }

    const result = await generateQuizService({
      topic,
      subject,
      questionCount,
      difficulty,
    });

    return res.status(200).json({
      success: true,
      modelUsed: result.modelUsed,
      data: result.data,
    });
  } catch (error: any) {
    console.error("[Vercel API /api/generate-quiz] Error:", error);
    const { userMessage, statusCode, errorType } = classifyGeminiError(error);
    return res.status(statusCode).json({
      success: false,
      error: userMessage,
      errorType,
      details: error?.message || undefined,
    });
  }
}
