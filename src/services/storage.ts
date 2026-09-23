import { NoteContent, QuizAttemptRecord, StudentStats } from "../types";

const SAVED_NOTES_KEY = "ai_notes_saved";
const RECENT_NOTES_KEY = "ai_notes_recent";
const QUIZ_HISTORY_KEY = "ai_notes_quiz_history";
const STATS_KEY = "ai_notes_student_stats";
const THEME_KEY = "ai_notes_theme";

export function getSavedNotes(): NoteContent[] {
  try {
    const raw = localStorage.getItem(SAVED_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load saved notes from localStorage", e);
    return [];
  }
}

export function saveNote(note: NoteContent): NoteContent {
  const notes = getSavedNotes();
  const noteId = note.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const updatedNote: NoteContent = {
    ...note,
    id: noteId,
    createdAt: note.createdAt || new Date().toISOString(),
  };

  const existingIndex = notes.findIndex((n) => n.id === noteId);
  if (existingIndex >= 0) {
    notes[existingIndex] = updatedNote;
  } else {
    notes.unshift(updatedNote);
    incrementStat("notesSaved");
  }

  localStorage.setItem(SAVED_NOTES_KEY, JSON.stringify(notes));
  return updatedNote;
}

export function deleteSavedNote(id: string): void {
  const notes = getSavedNotes().filter((n) => n.id !== id);
  localStorage.setItem(SAVED_NOTES_KEY, JSON.stringify(notes));
}

export const deleteNote = deleteSavedNote;

export function getRecentNotes(): NoteContent[] {
  try {
    const raw = localStorage.getItem(RECENT_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load recent notes", e);
    return [];
  }
}

export function addRecentNote(note: NoteContent): void {
  try {
    const recent = getRecentNotes();
    const noteId = note.id || `note_${Date.now()}`;
    const cleanNote = { ...note, id: noteId, createdAt: note.createdAt || new Date().toISOString() };
    const filtered = recent.filter((n) => n.topicTitle.toLowerCase() !== note.topicTitle.toLowerCase());
    filtered.unshift(cleanNote);
    const trimmed = filtered.slice(0, 10);
    localStorage.setItem(RECENT_NOTES_KEY, JSON.stringify(trimmed));
    incrementStat("notesGenerated");
  } catch (e) {
    console.error("Failed to record recent note", e);
  }
}

export function getQuizHistory(): QuizAttemptRecord[] {
  try {
    const raw = localStorage.getItem(QUIZ_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to get quiz history", e);
    return [];
  }
}

export function recordQuizAttempt(attempt: Omit<QuizAttemptRecord, "id" | "date">): QuizAttemptRecord {
  const history = getQuizHistory();
  const newAttempt: QuizAttemptRecord = {
    ...attempt,
    id: `quiz_${Date.now()}`,
    date: new Date().toISOString(),
  };

  history.unshift(newAttempt);
  const trimmed = history.slice(0, 20);
  localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(trimmed));

  // Recalculate stats
  const totalCompleted = history.length;
  const avgScore = Math.round(
    history.reduce((acc, curr) => acc + curr.percentage, 0) / (totalCompleted || 1)
  );

  updateStats({
    quizzesCompleted: totalCompleted,
    averageQuizScore: avgScore,
  });

  return newAttempt;
}

export function getStudentStats(): StudentStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read stats", e);
  }

  // Calculate default based on current storage
  const saved = getSavedNotes();
  const recent = getRecentNotes();
  const quizzes = getQuizHistory();
  const avg = quizzes.length
    ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length)
    : 0;

  const defaultStats: StudentStats = {
    notesGenerated: Math.max(recent.length, saved.length),
    notesSaved: saved.length,
    quizzesCompleted: quizzes.length,
    averageQuizScore: avg,
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
  return defaultStats;
}

export function updateStats(partial: Partial<StudentStats>): StudentStats {
  const current = getStudentStats();
  const updated = { ...current, ...partial };
  localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  return updated;
}

export function incrementStat(key: keyof StudentStats): void {
  const current = getStudentStats();
  current[key] = (current[key] as number) + 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(current));
}

export function getThemePreference(): "light" | "dark" {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function setThemePreference(theme: "light" | "dark"): void {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
