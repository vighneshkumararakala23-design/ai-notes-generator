import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Centralized Gemini Model Configuration
const CONFIGURED_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const FALLBACK_MODELS = Array.from(
  new Set([CONFIGURED_MODEL, "gemini-3.1-flash-lite", "gemini-3.8-flash"].filter(Boolean))
);

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === "MY_GEMINI_API_KEY") {
    const err: any = new Error("Gemini API key is missing or not configured.");
    err.code = "MISSING_API_KEY";
    throw err;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Map technical or API errors into distinct, user-friendly categorized explanations
export function classifyGeminiError(error: any): { userMessage: string; statusCode: number; errorType: string } {
  const errMsg = (error?.message || "").toLowerCase();
  const errStatus = error?.status || error?.statusCode || error?.code;
  const errString = JSON.stringify(error || {}).toLowerCase();

  // 1. Missing API key
  if (
    error?.code === "MISSING_API_KEY" ||
    !process.env.GEMINI_API_KEY ||
    !process.env.GEMINI_API_KEY.trim() ||
    process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" ||
    errMsg.includes("gemini_api_key is not configured") ||
    errMsg.includes("missing api key")
  ) {
    return {
      userMessage: "Gemini API key is missing or not configured.",
      statusCode: 401,
      errorType: "MISSING_API_KEY",
    };
  }

  // 2. Authentication error
  if (
    errStatus === 401 ||
    errStatus === 403 ||
    errMsg.includes("api_key_invalid") ||
    errMsg.includes("api key not valid") ||
    errMsg.includes("unauthenticated") ||
    errMsg.includes("permission_denied") ||
    errString.includes("api_key_invalid")
  ) {
    return {
      userMessage: "Gemini API authentication failed. Check the configured API key.",
      statusCode: 401,
      errorType: "AUTH_ERROR",
    };
  }

  // 3. Model error (model unavailable / not found / deprecated / high demand 503)
  if (
    errStatus === 503 ||
    errStatus === 404 ||
    errMsg.includes("not found") ||
    errMsg.includes("no longer available") ||
    errMsg.includes("unsupported model") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("high demand") ||
    errString.includes("not_found") ||
    errString.includes("unavailable")
  ) {
    return {
      userMessage: "The selected Gemini model is unavailable. Please use a supported model.",
      statusCode: 503,
      errorType: "MODEL_ERROR",
    };
  }

  // 4. Rate limit
  if (
    errStatus === 429 ||
    errMsg.includes("resource_exhausted") ||
    errMsg.includes("quota exceeded") ||
    errMsg.includes("rate limit") ||
    errMsg.includes("too many requests") ||
    errString.includes("resource_exhausted")
  ) {
    return {
      userMessage: "Too many requests. Please wait a moment and try again.",
      statusCode: 429,
      errorType: "RATE_LIMIT",
    };
  }

  // 5. Network error
  if (
    errMsg.includes("econnreset") ||
    errMsg.includes("enotfound") ||
    errMsg.includes("etimedout") ||
    errMsg.includes("fetch failed") ||
    errMsg.includes("network error")
  ) {
    return {
      userMessage: "Unable to connect to Gemini. Check your internet connection and try again.",
      statusCode: 502,
      errorType: "NETWORK_ERROR",
    };
  }

  // 6. Empty response
  if (errMsg.includes("empty response") || errMsg.includes("did not return any notes")) {
    return {
      userMessage: "Gemini did not return any notes. Please try again with a different topic.",
      statusCode: 500,
      errorType: "EMPTY_RESPONSE",
    };
  }

  // 7. Invalid response
  if (
    errMsg.includes("unexpected response") ||
    errMsg.includes("syntaxerror") ||
    errMsg.includes("json")
  ) {
    return {
      userMessage: "Gemini returned an unexpected response. Please try again.",
      statusCode: 500,
      errorType: "INVALID_RESPONSE",
    };
  }

  return {
    userMessage: "Gemini returned an unexpected response. Please try again.",
    statusCode: 500,
    errorType: "UNKNOWN",
  };
}

// Executes content generation with automatic model fallback on temporary 503 / 429 errors
export async function executeGeminiWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
  }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[Gemini Engine] Requesting generation via model: ${modelName}`);
      const config: any = {};
      if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
      if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
      if (options.responseSchema) config.responseSchema = options.responseSchema;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config,
      });

      const responseText = response.text;
      if (responseText && responseText.trim().length > 0) {
        console.log(`[Gemini Engine] Successfully generated content using ${modelName} (${responseText.length} chars)`);
        return { text: responseText.trim(), modelUsed: modelName };
      }
      throw new Error("Empty response returned from model " + modelName);
    } catch (err: any) {
      console.warn(`[Gemini Engine] Model ${modelName} encountered error:`, err?.status || err?.message || err);
      lastError = err;
      // If error is an explicit Auth or Missing Key error, do not retry other models
      const status = err?.status || err?.statusCode;
      if (status === 401 || status === 403) {
        throw err;
      }
      // If it's a 503 (high demand) or 429 (rate limit) or 404 (model deprecated), continue to next model in fallback cascade
    }
  }

  throw lastError || new Error("All configured Gemini models failed to generate content.");
}

// Resilient parser that handles direct JSON, JSON inside markdown code blocks, or raw markdown fallback
export function parseAndNormalizeNoteResponse(
  rawText: string,
  topic: string,
  subject: string,
  difficulty: string,
  noteType: string
): any {
  if (!rawText || !rawText.trim()) {
    throw new Error("Empty response returned from model");
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    console.warn("[Gemini Parser] Raw response was not valid JSON, parsing markdown structure...");
    parsed = {
      topicTitle: topic,
      subject: subject,
      definition: cleaned.slice(0, 300),
      simpleExplanation: cleaned.slice(0, 600),
      detailedExplanation: cleaned,
      whyWhereUsed: "Widely applied in academic coursework, university examinations, and real-world system architecture.",
      example: "Core illustrative academic walkthrough for " + topic,
      realLifeExample: "Everyday relatable analogy demonstrating " + topic,
      importantPoints: [
        "Fundamental core concept for " + topic,
        "Critical exam definition and properties",
        "High-yield revision takeaway for university evaluation",
      ],
      commonMistakes: [
        "Confusing edge conditions or forgetting standard notations",
        "Overlooking boundary constraints during implementation",
      ],
      examQuestions: {
        twoMarks: ["State the formal definition of " + topic + "."],
        fiveMarks: ["Explain the core principles and step-by-step mechanism of " + topic + "."],
        tenMarks: ["Describe " + topic + " comprehensively with diagrams, working examples, and analysis."],
      },
      vivaQuestions: [
        { question: "What is the primary role of " + topic + "?", answer: "It provides a structured, foundational solution in " + subject + "." },
      ],
      mcqs: [
        {
          question: "Which of the following best characterizes " + topic + "?",
          options: ["Core foundational principle", "Deprecated legacy syntax", "Hardware register flag", "None of the above"],
          correctAnswer: 0,
          explanation: topic + " is a core foundational concept in " + subject + ".",
        },
      ],
    };
  }

  return {
    topicTitle: parsed.topicTitle || parsed.title || topic,
    subject: parsed.subject || subject,
    difficulty,
    noteType,
    definition: parsed.definition || "A foundational concept in " + subject + ".",
    simpleExplanation: parsed.simpleExplanation || parsed.simple_explanation || parsed.explanation || "",
    detailedExplanation: parsed.detailedExplanation || parsed.detailed_explanation || "",
    whyWhereUsed: parsed.whyWhereUsed || parsed.whyUsed || parsed.applications || "Applied across academic study and industry software systems.",
    syntax: parsed.syntax || "",
    example: parsed.example || "",
    code: parsed.code || "",
    codeExplanation: parsed.codeExplanation || parsed.code_explanation || "",
    output: parsed.output || "",
    realLifeExample: parsed.realLifeExample || parsed.real_life_example || parsed.analogy || "",
    importantPoints: Array.isArray(parsed.importantPoints)
      ? parsed.importantPoints
      : typeof parsed.importantPoints === "string"
      ? parsed.importantPoints.split("\n").filter((s: string) => s.trim().length > 0)
      : ["Core exam concept", "Key properties and behaviors"],
    commonMistakes: Array.isArray(parsed.commonMistakes)
      ? parsed.commonMistakes
      : typeof parsed.commonMistakes === "string"
      ? parsed.commonMistakes.split("\n").filter((s: string) => s.trim().length > 0)
      : ["Skipping edge cases or boundary validations"],
    examQuestions: {
      twoMarks: Array.isArray(parsed.examQuestions?.twoMarks)
        ? parsed.examQuestions.twoMarks
        : Array.isArray(parsed.examQuestions?.twoMark)
        ? parsed.examQuestions.twoMark
        : [`Define ${topic} and mention its key characteristics.`],
      fiveMarks: Array.isArray(parsed.examQuestions?.fiveMarks)
        ? parsed.examQuestions.fiveMarks
        : Array.isArray(parsed.examQuestions?.fiveMark)
        ? parsed.examQuestions.fiveMark
        : [`Explain the structure and working principle of ${topic} with a suitable example.`],
      tenMarks: Array.isArray(parsed.examQuestions?.tenMarks)
        ? parsed.examQuestions.tenMarks
        : Array.isArray(parsed.examQuestions?.tenMark)
        ? parsed.examQuestions.tenMark
        : [`Provide a detailed descriptive analysis of ${topic}, including code/pseudocode, architecture, and common pitfalls.`],
    },
    vivaQuestions: Array.isArray(parsed.vivaQuestions) && parsed.vivaQuestions.length > 0
      ? parsed.vivaQuestions.map((v: any) => ({
          question: v.question || v.q || "What is " + topic + "?",
          answer: v.answer || v.a || "A key concept in " + subject + ".",
        }))
      : [
          { question: "What is " + topic + "?", answer: "A key concept in " + subject + "." },
        ],
    mcqs: Array.isArray(parsed.mcqs) && parsed.mcqs.length > 0
      ? parsed.mcqs.map((m: any, index: number) => ({
          question: m.question || `Question ${index + 1} on ${topic}`,
          options: Array.isArray(m.options) && m.options.length >= 2
            ? m.options
            : ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: typeof m.correctAnswer === "number" && m.correctAnswer >= 0 && m.correctAnswer <= 3
            ? m.correctAnswer
            : 0,
          explanation: m.explanation || "Correct answer based on " + topic + " fundamentals.",
        }))
      : [
          {
            question: "Which statement accurately describes " + topic + "?",
            options: ["It is a central concept in " + subject, "It is an obsolete feature", "It only applies to hardware", "None of the above"],
            correctAnswer: 0,
            explanation: topic + " is widely taught and examined in " + subject + ".",
          },
        ],
  };
}

export interface GenerateNotesParams {
  topic: string;
  subject?: string;
  difficulty?: string;
  noteType?: string;
  outputLength?: string;
  additionalInstructions?: string;
}

export async function generateNotesService(params: GenerateNotesParams) {
  const { topic, subject, difficulty, noteType, outputLength, additionalInstructions } = params;

  if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
    const error: any = new Error("Please enter a valid, meaningful topic name (at least 2 characters).");
    error.statusCode = 400;
    throw error;
  }

  const ai = getGeminiClient();

  const selectedSubject = subject || "Computer Science";
  const selectedDifficulty = difficulty || "Intermediate";
  const selectedNoteType = noteType || "Exam Preparation";
  const customInstructions = additionalInstructions ? additionalInstructions.trim() : "None";

  const promptText = `You are an expert academic tutor.

Generate accurate, well-structured, exam-oriented notes for the following topic.

Subject:
${selectedSubject}

Topic:
${topic.trim()}

Difficulty:
${selectedDifficulty}

Note Type:
${selectedNoteType}

Additional Instructions:
${customInstructions}

Requirements:
- Explain the topic in simple student-friendly language.
- Start with a clear definition.
- Explain the concept step by step.
- Include important terminology.
- Include examples.
- Include real-world examples where useful.
- For programming topics, provide correct syntax and code.
- Explain important parts of the code.
- Include expected output when applicable.
- Include important exam points.
- Include common mistakes.
- Generate 2-mark, 5-mark and 10-mark questions.
- Generate useful viva questions.
- Generate MCQs with four options and correct answers.
- Do not add irrelevant information.
- Do not invent facts.
- Keep the content appropriate for the selected difficulty.
- Make the content easy to revise before an exam.

Respond in valid JSON matching this structure:
{
  "topicTitle": "${topic.trim()}",
  "subject": "${selectedSubject}",
  "definition": "Clear, crisp, exam-ready textbook definition",
  "simpleExplanation": "Beginner-friendly intuitive explanation",
  "detailedExplanation": "Deep dive into core mechanics, principles, and concepts",
  "whyWhereUsed": "Practical real-world and software/industry applications",
  "syntax": "Formal syntax, grammar, formula, or declaration (if applicable)",
  "example": "Clear, practical academic example walkthrough",
  "code": "Clean, properly indented code snippet (or pseudocode/formula if non-programming)",
  "codeExplanation": "Step-by-step or line-by-line explanation of the code/formula",
  "output": "Exact expected console or runtime output",
  "realLifeExample": "Relatable real-world analogy",
  "importantPoints": ["High-yield bullet point 1", "High-yield bullet point 2", "High-yield bullet point 3"],
  "commonMistakes": ["Common student misconception or exam pitfall 1", "Common pitfall 2"],
  "examQuestions": {
    "twoMarks": ["2-mark short answer question 1", "2-mark short answer question 2"],
    "fiveMarks": ["5-mark descriptive exam question 1", "5-mark descriptive exam question 2"],
    "tenMarks": ["10-mark comprehensive university exam question 1", "10-mark question 2"]
  },
  "vivaQuestions": [
    { "question": "Viva question 1?", "answer": "Concise, punchy answer for viva" },
    { "question": "Viva question 2?", "answer": "Concise answer" }
  ],
  "mcqs": [
    {
      "question": "Multiple choice question 1?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Clear explanation of why option 0 is correct"
    }
  ]
}`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        topicTitle: { type: Type.STRING },
        subject: { type: Type.STRING },
        definition: { type: Type.STRING },
        simpleExplanation: { type: Type.STRING },
        detailedExplanation: { type: Type.STRING },
        whyWhereUsed: { type: Type.STRING },
        syntax: { type: Type.STRING },
        example: { type: Type.STRING },
        code: { type: Type.STRING },
        codeExplanation: { type: Type.STRING },
        output: { type: Type.STRING },
        realLifeExample: { type: Type.STRING },
        importantPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        examQuestions: {
          type: Type.OBJECT,
          properties: {
            twoMarks: { type: Type.ARRAY, items: { type: Type.STRING } },
            fiveMarks: { type: Type.ARRAY, items: { type: Type.STRING } },
            tenMarks: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["twoMarks", "fiveMarks", "tenMarks"],
        },
        vivaQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ["question", "answer"],
          },
        },
        mcqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ["question", "options", "correctAnswer", "explanation"],
          },
        },
      },
      required: [
        "topicTitle",
        "definition",
        "simpleExplanation",
        "detailedExplanation",
        "importantPoints",
      ],
    },
  });

  const parsedData = parseAndNormalizeNoteResponse(
    text,
    topic.trim(),
    selectedSubject,
    selectedDifficulty,
    selectedNoteType
  );

  return {
    modelUsed,
    data: parsedData,
  };
}

export interface GenerateQuizParams {
  topic: string;
  subject?: string;
  questionCount?: number;
  difficulty?: string;
}

export async function generateQuizService(params: GenerateQuizParams) {
  const { topic, subject, questionCount = 5, difficulty = "Intermediate" } = params;

  if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
    const error: any = new Error("Please provide a valid topic to generate a quiz.");
    error.statusCode = 400;
    throw error;
  }

  const ai = getGeminiClient();
  const count = Math.min(Math.max(Number(questionCount) || 5, 3), 15);
  const selectedSubject = subject || "Computer Science";

  const promptText = `You are an expert college examiner creating an interactive, exam-oriented multiple choice quiz.
Create exactly ${count} challenging, realistic, and concept-clarifying multiple-choice questions for the topic: "${topic.trim()}" in Subject: "${selectedSubject}".
Target Difficulty: ${difficulty}.
Each question MUST have exactly 4 plausible options, a single correct answer index (0, 1, 2, or 3), and a clear student-friendly explanation of why the answer is correct.`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        quizTitle: { type: Type.STRING },
        topic: { type: Type.STRING },
        subject: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ["id", "question", "options", "correctAnswer", "explanation"],
          },
        },
      },
      required: ["quizTitle", "topic", "subject", "questions"],
    },
  });

  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  let parsedQuiz: any = null;
  try {
    parsedQuiz = JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      parsedQuiz = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
  }

  if (!parsedQuiz || !Array.isArray(parsedQuiz.questions)) {
    parsedQuiz = {
      quizTitle: `${topic} Quick Test`,
      topic: topic.trim(),
      subject: selectedSubject,
      difficulty,
      questions: [
        {
          id: 1,
          question: `Which of the following is true about ${topic}?`,
          options: [
            `Core concept in ${selectedSubject}`,
            "Deprecated legacy feature",
            "Hardware driver interrupt",
            "None of the above",
          ],
          correctAnswer: 0,
          explanation: `${topic} is a fundamental concept in ${selectedSubject}.`,
        },
      ],
    };
  }

  return {
    modelUsed,
    data: parsedQuiz,
  };
}
