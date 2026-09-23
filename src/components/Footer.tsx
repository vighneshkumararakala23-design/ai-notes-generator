import React from "react";
import { Sparkles, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">AI Notes</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Designed specifically for university & college students to transform complex syllabi into clear, exam-oriented notes, viva answers, and quizzes.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>15-Section Exam Note Guarantee</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-xs tracking-wider text-gray-900 dark:text-white uppercase mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("generate")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Generate Notes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("my-notes")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  My Saved Notes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("quiz")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  AI Quiz Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Student Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-xs tracking-wider text-gray-900 dark:text-white uppercase mb-3">
              Supported Subjects
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              <li>• Python & Data Structures</li>
              <li>• DBMS & SQL Normalization</li>
              <li>• Artificial Intelligence & ML</li>
              <li>• Computer Networks & OSI</li>
              <li>• Operating Systems & C/C++</li>
              <li>• Discrete Mathematics & Stats</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-semibold text-xs tracking-wider text-gray-900 dark:text-white uppercase mb-3">
              Exam Note Framework
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              Every note includes textbook definitions, real-world analogies, code implementations, 2/5/10-mark exam questions, viva answers, and interactive MCQs.
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                Optimized for semester exams & technical interviews
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-700 dark:text-gray-300 gap-3">
          <p>© {new Date().getFullYear()} AI Notes Generator. Powered by Google Gemini AI.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Student Focused
            </span>
            <span>•</span>
            <span>Instant PDF Export</span>
            <span>•</span>
            <span>Interactive Quizzes</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
