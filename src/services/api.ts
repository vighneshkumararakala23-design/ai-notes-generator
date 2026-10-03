import { NoteContent, QuizData, HandwrittenSheetData } from "../types";

export interface GenerateNotesRequest {
  topic: string;
  subject: string;
  difficulty?: string;
  studyMode?: string;
  learningLevel?: string;
  noteType?: string;
  outputLength?: string;
  additionalInstructions?: string;
}

export interface GenerateQuizRequest {
  topic: string;
  subject: string;
  questionCount: number;
  difficulty: string;
}

export interface ExplainSimplerResponse {
  simplifiedExplanation: string;
  simpleExample: string;
}

export interface ShowExampleResponse {
  example: string;
  whyItRepresents: string;
}

export interface ExamQuestionsResponse {
  twoMarks: string[];
  fiveMarks: string[];
  tenMarks: string[];
}

export interface VivaQuestionItem {
  question: string;
  answer: string;
}

export async function generateNotesApi(payload: GenerateNotesRequest): Promise<NoteContent> {
  let response: Response;
  try {
    response = await fetch("/api/generate-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to connect to Gemini. Check your internet connection and try again.");
  }

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    throw new Error("Unable to connect to Gemini. Check your internet connection and try again.");
  }

  if (!response.ok || !json.success) {
    const errorMsg = json.error || json.details || "Gemini returned an unexpected response. Please try again.";
    throw new Error(errorMsg);
  }

  const data: NoteContent = {
    ...json.data,
    difficulty: (payload.difficulty || "Intermediate") as any,
    studyMode: (payload.studyMode || "Exam Preparation") as any,
    learningLevel: (payload.learningLevel || "I am preparing for an exam") as any,
    noteType: (payload.noteType || "Exam Preparation") as any,
    outputLength: (payload.outputLength || "Medium") as any,
    additionalInstructions: payload.additionalInstructions,
    createdAt: new Date().toISOString(),
  };

  return data;
}

export async function explainSimplerApi(params: {
  conceptOrSection: string;
  topic: string;
  subject?: string;
}): Promise<ExplainSimplerResponse> {
  let response: Response;
  try {
    response = await fetch("/api/explain-simpler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to simplify concept.");
  }
  return json.data;
}

export async function showExampleApi(params: {
  concept: string;
  topic: string;
  subject?: string;
}): Promise<ShowExampleResponse> {
  let response: Response;
  try {
    response = await fetch("/api/show-example", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to generate example.");
  }
  return json.data;
}

export async function generateExamQuestionsApi(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
}): Promise<ExamQuestionsResponse> {
  let response: Response;
  try {
    response = await fetch("/api/generate-exam-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to generate exam questions.");
  }
  return json.data;
}

export async function generateVivaQuestionsApi(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
}): Promise<VivaQuestionItem[]> {
  let response: Response;
  try {
    response = await fetch("/api/generate-viva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to generate viva questions.");
  }
  return json.data;
}

export async function generateRevisionSheetApi(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
}): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/generate-revision-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to generate revision sheet.");
  }
  return json.data?.revisionSheet || "";
}

export async function generateHandwrittenSheetApi(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
  existingNote?: any;
}): Promise<HandwrittenSheetData> {
  let response: Response;
  try {
    response = await fetch("/api/generate-handwritten-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to generate handwritten revision sheet.");
  }
  return json.data as HandwrittenSheetData;
}

export async function askAiApi(params: {
  question: string;
  topic: string;
  notesSummary: string;
  conversationHistory?: { role: "user" | "ai"; text: string }[];
}): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/ask-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to get AI answer.");
  }
  return json.data?.answer || "";
}

export async function generateQuizApi(payload: GenerateQuizRequest): Promise<QuizData> {
  let response: Response;
  try {
    response = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to connect to Gemini. Check your internet connection and try again.");
  }

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    throw new Error("Unable to connect to Gemini. Check your internet connection and try again.");
  }

  if (!response.ok || !json.success) {
    const errorMsg = json.error || json.details || "Gemini returned an unexpected response. Please try again.";
    throw new Error(errorMsg);
  }

  return json.data as QuizData;
}

export async function generateExamAnswerApi(params: {
  topic: string;
  subject?: string;
  answerType: "2 Marks" | "5 Marks" | "10 Marks" | "Definition" | "Difference Between";
  notesContext?: string;
}): Promise<{ topic: string; answerType: string; answer: string }> {
  let response: Response;
  try {
    response = await fetch("/api/generate-exam-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to generate exam answer.");
  }
  return json.data;
}

export interface TeachMeStepData {
  stepNumber: number;
  totalSteps: number;
  isFinalStep: boolean;
  conceptTitle: string;
  conceptExplanation: string;
  question: string;
  hint: string;
  expectedKeyIdea?: string;
  feedbackOnPrevious?: string;
  isPreviousCorrect?: boolean;
}

export async function teachMeInteractApi(params: {
  topic: string;
  subject?: string;
  notesContext?: string;
  stepNumber: number;
  totalSteps?: number;
  studentAnswer?: string;
  previousQuestion?: string;
  previousConcept?: string;
}): Promise<TeachMeStepData> {
  let response: Response;
  try {
    response = await fetch("/api/teach-me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to run Teach Me tutor.");
  }
  return json.data as TeachMeStepData;
}

export interface PracticeQuestion {
  id: number;
  question: string;
  options?: string[];
  correctAnswer?: number;
  correctAnswerText?: string;
  explanation: string;
  topicTag: string;
}

export interface PracticeQuizData {
  practiceTitle: string;
  topic: string;
  subject: string;
  practiceType: string;
  questions: PracticeQuestion[];
}

export async function generatePracticeQuestionsApi(params: {
  topic: string;
  subject?: string;
  practiceType: "5_mcq" | "10_mcq" | "true_false" | "short_answer";
  notesContext?: string;
}): Promise<PracticeQuizData> {
  let response: Response;
  try {
    response = await fetch("/api/generate-practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error("Unable to connect to AI assistant. Please check your connection.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Failed to generate practice questions.");
  }
  return json.data as PracticeQuizData;
}

