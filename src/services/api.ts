import { NoteContent, QuizData } from "../types";

export interface GenerateNotesRequest {
  topic: string;
  subject: string;
  difficulty: string;
  noteType: string;
  outputLength: string;
  additionalInstructions?: string;
}

export interface GenerateQuizRequest {
  topic: string;
  subject: string;
  questionCount: number;
  difficulty: string;
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
    difficulty: payload.difficulty as any,
    noteType: payload.noteType as any,
    outputLength: payload.outputLength as any,
    additionalInstructions: payload.additionalInstructions,
    createdAt: new Date().toISOString(),
  };

  return data;
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
