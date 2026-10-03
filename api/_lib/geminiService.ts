import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Centralized Gemini Model Configuration
const CONFIGURED_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = Array.from(
  new Set([
    CONFIGURED_MODEL,
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview",
  ].filter(Boolean))
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

// Executes content generation with automatic model fallback on temporary 503 / 429 errors and empty responses
export async function executeGeminiWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    maxOutputTokens?: number;
  }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    // Try up to 2 attempts per model (with backoff on transient 503 / 429)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini Engine] Requesting generation via model: ${modelName} (attempt ${attempt})`);
        const config: any = {};
        if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.responseSchema) config.responseSchema = options.responseSchema;
        if (options.maxOutputTokens) config.maxOutputTokens = options.maxOutputTokens;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config,
        });

        let responseText = "";
        try {
          responseText = response.text || "";
        } catch {
          // response.text accessor can throw if candidates structure differs
        }

        if (!responseText && response.candidates && response.candidates.length > 0) {
          const parts = response.candidates[0]?.content?.parts || [];
          responseText = parts.map((p: any) => p.text || "").join("").trim();
        }

        if (responseText && responseText.trim().length > 0) {
          console.log(`[Gemini Engine] Successfully generated content using ${modelName} (${responseText.length} chars)`);
          return { text: responseText.trim(), modelUsed: modelName };
        }

        // If empty response and responseSchema was specified, retry without strict responseSchema
        if (config.responseSchema) {
          console.log(`[Gemini Engine] Model ${modelName} returned empty with schema; retrying with JSON instruction only`);
          const fallbackConfig: any = {
            responseMimeType: "application/json",
            maxOutputTokens: options.maxOutputTokens,
          };
          if (options.systemInstruction) {
            fallbackConfig.systemInstruction = options.systemInstruction + " Generate valid JSON.";
          }
          const retryResponse = await ai.models.generateContent({
            model: modelName,
            contents: options.contents,
            config: fallbackConfig,
          });

          let retryText = "";
          try {
            retryText = retryResponse.text || "";
          } catch {}
          if (!retryText && retryResponse.candidates?.[0]?.content?.parts) {
            retryText = retryResponse.candidates[0].content.parts.map((p: any) => p.text || "").join("").trim();
          }
          if (retryText && retryText.trim().length > 0) {
            console.log(`[Gemini Engine] Relaxed schema retry succeeded on ${modelName}`);
            return { text: retryText.trim(), modelUsed: modelName };
          }
        }

        throw new Error("Empty response returned from model " + modelName);
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.statusCode || err?.code;
        console.warn(`[Gemini Engine] Model ${modelName} attempt ${attempt} encountered error:`, status || err?.message || err);

        // If explicit Auth or Missing Key error, do not retry
        if (status === 401 || status === 403 || err?.code === "MISSING_API_KEY") {
          throw err;
        }

        // If transient 503 or 429 on first attempt, wait 600ms and retry this model once
        if (attempt === 1 && (status === 503 || status === 429 || String(err?.message || "").includes("503"))) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break; // proceed to next fallback model
      }
    }
  }

  throw lastError || new Error("All configured Gemini models failed to generate content.");
}

// Helper to extract JSON even if slightly truncated or formatted with markdown
function tryExtractJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  // 1. Direct parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 2. Slice from first brace to last brace
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  // 3. If truncated, attempt to auto-close open quotes / arrays / objects
  if (firstBrace !== -1) {
    let sub = cleaned.substring(firstBrace);
    if (sub.endsWith("\\")) sub = sub.slice(0, -1);
    const suffixes = ['"}', '"]}', '"]}}', '"} }', '}'];
    for (const suffix of suffixes) {
      try {
        return JSON.parse(sub + suffix);
      } catch {}
    }
  }

  // 4. Regex extraction of key fields if JSON structure was broken
  const getField = (name: string): string => {
    const regex = new RegExp(`"${name}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "i");
    const match = cleaned.match(regex);
    if (match && match[1]) {
      try {
        return JSON.parse(`"${match[1]}"`);
      } catch {
        return match[1];
      }
    }
    return "";
  };

  const getArrayField = (name: string): string[] => {
    const regex = new RegExp(`"${name}"\\s*:\\s*\\[([^\\]]*)\\]`, "i");
    const match = cleaned.match(regex);
    if (match && match[1]) {
      const items: string[] = [];
      const itemRegex = /"((?:\\.|[^"\\])*)"/g;
      let m;
      while ((m = itemRegex.exec(match[1])) !== null) {
        items.push(m[1]);
      }
      return items;
    }
    return [];
  };

  const def = getField("definition");
  const simple = getField("simpleExplanation");
  const points = getArrayField("importantPoints");

  if (def || simple || points.length > 0) {
    return {
      topicTitle: getField("topicTitle"),
      definition: def,
      simpleExplanation: simple,
      importantPoints: points,
      howItWorks: getField("howItWorks"),
      example: getField("example"),
      realLifeExample: getField("realLifeExample"),
      syntax: getField("syntax"),
      code: getField("code"),
      codeExplanation: getField("codeExplanation"),
      importantNotes: getArrayField("importantNotes"),
      commonMistakes: getArrayField("commonMistakes"),
    };
  }

  return null;
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

  let parsed: any = tryExtractJson(rawText);

  if (!parsed || typeof parsed !== "object") {
    console.warn("[Gemini Parser] Raw response was not valid JSON, parsing markdown structure...");
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("{")) {
      cleanedText = cleanedText.replace(/^[{\s"]+topicTitle[":\s]+/, "");
    }
    parsed = {
      topicTitle: topic,
      subject: subject,
      definition: cleanedText.slice(0, 300),
      simpleExplanation: cleanedText.slice(0, 600),
      howItWorks: "",
      detailedExplanation: cleanedText.slice(0, 600),
      whyWhereUsed: "Widely applied in university coursework and exams.",
      example: "Core illustrative academic walkthrough for " + topic,
      realLifeExample: "Practical real-world application demonstrating " + topic,
      importantPoints: [
        "Core foundational concept for " + topic,
        "Critical exam definition and key properties",
        "High-yield revision takeaway for college evaluations",
      ],
      importantNotes: [
        "Review standard notation and definitions carefully before exams.",
      ],
      commonMistakes: [
        "Confusing edge conditions or forgetting standard notations",
      ],
    };
  }

  const rawImportantConcepts = parsed.importantConcepts || [];
  const importantConceptsArray: string[] = Array.isArray(rawImportantConcepts)
    ? rawImportantConcepts.map((c: any) => String(c).trim()).filter(Boolean)
    : [];

  const rawImportantPoints = parsed.importantPoints || parsed.keyPoints || [];
  const importantPointsArray: string[] = Array.isArray(rawImportantPoints)
    ? rawImportantPoints.map((p: any) => String(p).trim()).filter(Boolean)
    : typeof rawImportantPoints === "string"
    ? rawImportantPoints.split("\n").map((s: string) => s.replace(/^[-*•]\s*/, "").trim()).filter(Boolean)
    : ["Core exam concept", "Key properties and behaviors"];

  const rawImportantNotes = parsed.importantNotes || [];
  const importantNotesArray: string[] = Array.isArray(rawImportantNotes)
    ? rawImportantNotes.map((n: any) => String(n).trim()).filter(Boolean)
    : typeof rawImportantNotes === "string"
    ? rawImportantNotes.split("\n").map((s: string) => s.replace(/^[-*•]\s*/, "").trim()).filter(Boolean)
    : [];

  const rawCommonMistakes = parsed.commonMistakes || [];
  const commonMistakesArray: string[] = Array.isArray(rawCommonMistakes)
    ? rawCommonMistakes.map((m: any) => String(m).trim()).filter(Boolean)
    : typeof rawCommonMistakes === "string"
    ? rawCommonMistakes.split("\n").map((s: string) => s.replace(/^[-*•]\s*/, "").trim()).filter(Boolean)
    : [];

  const howItWorks = parsed.howItWorks || parsed.detailedExplanation || "";
  const realLife = parsed.realLifeExample || parsed.realLifeUse || parsed.whyWhereUsed || "";

  return {
    topicTitle: parsed.topicTitle || parsed.title || topic,
    subject: parsed.subject || subject,
    difficulty,
    noteType,
    definition: parsed.definition || "A foundational concept in " + subject + ".",
    simpleExplanation: parsed.simpleExplanation || parsed.simple_explanation || parsed.explanation || "",
    howItWorks: howItWorks,
    detailedExplanation: howItWorks,
    whyWhereUsed: realLife || "Applied across academic study and examinations.",
    syntax: parsed.syntax || "",
    example: parsed.example || "",
    code: parsed.code || "",
    codeExplanation: parsed.codeExplanation || parsed.code_explanation || "",
    output: parsed.output || "",
    realLifeExample: realLife,
    importantPoints: importantPointsArray.length > 0 ? importantPointsArray : ["Essential exam concept", "Key definition and properties"],
    importantConcepts: importantConceptsArray.length > 0 ? importantConceptsArray : [topic, "Core Architecture", "Practical Implementation"],
    importantNotes: importantNotesArray,
    commonMistakes: commonMistakesArray,
    examQuestions: parsed.examQuestions || {
      twoMarks: [],
      fiveMarks: [],
      tenMarks: [],
    },
    vivaQuestions: Array.isArray(parsed.vivaQuestions) ? parsed.vivaQuestions : [],
    mcqs: Array.isArray(parsed.mcqs) ? parsed.mcqs : [],
  };
}

export interface GenerateNotesParams {
  topic: string;
  subject?: string;
  difficulty?: string;
  studyMode?: string;
  learningLevel?: string;
  noteType?: string;
  outputLength?: string;
  sourceMaterialText?: string;
  sourceMaterialName?: string;
  useOnlyUploadedMaterial?: boolean;
  additionalInstructions?: string;
}

export async function generateNotesService(params: GenerateNotesParams) {
  const {
    topic,
    subject,
    difficulty,
    studyMode = "Exam Preparation",
    learningLevel = "I am preparing for an exam",
    noteType,
    outputLength,
    sourceMaterialText,
    sourceMaterialName,
    useOnlyUploadedMaterial = false,
    additionalInstructions,
  } = params;

  if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
    const error: any = new Error("Please enter a valid, meaningful topic name (at least 2 characters).");
    error.statusCode = 400;
    throw error;
  }

  const ai = getGeminiClient();

  const selectedSubject = subject || "Computer Science";
  const selectedDifficulty = difficulty || "Intermediate";
  const customInstructions = additionalInstructions ? additionalInstructions.trim() : "None";

  // Study Mode logic: inject exact instructional context for Gemini
  let studyModeInstruction = "";
  let targetTokens = 2200;

  const modeLower = (studyMode || "").toLowerCase();
  if (modeLower.includes("quick")) {
    studyModeInstruction = `STUDY MODE: Quick Revision.
INSTRUCTIONAL CONTEXT FOR AI:
The student selected "Quick Revision" mode.
- Focus strictly on high-impact summary points, essential definitions, and critical exam takeaways.
- Omit lengthy discursive paragraphs and exhaustive introductory filler.
- Use succinct, high-density bullet points designed for rapid 5-minute pre-exam review.
- Word count target: 300–500 words maximum.`;
    targetTokens = 2000;
  } else if (modeLower.includes("exam")) {
    studyModeInstruction = `STUDY MODE: Exam Preparation.
INSTRUCTIONAL CONTEXT FOR AI:
The student selected "Exam Preparation" mode.
- Heavily emphasize formal university exam definitions, core concept breakdowns, essential formulas, standard illustrative examples, and high-scoring key points.
- Highlight important technical keywords that examiners look for when grading papers.
- Include exam rules, limitations, and common student pitfalls where relevant.
- Word count target: 500–800 words standard.`;
    targetTokens = 3500;
  } else if (modeLower.includes("standard")) {
    studyModeInstruction = `STUDY MODE: Standard Notes.
INSTRUCTIONAL CONTEXT FOR AI:
The student selected "Standard Notes" mode.
- Provide a clear, balanced conceptual explanation with enough structural detail for comprehensive understanding.
- Explain the 'why' and 'how' of the concept logically with clear headings and bulleted takeaways.
- Word count target: 600–900 words.`;
    targetTokens = 3500;
  } else if (modeLower.includes("deep")) {
    studyModeInstruction = `STUDY MODE: Deep Understanding.
INSTRUCTIONAL CONTEXT FOR AI:
The student selected "Deep Understanding" mode.
- Explain underlying mechanics, step-by-step reasoning, architectural principles, edge cases, and concrete code/examples where applicable.
- Unpack nuanced technical details so the student gains true foundational mastery.
- Word count target: 800–1200 words.`;
    targetTokens = 4000;
  } else if (modeLower.includes("last-minute") || modeLower.includes("last minute")) {
    studyModeInstruction = `STUDY MODE: Last-Minute Revision.
INSTRUCTIONAL CONTEXT FOR AI:
The student selected "Last-Minute Revision" mode.
- Extract exclusively must-remember concepts, vital formulas, crucial keywords, and key differences.
- Zero filler sentences or lengthy introductory build-up; provide immediate, punchy high-yield revision points only.
- Word count target: 250–400 words maximum.`;
    targetTokens = 1800;
  } else {
    studyModeInstruction = `STUDY MODE: Exam Preparation.
INSTRUCTIONAL CONTEXT FOR AI:
Focus directly on university examination requirements: precise definitions, key points, formulas, examples, and scoring criteria.`;
    targetTokens = 3500;
  }

  // Learning Level logic
  let learningLevelInstruction = "";
  const levelLower = (learningLevel || "").toLowerCase();
  if (levelLower.includes("nothing")) {
    learningLevelInstruction = "STUDENT LEVEL: Absolute Beginner. Start from foundational basics with simple everyday analogies, intuitive language, and zero unexplained jargon.";
  } else if (levelLower.includes("basics")) {
    learningLevelInstruction = "STUDENT LEVEL: Intermediate. The student already knows the basics. Move straight to intermediate mechanics, syntax, working principles, and practical examples.";
  } else if (levelLower.includes("exam")) {
    learningLevelInstruction = "STUDENT LEVEL: Exam Candidate. Focus on scoring points, university syllabus patterns, precise definitions, formulas, and common exam traps.";
  } else if (levelLower.includes("revision")) {
    learningLevelInstruction = "STUDENT LEVEL: Revision Only. Do not provide long explanations or conversational build-up. Provide rapid, punchy revision points and keywords.";
  } else {
    learningLevelInstruction = "STUDENT LEVEL: Exam Candidate. Focus on definitions, core concepts, and exam revision.";
  }

  // Source material constraint
  let sourceMaterialSection = "";
  if (sourceMaterialText && sourceMaterialText.trim().length > 0) {
    const cleanMaterial = sourceMaterialText.trim().slice(0, 20000);
    if (useOnlyUploadedMaterial) {
      sourceMaterialSection = `
UPLOADED SOURCE MATERIAL:
${cleanMaterial}

CRITICAL STRICT CONSTRAINT:
You MUST answer using ONLY the uploaded study material provided above. Do NOT introduce external or unrelated information. If any information requested is not available in the uploaded material, clearly state: "That information is not available in the uploaded material." Do not pretend or invent facts.`;
    } else {
      sourceMaterialSection = `
UPLOADED REFERENCE MATERIAL:
${cleanMaterial}

Use this uploaded material as the primary reference while complementing with accurate academic knowledge where needed.`;
    }
  }

  const promptText = `You are an expert college academic tutor and exam-note creator.

Your task is to create concise, accurate and meaningful study notes for the student's requested topic.

Student input:
Subject: ${selectedSubject}
Topic: ${topic.trim()}
${studyModeInstruction}
${learningLevelInstruction}
Additional Instructions: ${customInstructions}
${sourceMaterialSection}

IMPORTANT WRITING RULES:
1. Explain only the requested topic.
2. Do not add unrelated information.
3. Do not write textbook-style paragraphs.
4. Avoid repetition.
5. Use short paragraphs and bullet points.
6. Explain difficult concepts using simple language.
7. Keep definitions precise.
8. Include only important information.
9. Prioritize information useful for understanding and revision.
10. Use examples only when they genuinely improve understanding.
11. Do not generate unnecessary sections.
12. Do not repeat the same idea in different words.
13. Do not add filler sentences.
14. Do not make the answer unnecessarily long.
15. Do not invent information.
16. Identify approximately 3–7 most important concepts/sub-topics.

STRUCTURE ADAPTABILITY:
Adapt the structure to the topic. Do NOT force every section onto every topic:
- Definition: Give a precise 1–3 sentence definition.
- Simple Explanation: Explain the concept in simple student-friendly language.
- Key Points (importantPoints): Give only the most important points (approx 4–8 bullet points). Highlight important keywords.
- Important Concepts (importantConcepts): List 3 to 7 key concept names (e.g. for Normalization: ["Functional Dependency", "1NF", "2NF", "3NF", "BCNF"]).
- How It Works (howItWorks): Explain the process/concept step-by-step when applicable. If not applicable, return "".
- Example (example): Give one clear example when useful. If not applicable, return "".
- Real-Life Use (realLifeExample): Give one practical application when relevant. If not applicable, return "".
- Syntax / Code (code): Only include this section for programming or technical topics where applicable (e.g. programming syntax, clean code snippet, or mathematical formula). For simple theoretical topics, return "".
- Code Explanation (codeExplanation): Concise explanation of the code or formula if provided; otherwise return "".
- Important Notes (importantNotes): Mention important exam points, rules, limitations, or key differences when relevant (approx 2–5 bullet points). If not applicable, return [].
- Common Mistakes (commonMistakes): Mention common student misconceptions or exam pitfalls when relevant (approx 2–4 bullet points). If not applicable, return [].

The student should be able to read and revise the notes quickly before an exam.
Generate ONLY the notes requested by the student in JSON. Do NOT include quizzes, viva questions, or mock exams in this response.`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    systemInstruction:
      "You are an expert college academic tutor and exam-note creator. Provide concise, accurate, meaningful study notes. Never output textbook filler or conversational chitchat. Generate strictly valid JSON matching the schema.",
    responseMimeType: "application/json",
    maxOutputTokens: targetTokens,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        topicTitle: { type: Type.STRING },
        subject: { type: Type.STRING },
        definition: { type: Type.STRING },
        simpleExplanation: { type: Type.STRING },
        importantPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        importantConcepts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        howItWorks: { type: Type.STRING },
        example: { type: Type.STRING },
        realLifeExample: { type: Type.STRING },
        syntax: { type: Type.STRING },
        code: { type: Type.STRING },
        codeExplanation: { type: Type.STRING },
        importantNotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        commonMistakes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        "topicTitle",
        "definition",
        "simpleExplanation",
        "importantPoints",
      ],
    },
  });

  const parsedData = parseAndNormalizeNoteResponse(
    text,
    topic.trim(),
    selectedSubject,
    selectedDifficulty,
    noteType || "Exam Preparation"
  );

  return {
    modelUsed,
    data: {
      ...parsedData,
      studyMode,
      learningLevel,
      sourceMaterialName,
      useOnlyUploadedMaterial,
    },
  };
}

// 5. Explain Simpler Micro-Service
export async function explainSimplerService(params: {
  conceptOrSection: string;
  topic: string;
  subject?: string;
}) {
  const { conceptOrSection, topic, subject = "Computer Science" } = params;
  if (!conceptOrSection || !conceptOrSection.trim()) {
    throw new Error("Please specify the concept or text to explain in simpler terms.");
  }

  const ai = getGeminiClient();
  const promptText = `You are a friendly, patient college tutor.
Explain the following concept from the topic "${topic}" (${subject}) in very simple, plain language that a complete beginner or first-year student can understand immediately.
Include one small, everyday relatable example.
Keep the explanation under 150 words. No dense jargon.

Concept to simplify:
"${conceptOrSection.trim()}"`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    systemInstruction: "You are a friendly tutor. Return concise JSON with simplifiedExplanation and simpleExample.",
    responseMimeType: "application/json",
    maxOutputTokens: 600,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        simplifiedExplanation: { type: Type.STRING },
        simpleExample: { type: Type.STRING },
      },
      required: ["simplifiedExplanation", "simpleExample"],
    },
  });

  const parsed = tryExtractJson(text) || {
    simplifiedExplanation: text.slice(0, 300),
    simpleExample: "Think of this like an everyday queue or filing cabinet.",
  };

  return {
    modelUsed,
    data: parsed,
  };
}

// 6. Show Example Micro-Service
export async function showExampleService(params: {
  concept: string;
  topic: string;
  subject?: string;
}) {
  const { concept, topic, subject = "Computer Science" } = params;
  if (!concept || !concept.trim()) {
    throw new Error("Please specify the concept to generate an example for.");
  }

  const ai = getGeminiClient();
  const promptText = `You are an expert academic tutor.
Generate one clear, concrete, and memorable example for this specific concept in "${topic}" (${subject}).
Explain briefly why this example accurately represents the concept.
Keep it concise, practical, and easy to memorize for college exams (100–180 words).

Concept:
"${concept.trim()}"`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    systemInstruction: "Return concise JSON with example and whyItRepresents.",
    responseMimeType: "application/json",
    maxOutputTokens: 600,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        example: { type: Type.STRING },
        whyItRepresents: { type: Type.STRING },
      },
      required: ["example", "whyItRepresents"],
    },
  });

  const parsed = tryExtractJson(text) || {
    example: "Practical illustrative walkthrough for " + concept,
    whyItRepresents: "It demonstrates the underlying mechanism in realistic context.",
  };

  return {
    modelUsed,
    data: parsed,
  };
}

// 7. Exam Questions Service
export async function generateExamQuestionsService(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
}) {
  const { topic, subject = "Computer Science", notesContext = "" } = params;
  const ai = getGeminiClient();

  const promptText = `You are an university exam board paper setter.
Generate standard university examination questions for the topic: "${topic}" (${subject}).
${notesContext ? `Context from student notes: ${notesContext.slice(0, 2000)}` : ""}

Generate:
- Exactly three 2-Mark short answer questions (definitions / state properties).
- Exactly two 5-Mark descriptive questions (explain mechanisms with diagrams / steps).
- Exactly one 10-Mark comprehensive essay question (comprehensive analysis / full derivation / implementation).`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    responseMimeType: "application/json",
    maxOutputTokens: 800,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        twoMarks: { type: Type.ARRAY, items: { type: Type.STRING } },
        fiveMarks: { type: Type.ARRAY, items: { type: Type.STRING } },
        tenMarks: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["twoMarks", "fiveMarks", "tenMarks"],
    },
  });

  const parsed = tryExtractJson(text) || {
    twoMarks: [`Define ${topic} and its primary properties.`, `State two advantages of ${topic}.`, `What is the significance of ${topic} in ${subject}?`],
    fiveMarks: [`Explain the working mechanism of ${topic} with a suitable example.`, `Differentiate between ${topic} and related concepts with a comparison table.`],
    tenMarks: [`Discuss ${topic} in detail with architecture, working principles, edge cases, and practical code implementation.`],
  };

  return {
    modelUsed,
    data: parsed,
  };
}

// 7. Viva Questions Service
export async function generateVivaQuestionsService(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
}) {
  const { topic, subject = "Computer Science", notesContext = "" } = params;
  const ai = getGeminiClient();

  const promptText = `You are a university laboratory viva examiner.
Create exactly 5 realistic, high-yield viva questions for the topic: "${topic}" in ${subject}.
${notesContext ? `Context: ${notesContext.slice(0, 2000)}` : ""}
Provide punchy, crisp, student-friendly model answers (1-2 sentences each).`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    responseMimeType: "application/json",
    maxOutputTokens: 800,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
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
      },
      required: ["vivaQuestions"],
    },
  });

  const parsed = tryExtractJson(text) || {
    vivaQuestions: [
      { question: `What is the core purpose of ${topic}?`, answer: `It provides a standardized, efficient solution in ${subject}.` },
      { question: `What is the time complexity or main cost associated with ${topic}?`, answer: `Generally optimal in balanced conditions and logarithmic or linear depending on input structure.` },
      { question: `Where is ${topic} commonly used in industry?`, answer: `In operating systems, database indexing, and network protocols.` },
    ],
  };

  return {
    modelUsed,
    data: parsed.vivaQuestions || [],
  };
}

// 7. Quick Revision Sheet Service
export async function generateRevisionSheetService(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
}) {
  const { topic, subject = "Computer Science", notesContext = "" } = params;
  const ai = getGeminiClient();

  const promptText = `You are an expert college tutor.
Generate an ultra-concise, 1-page exam revision cheat sheet for "${topic}" in ${subject}.
${notesContext ? `Reference: ${notesContext.slice(0, 2500)}` : ""}

Include:
- ⚡ 3 Must-Remember Rules / Formulas
- 🔑 5 High-Yield Exam Keywords & Definitions
- ⚖️ Key Comparison / Difference Table (if applicable)
- ⚠️ 2 Fatal Pitfalls to Avoid in the Exam Room
Format with clean markdown bullets and tables. Keep under 250 words total.`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    systemInstruction: "You are a concise exam coach. Output clean markdown revision sheet.",
    maxOutputTokens: 800,
  });

  return {
    modelUsed,
    data: {
      revisionSheet: text.trim(),
    },
  };
}

// NEW FEATURE: One-Page Handwritten Revision Sheet Content Extraction Service
export interface HandwrittenSheetData {
  title: string;
  subject: string;
  definition: string;
  keyPoints: string[];
  formulas?: string[];
  formulaOrRules?: string[];
  steps?: string[];
  differences?: string[];
  differencesOrTable?: {
    headers: string[];
    rows: string[][];
  };
  example?: string;
  tinyExample?: string;
  codeSnippet?: string;
  syntax?: string;
  output?: string;
  importantTerms?: string[];
  mustRememberKeywords?: string[];
  examTips: string[];
  diagram?: {
    title?: string;
    type?: string;
    nodes: string[];
  };
  styleMode?: "clean" | "notebook" | "compact";
  paperStyle?: "ruled" | "grid" | "plain" | "parchment";
  inkColor?: "blue" | "dark" | "mixed" | "purple";
  handwritingFont?: "Kalam" | "Caveat" | "Patrick Hand";
}

export async function generateHandwrittenSheetService(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
  existingNote?: any;
}) {
  const { topic, subject = "Computer Science", notesContext = "", existingNote } = params;
  const ai = getGeminiClient();

  // Build context from existing notes to avoid re-generating from scratch
  let combinedNotes = notesContext;
  if (!combinedNotes && existingNote) {
    combinedNotes = `Title: ${existingNote.topicTitle}
Subject: ${existingNote.subject}
Definition: ${existingNote.definition}
Explanation: ${existingNote.simpleExplanation}
Key Points: ${(existingNote.importantPoints || []).join("\n- ")}
How It Works: ${existingNote.howItWorks || existingNote.detailedExplanation || ""}
Example: ${existingNote.example || ""}
Code: ${existingNote.code || ""}
Important Notes / Mistakes: ${(existingNote.importantNotes || []).concat(existingNote.commonMistakes || []).join("\n- ")}`;
  }

  const promptText = `You are creating a one-page handwritten revision sheet for a college student.

Topic:
${topic}

Subject:
${subject}

Source Notes:
${combinedNotes.slice(0, 4500)}

Create an extremely concise revision sheet containing only the most important information needed to understand and revise this topic quickly.

STRICT RULES:
1. Everything must fit on exactly ONE A4 page.
2. Do not write textbook-style paragraphs.
3. Use short phrases and bullet points.
4. Remove repetition.
5. Remove unnecessary explanations.
6. Keep only exam-relevant information.
7. Prioritize definitions, formulas, rules, steps, key differences, important terms and small examples.
8. Use abbreviations only when they are commonly understood.
9. Do not add information that is not supported by the source notes unless it is necessary to correct an obvious formatting issue.
10. Do not create unnecessary sections.
11. Prefer keywords and concise phrases over sentences.
12. The result must be readable at a glance.
13. Never exceed the available one-page layout.

The final content should feel like a student's last-minute handwritten revision sheet.

Topic Specifics:
- Programming topics: Include definition, syntax, very short code (max 3-4 lines), key points.
- Math/Stats/ML topics: Include definition, formulas, variables/rules, tiny numerical example.
- DBMS/OS/Theory topics: Include definition, key concepts, progression/differences, normal forms/conditions.
- If a simple diagram/flow genuinely helps understanding (e.g. 1NF → 2NF → 3NF or Input → Process → Output), provide 3-5 sequential node labels in "diagram.nodes".`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    systemInstruction:
      "You are an expert academic revision assistant. Extract structured revision notes that strictly fit on ONE A4 page. Return JSON matching the schema.",
    responseMimeType: "application/json",
    maxOutputTokens: 950,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subject: { type: Type.STRING },
        definition: { type: Type.STRING },
        keyPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        formulas: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        steps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        differences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        differencesOrTable: {
          type: Type.OBJECT,
          properties: {
            headers: { type: Type.ARRAY, items: { type: Type.STRING } },
            rows: {
              type: Type.ARRAY,
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
        example: { type: Type.STRING },
        codeSnippet: { type: Type.STRING },
        syntax: { type: Type.STRING },
        output: { type: Type.STRING },
        importantTerms: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        examTips: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        diagram: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
      required: [
        "title",
        "subject",
        "definition",
        "keyPoints",
        "examTips",
        "importantTerms",
      ],
    },
  });

  const parsed = tryExtractJson(text);
  const fallbackData: HandwrittenSheetData = {
    title: topic,
    subject: subject,
    definition: existingNote?.definition || `${topic} is a core fundamental concept in ${subject}.`,
    keyPoints: existingNote?.importantPoints?.slice(0, 5) || [
      "Key property and working mechanism",
      "Standard university exam focal area",
      "Essential condition for correctness",
    ],
    formulas: existingNote?.importantNotes?.slice(0, 3) || [
      "Rule 1: Maintain balance and consistent state",
      "Rule 2: Respect boundary conditions",
    ],
    differencesOrTable: undefined,
    example: existingNote?.example?.slice(0, 100) || undefined,
    codeSnippet: existingNote?.code?.slice(0, 150) || undefined,
    examTips: existingNote?.commonMistakes?.slice(0, 3) || [
      "State definitions clearly before working through problems",
      "Remember time and space constraints",
    ],
    importantTerms: existingNote?.importantConcepts || [
      topic,
      "Complexity",
      "Optimal",
      "Invariance",
    ],
  };

  const finalFormulas = (Array.isArray(parsed?.formulas) && parsed.formulas.length > 0)
    ? parsed.formulas.slice(0, 4)
    : (Array.isArray(parsed?.formulaOrRules) && parsed.formulaOrRules.length > 0)
    ? parsed.formulaOrRules.slice(0, 4)
    : fallbackData.formulas;

  const finalData: HandwrittenSheetData = {
    title: parsed?.title || fallbackData.title,
    subject: parsed?.subject || fallbackData.subject,
    definition: parsed?.definition || fallbackData.definition,
    keyPoints: Array.isArray(parsed?.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints.slice(0, 6) : fallbackData.keyPoints,
    formulas: finalFormulas,
    formulaOrRules: finalFormulas,
    steps: Array.isArray(parsed?.steps) && parsed.steps.length > 0 ? parsed.steps.slice(0, 4) : undefined,
    differences: Array.isArray(parsed?.differences) && parsed.differences.length > 0 ? parsed.differences.slice(0, 4) : undefined,
    differencesOrTable: parsed?.differencesOrTable?.headers && parsed?.differencesOrTable?.rows ? parsed.differencesOrTable : undefined,
    example: parsed?.example || parsed?.tinyExample || fallbackData.example,
    tinyExample: parsed?.example || parsed?.tinyExample || fallbackData.example,
    codeSnippet: parsed?.codeSnippet || fallbackData.codeSnippet,
    syntax: parsed?.syntax || undefined,
    output: parsed?.output || undefined,
    examTips: Array.isArray(parsed?.examTips) && parsed.examTips.length > 0 ? parsed.examTips.slice(0, 3) : fallbackData.examTips,
    importantTerms: Array.isArray(parsed?.importantTerms) && parsed.importantTerms.length > 0
      ? parsed.importantTerms.slice(0, 8)
      : Array.isArray(parsed?.mustRememberKeywords) && parsed.mustRememberKeywords.length > 0
      ? parsed.mustRememberKeywords.slice(0, 8)
      : fallbackData.importantTerms,
    mustRememberKeywords: Array.isArray(parsed?.importantTerms) && parsed.importantTerms.length > 0
      ? parsed.importantTerms.slice(0, 8)
      : fallbackData.importantTerms,
    diagram: parsed?.diagram?.nodes && Array.isArray(parsed.diagram.nodes) && parsed.diagram.nodes.length >= 2
      ? {
          title: parsed.diagram.title || "Process Flow",
          type: (parsed.diagram.type as any) || "flowchart",
          nodes: parsed.diagram.nodes.slice(0, 5),
        }
      : undefined,
  };

  return {
    modelUsed,
    data: finalData,
  };
}

// 9. Ask AI About Notes Service
export async function askAiAboutNotesService(params: {
  question: string;
  topic: string;
  notesSummary: string;
  conversationHistory?: { role: "user" | "ai"; text: string }[];
}) {
  const { question, topic, notesSummary, conversationHistory = [] } = params;
  if (!question || !question.trim()) {
    throw new Error("Please enter a question to ask AI.");
  }

  const ai = getGeminiClient();

  let historyContext = "";
  if (conversationHistory.length > 0) {
    historyContext = conversationHistory
      .slice(-4)
      .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`)
      .join("\n");
  }

  const promptText = `You are an AI Study Assistant for college students.
The student has generated study notes on "${topic}". Answer their question accurately, concisely, and clearly based primarily on these notes.

STUDENT'S STUDY NOTES SUMMARY:
${notesSummary.slice(0, 4000)}

${historyContext ? `RECENT CONVERSATION:\n${historyContext}\n` : ""}

STUDENT'S QUESTION:
"${question.trim()}"

Keep your response student-friendly, focused, and under 180 words. If the answer is not related to the notes or topic, provide a helpful brief academic answer.`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    systemInstruction: "Answer concisely and helpfully. Keep response student-friendly, under 180 words.",
    maxOutputTokens: 500,
  });

  return {
    modelUsed,
    answer: text.trim(),
  };
}

// 15. Teach Me Mode (Interactive Step-by-Step Tutor)
export async function teachMeStepService(params: {
  topic: string;
  subject?: string;
  stepIndex: number;
  previousAnswers?: { stepIndex: number; selectedAnswer: number; isCorrect: boolean }[];
}) {
  const { topic, subject = "Computer Science", stepIndex = 0, previousAnswers = [] } = params;
  const ai = getGeminiClient();

  const totalSteps = 4;
  const currentStepNum = Math.min(Math.max(stepIndex + 1, 1), totalSteps);
  const isFinalStep = currentStepNum >= totalSteps;

  const promptText = `You are an interactive Socratic tutor teaching a college student the topic: "${topic}" (${subject}).
We break this topic down into ${totalSteps} small progressive concepts.
Currently, teach Step ${currentStepNum} of ${totalSteps}.

Rules:
1. Explain ONE small bite-sized concept (2–4 short sentences).
2. Formulate ONE simple, intuitive question to verify their understanding of that specific concept.
3. Provide 4 plausible options, specify the correctAnswer index (0, 1, 2, or 3), and give a clear student-friendly explanation of why it is correct.
4. If step ${currentStepNum} is ${totalSteps}, mark isFinalStep: true, otherwise false.`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    responseMimeType: "application/json",
    maxOutputTokens: 700,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        conceptTitle: { type: Type.STRING },
        explanation: { type: Type.STRING },
        question: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        correctAnswer: { type: Type.INTEGER },
        explanationOfAnswer: { type: Type.STRING },
        nextConceptHint: { type: Type.STRING },
        isFinalStep: { type: Type.BOOLEAN },
      },
      required: [
        "conceptTitle",
        "explanation",
        "question",
        "options",
        "correctAnswer",
        "explanationOfAnswer",
      ],
    },
  });

  let parsed = tryExtractJson(text);
  if (!parsed || !Array.isArray(parsed.options) || parsed.options.length < 2) {
    parsed = {
      conceptTitle: `Foundations of ${topic}`,
      explanation: `${topic} is a fundamental concept in ${subject}. It provides a systematic method to solve problems efficiently.`,
      question: `What is the primary objective of studying ${topic}?`,
      options: [
        "To achieve optimal and structured efficiency",
        "To replace hardware drivers",
        "To format disk partitions",
        "None of the above",
      ],
      correctAnswer: 0,
      explanationOfAnswer: `${topic} organizes computation and structure for efficiency.`,
      nextConceptHint: "Next, we will explore core mechanisms.",
      isFinalStep,
    };
  }

  return {
    modelUsed,
    data: {
      stepNumber: currentStepNum,
      totalSteps,
      ...parsed,
      isFinalStep: parsed.isFinalStep ?? isFinalStep,
    },
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

// ==========================================
// 16. EXAM ANSWER GENERATOR SERVICE (Feature 2)
// ==========================================
export interface GenerateExamAnswerParams {
  topic: string;
  subject?: string;
  answerType: "2 Marks" | "5 Marks" | "10 Marks" | "Definition" | "Difference Between";
  notesContext?: string;
}

export async function generateExamAnswerService(params: GenerateExamAnswerParams) {
  const { topic, subject = "Computer Science", answerType = "5 Marks", notesContext = "" } = params;
  const ai = getGeminiClient();

  let targetLengthPrompt = "";
  let tokenLimit = 800;

  switch (answerType) {
    case "2 Marks":
      targetLengthPrompt = `Produce a 2-MARK EXAM ANSWER (approx 35–60 words).
Structure:
1. Precise 1-sentence Definition
2. Exactly 2 high-scoring bullet points
3. (Optional) 1 tiny keyword / equation. Keep it ultra-compact.`;
      tokenLimit = 450;
      break;

    case "5 Marks":
      targetLengthPrompt = `Produce a 5-MARK EXAM ANSWER (approx 120–180 words).
Structure:
1. Formal Definition
2. Core Explanation / Working Principle
3. 3–5 Key Points with highlighted keywords
4. A small clean illustrative Example or tiny code snippet
5. Proper exam structure that scores full marks.`;
      tokenLimit = 850;
      break;

    case "10 Marks":
      targetLengthPrompt = `Produce a 10-MARK EXAM ANSWER (approx 280–420 words).
Structure:
1. Comprehensive Formal Definition & Significance
2. Detailed Theoretical Framework / Working Steps
3. Key Components / Architecture
4. Concrete Real-World or Code Example
5. Advantages vs Limitations / Key Conditions
6. Examiner Scoring Points: Essential keywords and diagram hint.`;
      tokenLimit = 1500;
      break;

    case "Definition":
      targetLengthPrompt = `Produce a DEFINITION ONLY (approx 30–50 words).
Structure:
1. Academic, syllabus-standard 1–2 sentence definition.
2. Formal mathematical notation, syntax, or acronym expansion where applicable.`;
      tokenLimit = 350;
      break;

    case "Difference Between":
      targetLengthPrompt = `Produce a DIFFERENCE BETWEEN / COMPARISON ANSWER (approx 150–220 words).
Structure:
1. Identify the two contrasting sub-concepts or entities in "${topic}"
2. Compare them across 4–6 clear criteria (e.g. Purpose, Working, Complexity, Example)
3. Provide a clear Markdown table comparison plus a concluding key takeaway.`;
      tokenLimit = 900;
      break;
  }

  const promptText = `You are a university exam examiner.
Write an exam-ready model answer for the topic: "${topic}" (${subject}).
Answer Type: ${answerType}.

${targetLengthPrompt}

Rules:
- Strictly base the answer on the provided study notes when available.
- Do NOT include generic conversational filler ("Sure, here is your answer").
- Format clearly with Markdown headers (###), bold keywords, and bullet points.

STUDY NOTES CONTEXT:
${(notesContext || "").slice(0, 4000)}`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    systemInstruction: "You are an expert college examiner. Write a crisp, full-marks exam answer.",
    maxOutputTokens: tokenLimit,
  });

  return {
    modelUsed,
    answerType,
    topic,
    answer: text.trim(),
  };
}

// ==========================================
// 17. INTERACTIVE TEACH ME TUTOR SERVICE (Feature 7)
// ==========================================
export interface TeachMeInteractParams {
  topic: string;
  subject?: string;
  notesContext?: string;
  stepNumber: number;
  totalSteps?: number;
  studentAnswer?: string;
  previousQuestion?: string;
  previousConcept?: string;
}

export async function teachMeInteractService(params: TeachMeInteractParams) {
  const {
    topic,
    subject = "Computer Science",
    notesContext = "",
    stepNumber = 1,
    totalSteps = 4,
    studentAnswer = "",
    previousQuestion = "",
    previousConcept = "",
  } = params;

  const ai = getGeminiClient();
  const isFinalStep = stepNumber >= totalSteps;

  const promptText = `You are a friendly Socratic academic tutor teaching a student "${topic}" (${subject}).
Teaching Stage: Step ${stepNumber} of ${totalSteps}.
${isFinalStep ? "This is the final concept step." : ""}

${
  studentAnswer
    ? `PREVIOUS STEP CONTEXT:
Concept Taught: "${previousConcept}"
Question Asked: "${previousQuestion}"
Student's Response: "${studentAnswer}"

TASK:
1. Evaluate the student's answer. Give immediate, kind, and clear feedback:
   - If correct: Praise them warmly ("Spot on!", "Exactly right!") and explain briefly why.
   - If partially correct or wrong: Gently correct them and give the missing insight without shaming.`
    : `TASK: Start the first interactive concept step for "${topic}".`
}

Next Concept to Teach in this step:
1. Explain ONE bite-sized concept clearly in 2–3 sentences.
2. Ask ONE intuitive, engaging question to test understanding (e.g. "What happens if...?" or "Why do we need...?").
3. Provide a helpful hint they can click if stuck.

STUDY NOTES CONTEXT:
${(notesContext || "").slice(0, 3000)}`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    responseMimeType: "application/json",
    maxOutputTokens: 750,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        feedbackOnPrevious: { type: Type.STRING },
        isPreviousCorrect: { type: Type.BOOLEAN },
        conceptTitle: { type: Type.STRING },
        conceptExplanation: { type: Type.STRING },
        question: { type: Type.STRING },
        hint: { type: Type.STRING },
        expectedKeyIdea: { type: Type.STRING },
      },
      required: ["conceptTitle", "conceptExplanation", "question", "hint"],
    },
  });

  const parsed = tryExtractJson(text) || {
    feedbackOnPrevious: studentAnswer ? "Good effort! Let's build on this." : "",
    isPreviousCorrect: true,
    conceptTitle: `Core Concept ${stepNumber} of ${topic}`,
    conceptExplanation: `${topic} is designed to solve structural and computational challenges cleanly.`,
    question: `Why is ${topic} essential in ${subject}?`,
    hint: "Think about efficiency and maintaining consistency.",
    expectedKeyIdea: "Maintaining data integrity and reducing overhead.",
  };

  return {
    modelUsed,
    stepNumber,
    totalSteps,
    isFinalStep,
    ...parsed,
  };
}

// ==========================================
// 18. PRACTICE / MULTI-MODE QUIZ SERVICE (Feature 6)
// ==========================================
export interface GeneratePracticeParams {
  topic: string;
  subject?: string;
  practiceType: "5_mcq" | "10_mcq" | "true_false" | "short_answer";
  notesContext?: string;
}

export async function generatePracticeQuestionsService(params: GeneratePracticeParams) {
  const { topic, subject = "Computer Science", practiceType = "5_mcq", notesContext = "" } = params;
  const ai = getGeminiClient();

  let count = 5;
  let typeDesc = "multiple-choice questions with 4 options";

  if (practiceType === "10_mcq") {
    count = 10;
    typeDesc = "multiple-choice questions with 4 options";
  } else if (practiceType === "true_false") {
    count = 6;
    typeDesc = "True/False conceptual questions (options: ['True', 'False'])";
  } else if (practiceType === "short_answer") {
    count = 5;
    typeDesc = "Short answer conceptual exam questions with sample ideal response";
  }

  const promptText = `You are an expert college examiner creating exam practice questions.
Topic: "${topic}" (${subject})
Format: ${count} ${typeDesc} based on the notes.

Rules:
1. Every question must directly test key concepts from the study notes.
2. For MCQs and True/False, provide exact options and correctAnswer index (0-based).
3. Provide a clear student-friendly explanation of why that answer is correct.
4. Provide a 'topicTag' (e.g. "Primary Keys", "1NF Dependency", "Loop Invariants") so students see what needs revision if missed.

STUDY NOTES CONTEXT:
${(notesContext || "").slice(0, 3500)}`;

  const { text, modelUsed } = await executeGeminiWithFallback(ai, {
    contents: promptText,
    responseMimeType: "application/json",
    maxOutputTokens: count > 6 ? 1600 : 1000,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        practiceTitle: { type: Type.STRING },
        topic: { type: Type.STRING },
        subject: { type: Type.STRING },
        practiceType: { type: Type.STRING },
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
              correctAnswerText: { type: Type.STRING },
              explanation: { type: Type.STRING },
              topicTag: { type: Type.STRING },
            },
            required: ["id", "question", "explanation", "topicTag"],
          },
        },
      },
      required: ["practiceTitle", "questions"],
    },
  });

  const parsed = tryExtractJson(text) || {
    practiceTitle: `${topic} Practice`,
    topic,
    subject,
    practiceType,
    questions: [
      {
        id: 1,
        question: `What is the main principle behind ${topic}?`,
        options: ["Correctness and optimization", "Unstructured redundancy", "Random allocation", "None"],
        correctAnswer: 0,
        correctAnswerText: "Correctness and optimization",
        explanation: `${topic} focuses on optimization and correctness.`,
        topicTag: "Core Definition",
      },
    ],
  };

  return {
    modelUsed,
    data: parsed,
  };
}
