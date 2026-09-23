import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  Download,
  BookOpen,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import { NoteContent } from "../types";
import { downloadNotesAsPdf } from "../utils/exportPdf";

interface MyNotesPageProps {
  notes: NoteContent[];
  onOpenNote: (note: NoteContent) => void;
  onEditNote: (note: NoteContent) => void;
  onDeleteNote: (id: string) => void;
  onNavigateToGenerate: () => void;
}

export const MyNotesPage: React.FC<MyNotesPageProps> = ({
  notes,
  onOpenNote,
  onEditNote,
  onDeleteNote,
  onNavigateToGenerate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available subjects from saved notes
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    notes.forEach((n) => {
      if (n.subject) subs.add(n.subject);
    });
    return Array.from(subs);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesSearch =
          n.topicTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n.definition && n.definition.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (n.subject && n.subject.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSubject = selectedSubject === "all" || n.subject === selectedSubject;
        const matchesDifficulty = selectedDifficulty === "all" || n.difficulty === selectedDifficulty;

        return matchesSearch && matchesSubject && matchesDifficulty;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [notes, searchTerm, selectedSubject, selectedDifficulty, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My Saved Notes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Access, search, review, and export all your saved examination study notes.
          </p>
        </div>

        <button
          onClick={onNavigateToGenerate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      {notes.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes by topic, concept, or keyword..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Subjects ({notes.length})</option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="md:col-span-2">
              <button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const isDeleting = deleteConfirmId === note.id;
            return (
              <div
                key={note.id || note.topicTitle}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Subject & Difficulty badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {note.subject}
                    </span>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      {note.difficulty || "Intermediate"}
                    </span>
                  </div>

                  {/* Topic Title */}
                  <h3
                    onClick={() => onOpenNote(note)}
                    className="text-base sm:text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-2 transition-colors"
                  >
                    {note.topicTitle}
                  </h3>

                  {/* Note Type & Snippet */}
                  <div className="space-y-1.5">
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {note.noteType || "Exam Preparation"}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                      {note.definition}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Date & Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "Saved"}
                  </span>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenNote(note)}
                      title="Open Notes"
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditNote(note)}
                      title="Edit Notes"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadNotesAsPdf(note)}
                      title="Download PDF"
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {isDeleting ? (
                      <div className="flex items-center gap-1 pl-1">
                        <button
                          onClick={() => {
                            if (note.id) onDeleteNote(note.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(note.id || "")}
                        title="Delete note"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : notes.length > 0 ? (
        // No results matching search
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-3">
          <Search className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Matching Notes Found</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            No notes match your current search or filters. Try adjusting your query or resetting filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedSubject("all");
              setSelectedDifficulty("all");
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-2 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        // Sample Empty State as requested in User Prompt
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 sm:p-12 space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Your smart notes will appear here.
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You haven't saved any notes yet. Create exam-oriented notes for any college subject in seconds.
            </p>
          </div>
          <div>
            <button
              id="empty-state-generate-btn"
              onClick={onNavigateToGenerate}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ Generate Your First Notes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
