import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  FileCode,
  CheckSquare,
  GraduationCap,
  BookHeart,
  Bookmark,
  ArrowRight
} from 'lucide-react';
import { StorageService } from '../services/storage.ts';
import { ModuleKey } from './Sidebar.tsx';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ModuleKey, entityId?: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'docs' | 'tasks' | 'study' | 'journal'>('all');

  const pages = useMemo(() => StorageService.getPages(), [isOpen]);
  const documents = useMemo(() => StorageService.getDocuments(), [isOpen]);
  const tasks = useMemo(() => StorageService.getTasks(), [isOpen]);
  const flashcards = useMemo(() => StorageService.getFlashcards(), [isOpen]);
  const vocab = useMemo(() => StorageService.getVocab(), [isOpen]);
  const journal = useMemo(() => StorageService.getJournal(), [isOpen]);
  const bookmarks = useMemo(() => StorageService.getBookmarks(), [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const res: { id: string; title: string; subtitle: string; type: string; module: ModuleKey; icon: any }[] = [];

    // Search Notes
    if (filterType === 'all' || filterType === 'notes') {
      pages.forEach((p) => {
        if (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          res.push({
            id: p.id,
            title: p.title || 'Untitled Note',
            subtitle: p.content.slice(0, 100).replace(/<[^>]*>/g, ''),
            type: 'Note',
            module: 'notebook',
            icon: FileText,
          });
        }
      });
    }

    // Search Documents & OCR text
    if (filterType === 'all' || filterType === 'docs') {
      documents.forEach((d) => {
        if (
          d.name.toLowerCase().includes(q) ||
          (d.extractedText && d.extractedText.toLowerCase().includes(q))
        ) {
          res.push({
            id: d.id,
            title: d.name,
            subtitle: d.extractedText ? d.extractedText.slice(0, 90) : 'Document Attachment',
            type: 'Document / OCR',
            module: 'documents',
            icon: FileCode,
          });
        }
      });
    }

    // Search Tasks
    if (filterType === 'all' || filterType === 'tasks') {
      tasks.forEach((t) => {
        if (t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
          res.push({
            id: t.id,
            title: t.title,
            subtitle: `Priority: ${t.priority} • Status: ${t.status}`,
            type: 'Task',
            module: 'tasks',
            icon: CheckSquare,
          });
        }
      });
    }

    // Search Study & Flashcards
    if (filterType === 'all' || filterType === 'study') {
      flashcards.forEach((f) => {
        if (f.front.toLowerCase().includes(q) || f.back.toLowerCase().includes(q)) {
          res.push({
            id: f.id,
            title: f.front,
            subtitle: f.back.slice(0, 80),
            type: 'Flashcard',
            module: 'study',
            icon: GraduationCap,
          });
        }
      });
      vocab.forEach((v) => {
        if (v.word.toLowerCase().includes(q) || v.definition.toLowerCase().includes(q)) {
          res.push({
            id: v.id,
            title: v.word,
            subtitle: v.definition,
            type: 'Vocabulary',
            module: 'study',
            icon: GraduationCap,
          });
        }
      });
    }

    // Search Journal & Bookmarks
    if (filterType === 'all' || filterType === 'journal') {
      journal.forEach((j) => {
        if (j.content.toLowerCase().includes(q) || (j.title && j.title.toLowerCase().includes(q))) {
          res.push({
            id: j.id,
            title: j.title || `Journal (${j.date})`,
            subtitle: j.content.slice(0, 80),
            type: 'Journal',
            module: 'personal',
            icon: BookHeart,
          });
        }
      });
      bookmarks.forEach((b) => {
        if (b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)) {
          res.push({
            id: b.id,
            title: b.title,
            subtitle: b.url,
            type: 'Bookmark',
            module: 'personal',
            icon: Bookmark,
          });
        }
      });
    }

    return res;
  }, [query, filterType, pages, documents, tasks, flashcards, vocab, journal, bookmarks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-2xl bg-white dark:bg-[#18221E] shadow-2xl rounded-3xl border border-[#E9E5DC] dark:border-[#263630] overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#E9E5DC] dark:border-[#263630]">
          <Search className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0]" />
          <input
            type="text"
            placeholder="Search notes, OCR texts, tasks, flashcards, legal cases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base bg-transparent border-none focus:outline-hidden text-[#242823] dark:text-[#F1F3EE] placeholder-[#777970] dark:placeholder-[#9AA096]"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono text-[#777970] dark:text-[#9AA096] bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] rounded-lg">
            ESC
          </kbd>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-2.5 bg-[#FAF8F3] dark:bg-[#111815] border-b border-[#E9E5DC] dark:border-[#263630] overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'notes', label: 'Notes' },
            { key: 'docs', label: 'Documents & OCR' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'study', label: 'Study & Vocab' },
            { key: 'journal', label: 'Journal & Links' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as any)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                filterType === f.key
                  ? 'bg-[#23483F] text-white dark:bg-[#3C7265]'
                  : 'text-[#777970] dark:text-[#9AA096] hover:bg-white dark:hover:bg-[#18221E]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-[#777970] dark:text-[#9AA096]">
              Type a word, subject, legal statute, or term to search across your whole workspace.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#777970] dark:text-[#9AA096]">
              No matches found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((r, idx) => {
                const Icon = r.icon;
                return (
                  <button
                    key={`${r.id}-${idx}`}
                    onClick={() => {
                      onNavigate(r.module, r.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FAF8F3] dark:hover:bg-[#111815] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] text-[#23483F] dark:text-[#A8B8A0]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#242823] dark:text-[#F1F3EE] truncate">
                            {r.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#263630] text-[#777970] dark:text-[#9AA096]">
                            {r.type}
                          </span>
                        </div>
                        {r.subtitle && (
                          <p className="text-xs text-[#777970] dark:text-[#9AA096] truncate mt-0.5">
                            {r.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#777970] group-hover:translate-x-1 group-hover:text-[#23483F] dark:group-hover:text-[#D6BD87] transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
