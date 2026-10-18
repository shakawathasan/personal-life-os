import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckSquare,
  GraduationCap,
  Scale,
  Cloud,
  FileText,
  Sparkles,
  Plus,
  ArrowRight,
  Pin,
  Calendar,
  Clock,
  ShieldCheck,
  FolderPlus
} from 'lucide-react';
import { StorageService } from '../services/storage.ts';
import { Page, TaskItem, Flashcard, DocumentItem, Notebook } from '../types.ts';
import { ModuleKey } from './Sidebar.tsx';

interface HomeDashboardProps {
  onNavigate: (module: ModuleKey, entityId?: string) => void;
  onOpenQuickCapture: () => void;
  onOpenDriveModal: () => void;
  driveConnected: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  onOpenQuickCapture,
  onOpenDriveModal,
  driveConnected,
}) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  useEffect(() => {
    setPages(StorageService.getPages().filter(p => !p.isTrash));
    setTasks(StorageService.getTasks());
    setFlashcards(StorageService.getFlashcards());
    setDocuments(StorageService.getDocuments());
    setNotebooks(StorageService.getNotebooks());
  }, []);

  const loadSampleAcademicData = () => {
    const now = new Date().toISOString();
    
    // Seed Sample Notebooks
    const nbLaw: Notebook = {
      id: 'nb-law-1',
      name: 'Constitutional Law',
      description: 'Fundamental rights, judicial review, separation of powers',
      createdAt: now,
      updatedAt: now,
    };
    const nbEcon: Notebook = {
      id: 'nb-econ-2',
      name: 'Microeconomics & Game Theory',
      description: 'Market equilibrium, consumer choice, nash equilibrium',
      createdAt: now,
      updatedAt: now,
    };
    StorageService.saveNotebooks([nbLaw, nbEcon]);

    // Seed Sample Cornell Lecture Note
    const samplePage1: Page = {
      id: 'page-cornell-1',
      notebookId: nbLaw.id,
      title: 'Judicial Review & Marbury v. Madison',
      type: 'cornell',
      content: '<h3>Origin of Judicial Review</h3><p>Chief Justice John Marshall established the foundational principle that the Supreme Court has the authority to declare legislative acts unconstitutional if they violate the supreme law of the land.</p><h3>Section 13 of the Judiciary Act of 1789</h3><p>The court held that Congress could not expand the original jurisdiction of the Supreme Court beyond what was explicitly enumerated in Article III.</p>',
      cornellCues: [
        'Who wrote the opinion for Marbury v Madison?',
        'Which statute was declared unconstitutional?',
        'Constitutional basis: Article III vs Article VI Supremacy Clause',
      ],
      cornellSummary: 'Marbury v. Madison (1803) cemented the power of constitutional judicial review, asserting that it is emphatically the province and duty of the judicial department to say what the law is.',
      tags: ['constitutional-law', 'precedent', 'exam-prep'],
      isPinned: true,
      createdAt: now,
      updatedAt: now,
    };

    // Seed Sample Legal Case Brief
    const samplePage2: Page = {
      id: 'page-casebrief-2',
      notebookId: nbLaw.id,
      title: 'Donoghue v Stevenson [1932] AC 562',
      type: 'casebrief',
      content: '',
      caseCitation: '[1932] UKHL 100, [1932] AC 562',
      caseLaw: 'Common Law of Tort, Duty of Care',
      caseFacts: 'The plaintiff drank ginger beer from an opaque glass bottle purchased by her friend in a café in Paisley. When the remainder was poured, a decomposed snail emerged. The plaintiff suffered severe gastroenteritis.',
      caseIssues: 'Can a manufacturer owe a direct duty of care to the ultimate consumer in the absence of a direct contractual relationship?',
      caseReasoning: 'Lord Atkin articulated the seminal "Neighbour Principle": You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour.',
      tags: ['tort-law', 'case-brief'],
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    };

    StorageService.savePages([samplePage1, samplePage2]);

    // Seed Sample Tasks
    const sampleTasks: TaskItem[] = [
      {
        id: 'task-1',
        title: 'Outline Constitutional Law midterm essay on Judicial Restraint',
        status: 'todo',
        priority: 'urgent',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        tags: ['academic'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-2',
        title: 'Review 20 Tort Law flashcards on Negligence duty of care',
        status: 'inprogress',
        priority: 'high',
        dueDate: new Date().toISOString().split('T')[0],
        tags: ['revision'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    StorageService.saveTasks(sampleTasks);

    // Seed Flashcards
    const sampleDeck = { id: 'deck-1', name: 'Constitutional Law Essentials', createdAt: now };
    StorageService.saveFlashcardDecks([sampleDeck]);
    const sampleCards: Flashcard[] = [
      {
        id: 'fc-1',
        deckId: 'deck-1',
        front: 'What is the "Neighbour Principle" established by Lord Atkin in Donoghue v Stevenson?',
        back: 'You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure persons so closely and directly affected by your act.',
        reviewCount: 0,
        createdAt: now,
      },
      {
        id: 'fc-2',
        deckId: 'deck-1',
        front: 'What is the difference between Ratio Decidendi and Obiter Dicta?',
        back: 'Ratio Decidendi is the binding legal reasoning crucial to the decision. Obiter Dicta are non-binding remarks made by judges in passing.',
        reviewCount: 0,
        createdAt: now,
      },
    ];
    StorageService.saveFlashcards(sampleCards);

    // Refresh state
    setPages([samplePage1, samplePage2]);
    setTasks(sampleTasks);
    setFlashcards(sampleCards);
    setNotebooks([nbLaw, nbEcon]);
  };

  const isWorkspaceEmpty = pages.length === 0 && tasks.length === 0 && documents.length === 0;

  // Active / urgent tasks
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const recentPages = pages.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FAF8F3] dark:bg-[#111815]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Greeting Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D6BD87]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#23483F] dark:text-[#F1F3EE]">
              Welcome to Personal Life OS
            </h1>
            <p className="text-xs text-[#777970] dark:text-[#9AA096] max-w-lg">
              Your unified workspace for university lectures, Cornell notes, legal research, study flashcards, and Google Drive cloud sync.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenQuickCapture}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] dark:hover:bg-[#488677] rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#D6BD87]" />
              <span>Quick Capture</span>
            </button>
            <button
              onClick={onOpenDriveModal}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                driveConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] border-[#E9E5DC] dark:border-[#263630]'
              }`}
            >
              <Cloud className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0]" />
              <span>{driveConnected ? 'Drive Connected' : 'Connect Drive'}</span>
            </button>
          </div>
        </div>

        {/* Empty State / First-Run Onboarding Cards (Section 15) */}
        {isWorkspaceEmpty && (
          <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-base font-bold text-amber-950 dark:text-amber-200">
                  Getting Started With Your Clean Workspace
                </h3>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Your workspace is pristine and unpolluted. Start by creating your real university subjects or take advantage of sample academic data.
                </p>
              </div>

              <button
                onClick={loadSampleAcademicData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-white dark:bg-[#18221E] border border-amber-300 dark:border-amber-800 rounded-xl hover:bg-amber-100/60 shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Academic Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => onNavigate('notebook')}
                className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-amber-200 dark:border-amber-900/60 text-left hover:border-[#23483F] transition-all group shadow-xs"
              >
                <BookOpen className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0] mb-2" />
                <h4 className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE] group-hover:text-[#23483F]">
                  1. Create Notebook
                </h4>
                <p className="text-[11px] text-[#777970] dark:text-[#9AA096] mt-1">
                  Start lecture notes or a course subject.
                </p>
              </button>

              <button
                onClick={onOpenDriveModal}
                className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-amber-200 dark:border-amber-900/60 text-left hover:border-[#23483F] transition-all group shadow-xs"
              >
                <Cloud className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0] mb-2" />
                <h4 className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE] group-hover:text-[#23483F]">
                  2. Connect Drive
                </h4>
                <p className="text-[11px] text-[#777970] dark:text-[#9AA096] mt-1">
                  Sync notes & backups to Google Cloud.
                </p>
              </button>

              <button
                onClick={() => onNavigate('documents')}
                className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-amber-200 dark:border-amber-900/60 text-left hover:border-[#23483F] transition-all group shadow-xs"
              >
                <FileText className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0] mb-2" />
                <h4 className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE] group-hover:text-[#23483F]">
                  3. Import PDF / Slide
                </h4>
                <p className="text-[11px] text-[#777970] dark:text-[#9AA096] mt-1">
                  Extract OCR text and link to study notes.
                </p>
              </button>

              <button
                onClick={() => onNavigate('tasks')}
                className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-amber-200 dark:border-amber-900/60 text-left hover:border-[#23483F] transition-all group shadow-xs"
              >
                <CheckSquare className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0] mb-2" />
                <h4 className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE] group-hover:text-[#23483F]">
                  4. Create Tasks
                </h4>
                <p className="text-[11px] text-[#777970] dark:text-[#9AA096] mt-1">
                  Plan exams, assignments, and milestones.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Metric Overview Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => onNavigate('notebook')}
            className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] cursor-pointer hover:border-[#23483F]/30 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-[#777970]">
              <span className="text-xs font-semibold">Study Notes</span>
              <BookOpen className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0]" />
            </div>
            <p className="text-2xl font-bold text-[#242823] dark:text-[#F1F3EE] mt-2">
              {pages.length}
            </p>
            <span className="text-[11px] text-[#777970] dark:text-[#9AA096]">
              {notebooks.length} notebooks
            </span>
          </div>

          <div
            onClick={() => onNavigate('tasks')}
            className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] cursor-pointer hover:border-[#23483F]/30 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-[#777970]">
              <span className="text-xs font-semibold">Active Tasks</span>
              <CheckSquare className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0]" />
            </div>
            <p className="text-2xl font-bold text-[#242823] dark:text-[#F1F3EE] mt-2">
              {pendingTasks.length}
            </p>
            <span className="text-[11px] text-[#777970] dark:text-[#9AA096]">
              {tasks.filter(t => t.priority === 'urgent').length} urgent
            </span>
          </div>

          <div
            onClick={() => onNavigate('study')}
            className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] cursor-pointer hover:border-[#23483F]/30 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-[#777970]">
              <span className="text-xs font-semibold">Flashcards</span>
              <GraduationCap className="w-4 h-4 text-[#D6BD87]" />
            </div>
            <p className="text-2xl font-bold text-[#242823] dark:text-[#F1F3EE] mt-2">
              {flashcards.length}
            </p>
            <span className="text-[11px] text-[#777970] dark:text-[#9AA096]">
              Spaced repetition
            </span>
          </div>

          <div
            onClick={onOpenDriveModal}
            className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] cursor-pointer hover:border-[#23483F]/30 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-[#777970]">
              <span className="text-xs font-semibold">Cloud Sync</span>
              <Cloud className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-[#242823] dark:text-[#F1F3EE] mt-2">
              {driveConnected ? '100%' : 'Offline'}
            </p>
            <span className="text-[11px] text-[#777970] dark:text-[#9AA096]">
              {driveConnected ? 'Google Drive active' : 'Click to connect'}
            </span>
          </div>
        </div>

        {/* Grid with Recent Notes & Today's Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Recent Notes */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0]" />
                <h3 className="font-editorial text-base font-bold text-[#242823] dark:text-[#F1F3EE]">
                  Recent University Notes
                </h3>
              </div>
              <button
                onClick={() => onNavigate('notebook')}
                className="text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentPages.length === 0 ? (
              <p className="text-xs text-[#777970] py-4 text-center">No recent notes yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => onNavigate('notebook', page.id)}
                    className="p-3 rounded-2xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] cursor-pointer hover:border-[#23483F]/40 transition-all flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <span className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE] truncate block">
                        {page.title || 'Untitled'}
                      </span>
                      <span className="text-[10px] text-[#777970] dark:text-[#9AA096]">
                        {page.type} • {new Date(page.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {page.isPinned && <Pin className="w-3.5 h-3.5 text-[#D6BD87] shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Tasks & Deadlines */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0]" />
                <h3 className="font-editorial text-base font-bold text-[#242823] dark:text-[#F1F3EE]">
                  Priorities & Deadlines
                </h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <p className="text-xs text-[#777970] py-4 text-center">All caught up! No pending deadlines.</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onNavigate('tasks')}
                    className="p-3 rounded-2xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] cursor-pointer hover:border-[#23483F]/40 transition-all flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <span className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE] truncate block">
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] text-[#777970] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Due: {task.dueDate}</span>
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
