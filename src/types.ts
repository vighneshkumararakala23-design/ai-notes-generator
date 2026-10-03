export type SubjectType =
  | "Python"
  | "Data Structures"
  | "DBMS"
  | "AI & ML"
  | "Mathematics"
  | "Computer Networks"
  | "Operating Systems"
  | "C/C++"
  | "Other";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export type StudyMode =
  | "Quick Revision"
  | "Exam Preparation"
  | "Standard Notes"
  | "Deep Understanding"
  | "Last-Minute Revision"
  | "⚡ Quick Revision"
  | "📝 Exam Preparation"
  | "📚 Standard Notes"
  | "🧠 Deep Understanding"
  | "🚨 Last-Minute Revision";

export type LearningLevel =
  | "I know nothing about this topic"
  | "I know the basics"
  | "I am preparing for an exam"
  | "I only need revision"
  | "🌱 I know nothing about this topic"
  | "📖 I know the basics"
  | "🎓 I am preparing for an exam"
  | "🔄 I only need revision";

export type NoteType =
  | "Quick Revision"
  | "Detailed Notes"
  | "Exam Preparation"
  | "Interview Preparation"
  | "Beginner Friendly";

export type OutputLength = "Short" | "Medium" | "Detailed";

export interface ExamQuestions {
  twoMarks: string[];
  fiveMarks: string[];
  tenMarks: string[];
}

export interface VivaQuestion {
  question: string;
  answer: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface NoteContent {
  id?: string;
  topicTitle: string;
  subject: string;
  difficulty?: DifficultyLevel;
  studyMode?: StudyMode;
  learningLevel?: LearningLevel;
  noteType?: NoteType;
  outputLength?: OutputLength;
  createdAt?: string;
  updatedAt?: string;
  definition: string;
  simpleExplanation: string;
  detailedExplanation?: string;
  howItWorks?: string;
  whyWhereUsed?: string;
  syntax?: string;
  example?: string;
  code?: string;
  codeExplanation?: string;
  output?: string;
  realLifeExample?: string;
  importantPoints: string[];
  importantConcepts?: string[];
  commonMistakes?: string[];
  importantNotes?: string[];
  examQuestions?: ExamQuestions;
  vivaQuestions?: VivaQuestion[];
  mcqs?: MCQQuestion[];
  revisionSheet?: string;
  handwrittenSheet?: HandwrittenSheetData;
  sourceMaterialName?: string;
  useOnlyUploadedMaterial?: boolean;
  additionalInstructions?: string;
}

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
    type?: "flowchart" | "process" | "relationship" | "hierarchy" | "none";
    nodes: string[];
  };
  styleMode?: "clean" | "notebook" | "compact";
  paperStyle?: "ruled" | "grid" | "plain" | "parchment";
  inkColor?: "blue" | "dark" | "mixed" | "purple";
  handwritingFont?: "Kalam" | "Caveat" | "Patrick Hand";
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizData {
  quizTitle: string;
  topic: string;
  subject: string;
  difficulty?: string;
  questions: QuizQuestion[];
}

export interface QuizAttemptRecord {
  id: string;
  quizTitle: string;
  topic: string;
  subject: string;
  difficulty: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  date: string;
  userAnswers: Record<number, number>;
}

export interface StudentStats {
  topicsStudied: number;
  notesGenerated: number;
  notesSaved: number;
  revisionSheetsCreated: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  topicsCompleted: number;
}

export interface TeachMeStep {
  stepNumber: number;
  totalSteps: number;
  conceptTitle: string;
  explanation: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanationOfAnswer: string;
  nextConceptHint?: string;
  isFinalStep?: boolean;
}

export interface AskAiMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
