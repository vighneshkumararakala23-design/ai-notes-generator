import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { GenerateNotesPage } from "./components/GenerateNotesPage";
import { NotesOutputView } from "./components/NotesOutputView";
import { EditNoteModal } from "./components/EditNoteModal";
import { MyNotesPage } from "./components/MyNotesPage";
import { QuizPage } from "./components/QuizPage";
import { DashboardPage } from "./components/DashboardPage";
import { AboutPage } from "./components/AboutPage";
import { NoteContent, SubjectType } from "./types";
import {
  getSavedNotes,
  getRecentNotes,
  getQuizHistory,
  getStudentStats,
  saveNote,
  deleteNote,
} from "./services/storage";

export default function App() {
  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>("home");

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_notes_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply dark mode class to root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("ai_notes_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("ai_notes_theme", "light");
    }
  }, [darkMode]);

  // Notes & User state
  const [activeNote, setActiveNote] = useState<NoteContent | null>(null);
  const [savedNotes, setSavedNotes] = useState<NoteContent[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteContent[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [stats, setStats] = useState(getStudentStats());

  // Edit modal state
  const [editingNote, setEditingNote] = useState<NoteContent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Cross-page navigation preload parameters
  const [preloadTopic, setPreloadTopic] = useState<string>("");
  const [preloadSubject, setPreloadSubject] = useState<SubjectType>("DBMS");

  // Refresh local data
  const refreshStorageData = () => {
    setSavedNotes(getSavedNotes());
    setRecentNotes(getRecentNotes());
    setQuizHistory(getQuizHistory());
    setStats(getStudentStats());
  };

  useEffect(() => {
    refreshStorageData();
  }, [currentTab]);

  // Handler: When user generates notes
  const handleNotesGenerated = (note: NoteContent) => {
    setActiveNote(note);
    refreshStorageData();
    setCurrentTab("output");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler: Open saved note in full viewer
  const handleOpenNote = (note: NoteContent) => {
    setActiveNote(note);
    setCurrentTab("output");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler: Open edit modal
  const handleEditNote = (note: NoteContent) => {
    setEditingNote(note);
    setIsEditModalOpen(true);
  };

  // Handler: Save edited note
  const handleSaveEditedNote = (updatedNote: NoteContent) => {
    saveNote(updatedNote);
    if (activeNote && activeNote.id === updatedNote.id) {
      setActiveNote(updatedNote);
    }
    refreshStorageData();
  };

  // Handler: Delete note
  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    refreshStorageData();
  };

  // Handler: Go to Quiz page with prefilled topic & subject
  const handleGenerateQuizForTopic = (topic: string, subject: string) => {
    setPreloadTopic(topic);
    setPreloadSubject((subject as SubjectType) || "DBMS");
    setCurrentTab("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler: Go to Generate page with prefilled topic & subject
  const handleNavigateToGenerate = (topic?: string, subject?: SubjectType) => {
    if (topic) setPreloadTopic(topic);
    if (subject) setPreloadSubject(subject);
    setCurrentTab("generate");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNewNoteClick={() => {
          setPreloadTopic("");
          setCurrentTab("generate");
        }}
      />

      {/* Main Content Pages */}
      <main className="flex-1">
        {currentTab === "home" && (
          <HomePage
            onStartGenerate={(presetTopic?: string, presetSubject?: string) =>
              handleNavigateToGenerate(presetTopic, presetSubject as SubjectType)
            }
            onExploreFeatures={() => {
              setCurrentTab("about");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenMyNotes={() => {
              setCurrentTab("my-notes");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {currentTab === "generate" && (
          <GenerateNotesPage
            onNotesGenerated={handleNotesGenerated}
            initialTopic={preloadTopic}
            initialSubject={preloadSubject}
          />
        )}

        {currentTab === "output" && activeNote && (
          <NotesOutputView
            note={activeNote}
            onRegenerate={() => {
              setPreloadTopic(activeNote.topicTitle);
              setPreloadSubject((activeNote.subject as SubjectType) || "DBMS");
              setCurrentTab("generate");
            }}
            onGenerateQuizForTopic={handleGenerateQuizForTopic}
            onEditNote={handleEditNote}
          />
        )}

        {currentTab === "output" && !activeNote && (
          <div className="max-w-xl mx-auto py-24 text-center px-4 space-y-4">
            <h3 className="text-xl font-bold">No active note selected</h3>
            <p className="text-sm text-gray-500">
              Generate a new study note or select one from your saved collection.
            </p>
            <button
              onClick={() => setCurrentTab("generate")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              Generate Notes
            </button>
          </div>
        )}

        {currentTab === "my-notes" && (
          <MyNotesPage
            notes={savedNotes}
            onOpenNote={handleOpenNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onNavigateToGenerate={() => handleNavigateToGenerate()}
          />
        )}

        {currentTab === "quiz" && (
          <QuizPage
            initialTopic={preloadTopic}
            initialSubject={preloadSubject}
            onNavigateToNotes={(topic, subject) => handleNavigateToGenerate(topic, subject as SubjectType)}
          />
        )}

        {currentTab === "dashboard" && (
          <DashboardPage
            stats={stats}
            recentNotes={recentNotes}
            savedNotes={savedNotes}
            quizHistory={quizHistory}
            onNavigateToGenerate={() => handleNavigateToGenerate()}
            onNavigateToQuiz={() => {
              setPreloadTopic("");
              setCurrentTab("quiz");
            }}
            onNavigateToMyNotes={() => setCurrentTab("my-notes")}
            onOpenNote={handleOpenNote}
          />
        )}

        {currentTab === "about" && (
          <AboutPage onStartGenerate={() => handleNavigateToGenerate()} />
        )}
      </main>

      {/* Edit Note Modal */}
      {editingNote && (
        <EditNoteModal
          note={editingNote}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingNote(null);
          }}
          onSave={handleSaveEditedNote}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={(tab) => setCurrentTab(tab)} />
    </div>
  );
}
