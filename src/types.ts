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
  noteType?: NoteType;
  outputLength?: OutputLength;
  createdAt?: string;
  definition: string;
  simpleExplanation: string;
  detailedExplanation: string;
  whyWhereUsed: string;
  syntax?: string;
  example: string;
  code?: string;
  codeExplanation?: string;
  output?: string;
  realLifeExample: string;
  importantPoints: string[];
  commonMistakes: string[];
  examQuestions: ExamQuestions;
  vivaQuestions: VivaQuestion[];
  mcqs: MCQQuestion[];
  additionalInstructions?: string;
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
  notesGenerated: number;
  notesSaved: number;
  quizzesCompleted: number;
  averageQuizScore: number;
}
