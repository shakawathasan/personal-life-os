import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  FolderPlus,
  FilePlus,
  Search,
  Pin,
  Star,
  Trash2,
  CloudUpload,
  Printer,
  Download,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
  Share2,
  ChevronRight,
  Folder,
  FileText,
  Edit3,
  Columns,
  Scale,
  GraduationCap,
  HelpCircle,
  Copy,
  RotateCcw
} from 'lucide-react';
import { Notebook, Section, Page } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { syncNoteToDrive, getAccessToken } from '../services/googleDrive.ts';
import { GeminiService } from '../services/geminiService.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface NotebookModuleProps {
  initialPageId?: string;
  onOpenDriveModal: () => void;
  onAddFlashcardsFromNote?: (cards: { front: string; back: string }[]) => void;
}

export const NotebookModule: React.FC<NotebookModuleProps> = ({
  initialPageId,
  onOpenDriveModal,
  onAddFlashcardsFromNote,
}) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Page Editor States
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'synced' | 'error'>('saved');
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Modals
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<any>(null);

  // Initial Data Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedNotebooks = StorageService.getNotebooks();
    const loadedSections = StorageService.getSections();
    const loadedPages = StorageService.getPages().filter(p => !p.isTrash);

    setNotebooks(loadedNotebooks);
    setSections(loadedSections);
    setPages(loadedPages);

    if (initialPageId) {
      const target = loadedPages.find(p => p.id === initialPageId);
      if (target) {
        setSelectedPageId(target.id);
        setSelectedNotebookId(target.notebookId);
        setCurrentPage(target);
        return;
      }
    }

    if (loadedPages.length > 0) {
      setSelectedPageId(loadedPages[0].id);
      setSelectedNotebookId(loadedPages[0].notebookId);
      setCurrentPage(loadedPages[0]);
    } else {
      setSelectedPageId(null);
      setCurrentPage(null);
    }
  };

  // Change active page
  const handleSelectPage = (page: Page) => {
    setSelectedPageId(page.id);
    setSelectedNotebookId(page.notebookId);
    setCurrentPage({ ...page });
    setSaveStatus('saved');
  };

  // Create Notebook
  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) return;
    const now = new Date().toISOString();
    const newNb: Notebook = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      name: newNotebookName.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...notebooks, newNb];
    setNotebooks(updated);
    StorageService.saveNotebooks(updated);
    setSelectedNotebookId(newNb.id);
    setNewNotebookName('');
    setShowNewNotebookModal(false);

    // Auto-create first page in this notebook
    handleCreatePage(newNb.id);
  };

  // Create Page
  const handleCreatePage = (targetNotebookId?: string, type: Page['type'] = 'standard') => {
    let nbId = targetNotebookId || selectedNotebookId;
    if (!nbId) {
      if (notebooks.length === 0) {
        // Create default notebook first
        const now = new Date().toISOString();
        const firstNb: Notebook = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          name: 'General Notes',
          createdAt: now,
          updatedAt: now,
        };
        const updatedNb = [firstNb];
        setNotebooks(updatedNb);
        StorageService.saveNotebooks(updatedNb);
        nbId = firstNb.id;
      } else {
        nbId = notebooks[0].id;
      }
    }

    const now = new Date().toISOString();
    const newP: Page = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      notebookId: nbId,
      title: 'Untitled Note',
      content: '',
      type,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    const updatedPages = [newP, ...pages];
    setPages(updatedPages);
    StorageService.savePages(updatedPages);
    setSelectedPageId(newP.id);
    setCurrentPage(newP);
  };

  // Auto-Save Page Changes
  const handleUpdatePageFields = (fields: Partial<Page>) => {
    if (!currentPage) return;
    const updated: Page = {
      ...currentPage,
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    setCurrentPage(updated);
    setSaveStatus('saving');

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const allPages = StorageService.getPages();
      const idx = allPages.findIndex(p => p.id === updated.id);
      if (idx !== -1) {
        allPages[idx] = updated;
      } else {
        allPages.unshift(updated);
      }
      StorageService.savePages(allPages);
      setPages(allPages.filter(p => !p.isTrash));
      setSaveStatus('saved');
    }, 500);
  };

  // Rich Text Exec Command Helper
  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleUpdatePageFields({ content: editorRef.current.innerHTML });
    }
  };

  // Sync Current Note to Google Drive
  const handleSyncToDrive = async () => {
    if (!currentPage) return;
    const token = await getAccessToken();
    if (!token) {
      onOpenDriveModal();
      return;
    }

    setIsDriveSyncing(true);
    try {
      const result = await syncNoteToDrive(token, currentPage);
      handleUpdatePageFields({
        driveFileId: result.fileId,
        lastSyncedAt: result.modifiedTime,
      });
      setSaveStatus('synced');
    } catch (err: any) {
      console.error('Drive sync failed:', err);
      setSaveStatus('error');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // AI Assistance: Summarize or generate Cornell Cues
  const handleAiGenerateCornell = async () => {
    if (!currentPage || (!currentPage.content && !currentPage.title)) return;
    setAiLoading(true);
    setAiMessage(null);
    try {
      const plainText = currentPage.title + '\n' + currentPage.content.replace(/<[^>]*>/g, ' ');
      const res = await GeminiService.summarize(plainText, 'cornell');
      
      handleUpdatePageFields({
        type: 'cornell',
        cornellCues: res.cues || [],
        cornellSummary: res.summary || '',
      });
      setAiMessage('Cornell cues and summary generated!');
    } catch (err: any) {
      setAiMessage('AI processing error: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Assistance: Generate Flashcards from note
  const handleAiGenerateFlashcards = async () => {
    if (!currentPage || !currentPage.content) return;
    setAiLoading(true);
    setAiMessage(null);
    try {
      const plainText = currentPage.title + '\n' + currentPage.content.replace(/<[^>]*>/g, ' ');
      const cards = await GeminiService.generateQuiz(plainText, 5, 'flashcards');
      if (cards && cards.length > 0) {
        // Save to flashcard service
        const existingDecks = StorageService.getFlashcardDecks();
        let deckId = existingDecks[0]?.id;
        if (!deckId) {
          deckId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
          const newDeck = { id: deckId, name: currentPage.title || 'Lecture Study Cards', createdAt: new Date().toISOString() };
          StorageService.saveFlashcardDecks([newDeck]);
        }
        const existingCards = StorageService.getFlashcards();
        const newFlashcards = cards.map((c: any) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          deckId,
          front: c.front || 'Question',
          back: c.back || 'Answer',
          reviewCount: 0,
          createdAt: new Date().toISOString(),
        }));
        StorageService.saveFlashcards([...newFlashcards, ...existingCards]);
        setAiMessage(`Created ${newFlashcards.length} flashcards in Study Center!`);
      }
    } catch (err: any) {
      setAiMessage('Failed to generate flashcards: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Export note as Markdown
  const handleExportMarkdown = () => {
    if (!currentPage) return;
    const text = `# ${currentPage.title}\n\n${currentPage.content.replace(/<[^>]*>/g, '')}\n\n${
      currentPage.cornellSummary ? `## Summary\n${currentPage.cornellSummary}` : ''
    }`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPage.title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Word and reading stats
  const stats = React.useMemo(() => {
    if (!currentPage) return { words: 0, chars: 0, readTime: 0 };
    const text = (currentPage.title + ' ' + (currentPage.content || '').replace(/<[^>]*>/g, ' ')).trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readTime = Math.ceil(words / 200);
    return { words, chars, readTime };
  }, [currentPage]);

  // Filtered pages for listing
  const filteredPages = pages.filter((p) => {
    if (selectedNotebookId && p.notebookId !== selectedNotebookId) return false;
    if (filterTag && !p.tags.includes(filterTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Notebook Navigation Pane */}
      <div className="w-full lg:w-72 shrink-0 border-r border-[#E9E5DC] dark:border-[#263630] flex flex-col bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        
        {/* Notebooks Selector Bar */}
        <div className="p-3 border-b border-[#E9E5DC] dark:border-[#263630]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#777970] dark:text-[#9AA096] uppercase tracking-wider">
              Notebooks ({notebooks.length})
            </span>
            <button
              onClick={() => setShowNewNotebookModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-[#23483F] dark:text-[#D6BD87] hover:underline"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedNotebookId(null)}
              className={`px-2.5 py-1 text-xs rounded-xl transition-all whitespace-nowrap ${
                selectedNotebookId === null
                  ? 'bg-[#23483F] text-white dark:bg-[#3C7265]'
                  : 'bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] dark:text-[#9AA096] hover:bg-stone-100'
              }`}
            >
              All Pages
            </button>
            {notebooks.map((nb) => (
              <button
                key={nb.id}
                onClick={() => setSelectedNotebookId(nb.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl transition-all whitespace-nowrap ${
                  selectedNotebookId === nb.id
                    ? 'bg-[#23483F] text-white dark:bg-[#3C7265]'
                    : 'bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] dark:text-[#9AA096] hover:bg-stone-100'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{nb.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 border-b border-[#E9E5DC] dark:border-[#263630] space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#777970]" />
            <input
              type="text"
              placeholder="Filter notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleCreatePage(selectedNotebookId || undefined, 'standard')}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl transition-all"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Standard Note</span>
            </button>

            <button
              onClick={() => handleCreatePage(selectedNotebookId || undefined, 'cornell')}
              className="py-1.5 px-2.5 text-xs font-medium text-[#23483F] dark:text-[#D6BD87] bg-white dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-[#FAF8F3]"
              title="New Cornell Lecture Note"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleCreatePage(selectedNotebookId || undefined, 'casebrief')}
              className="py-1.5 px-2.5 text-xs font-medium text-[#23483F] dark:text-[#D6BD87] bg-white dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-[#FAF8F3]"
              title="New Legal Case Brief"
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Page List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPages.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#777970] dark:text-[#9AA096]">
              <p className="font-medium text-[#242823] dark:text-[#F1F3EE] mb-1">No notes found</p>
              <p>Click "Standard Note" to begin writing your university study notes.</p>
            </div>
          ) : (
            filteredPages.map((page) => {
              const isSelected = selectedPageId === page.id;
              return (
                <div
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-[#18221E] border-[#23483F]/30 dark:border-[#3C7265] shadow-sm'
                      : 'border-transparent hover:bg-white/60 dark:hover:bg-[#18221E]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      {page.type === 'cornell' ? (
                        <Columns className="w-3.5 h-3.5 text-[#23483F] dark:text-[#A8B8A0] shrink-0" />
                      ) : page.type === 'casebrief' ? (
                        <Scale className="w-3.5 h-3.5 text-[#D6BD87] shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#777970] shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-[#242823] dark:text-[#F1F3EE] truncate">
                        {page.title || 'Untitled'}
                      </span>
                    </div>

                    {page.isPinned && <Pin className="w-3 h-3 text-[#D6BD87] shrink-0" />}
                  </div>

                  <p className="text-[11px] text-[#777970] dark:text-[#9AA096] line-clamp-2 mt-1">
                    {page.content ? page.content.replace(/<[^>]*>/g, '') : 'Empty note...'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#777970] dark:text-[#9AA096] mt-2">
                    <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                    {page.driveFileId && (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Drive</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Page Workspace / Editor */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#141E1A]">
        {currentPage ? (
          <>
            {/* Editor Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3]/60 dark:bg-[#111815]/60">
              
              {/* Note Type & Status Indicator */}
              <div className="flex items-center gap-3">
                <select
                  value={currentPage.type}
                  onChange={(e) => handleUpdatePageFields({ type: e.target.value as any })}
                  className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] text-[#23483F] dark:text-[#F1F3EE]"
                >
                  <option value="standard">Standard Note</option>
                  <option value="cornell">Cornell Lecture Mode</option>
                  <option value="casebrief">Legal Case Brief</option>
                  <option value="statute">Statute / Law Article</option>
                  <option value="assignment">Assignment Workspace</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-[#777970] dark:text-[#9AA096]">
                  {saveStatus === 'saving' && <span className="animate-pulse">Saving...</span>}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  {saveStatus === 'synced' && (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Drive Synced
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-red-600">Sync Error</span>
                  )}
                </div>
              </div>

              {/* Actions & Utilities */}
              <div className="flex items-center gap-1.5">
                {/* AI Tools Dropdown/Action */}
                <button
                  onClick={handleAiGenerateCornell}
                  disabled={aiLoading}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#23483F] dark:text-[#D6BD87] bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-[#FAF8F3] transition-colors disabled:opacity-50"
                  title="Generate Cornell cues and executive summary"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">AI Cues</span>
                </button>

                <button
                  onClick={handleAiGenerateFlashcards}
                  disabled={aiLoading}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#23483F] dark:text-[#D6BD87] bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-[#FAF8F3] transition-colors disabled:opacity-50"
                  title="Extract high-yield study flashcards from this note"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flashcards</span>
                </button>

                {/* Drive Sync */}
                <button
                  onClick={handleSyncToDrive}
                  disabled={isDriveSyncing}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl transition-all disabled:opacity-50"
                  title="Sync note as Markdown to Google Drive"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Drive Sync</span>
                </button>

                {/* Print & Export */}
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-[#18221E]"
                  title="Print Note / Save PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="p-1.5 text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-[#18221E]"
                  title="Export Markdown file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPageToDelete(currentPage)}
                  className="p-1.5 text-[#777970] hover:text-red-600 dark:text-[#9AA096] dark:hover:text-red-400 rounded-lg hover:bg-white dark:hover:bg-[#18221E]"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AI Notification Alert */}
            {aiMessage && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <span>{aiMessage}</span>
                <button onClick={() => setAiMessage(null)} className="font-bold">×</button>
              </div>
            )}

            {/* Rich Text Toolbar */}
            <div className="no-print flex flex-wrap items-center gap-1 px-4 py-1.5 border-b border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3]/30 dark:bg-[#18221E]/30 text-xs">
              <button
                type="button"
                onClick={() => applyFormat('bold')}
                className="px-2 py-1 font-bold rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => applyFormat('italic')}
                className="px-2 py-1 italic rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => applyFormat('underline')}
                className="px-2 py-1 underline rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => applyFormat('strikeThrough')}
                className="px-2 py-1 line-through rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                S
              </button>
              <span className="w-px h-4 bg-[#E9E5DC] dark:bg-[#263630] mx-1" />
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', '<h1>')}
                className="px-2 py-1 font-bold rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', '<h2>')}
                className="px-2 py-1 font-bold rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', '<p>')}
                className="px-2 py-1 rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                Text
              </button>
              <span className="w-px h-4 bg-[#E9E5DC] dark:bg-[#263630] mx-1" />
              <button
                type="button"
                onClick={() => applyFormat('insertUnorderedList')}
                className="px-2 py-1 rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => applyFormat('insertOrderedList')}
                className="px-2 py-1 rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                1. List
              </button>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', '<blockquote>')}
                className="px-2 py-1 rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                Quote
              </button>
              <button
                type="button"
                onClick={() => applyFormat('hiliteColor', '#D6BD87')}
                className="px-2 py-1 rounded bg-[#D6BD87]/30 hover:bg-[#D6BD87]/60"
              >
                Highlight
              </button>
              <button
                type="button"
                onClick={() => applyFormat('insertHorizontalRule')}
                className="px-2 py-1 rounded hover:bg-stone-200 dark:hover:bg-[#263630]"
              >
                Divider
              </button>

              <div className="ml-auto flex items-center gap-3 text-[11px] text-[#777970] dark:text-[#9AA096]">
                <span>{stats.words} words</span>
                <span>•</span>
                <span>{stats.readTime} min read</span>
              </div>
            </div>

            {/* Main Note Canvas */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-4xl mx-auto w-full">
              
              {/* Note Title Input */}
              <input
                type="text"
                placeholder="Lecture Title or Topic..."
                value={currentPage.title}
                onChange={(e) => handleUpdatePageFields({ title: e.target.value })}
                className="w-full font-editorial text-2xl sm:text-4xl font-bold text-[#23483F] dark:text-[#F1F3EE] bg-transparent border-none focus:outline-hidden placeholder-stone-300 dark:placeholder-stone-700"
              />

              {/* Tags and Custom Properties */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-[#E9E5DC]/60 dark:border-[#263630]/60 pb-3">
                <Tag className="w-3.5 h-3.5 text-[#777970]" />
                <input
                  type="text"
                  placeholder="Add tags (e.g. #exam, #lecture4)..."
                  value={currentPage.tags.join(', ')}
                  onChange={(e) =>
                    handleUpdatePageFields({
                      tags: e.target.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
                    })
                  }
                  className="text-xs text-[#777970] dark:text-[#9AA096] bg-transparent border-none focus:outline-hidden"
                />
              </div>

              {/* Cornell Notes Mode Layout */}
              {currentPage.type === 'cornell' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-[#E9E5DC] dark:border-[#263630] rounded-2xl p-4 bg-[#FAF8F3]/50 dark:bg-[#111815]/50">
                    {/* Cues Column */}
                    <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-[#E9E5DC] dark:border-[#263630] pr-0 md:pr-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87] mb-2">
                        Cues & Questions
                      </h4>
                      <p className="text-[11px] text-[#777970] dark:text-[#9AA096] mb-3">
                        Write key recall questions, keywords, and dates here.
                      </p>
                      <textarea
                        rows={8}
                        value={(currentPage.cornellCues || []).join('\n')}
                        onChange={(e) =>
                          handleUpdatePageFields({
                            cornellCues: e.target.value.split('\n').filter(Boolean),
                          })
                        }
                        placeholder="- What is the ratio decidendi?&#10;- When was the treaty ratified?&#10;- Formula for marginal utility"
                        className="w-full text-xs font-mono p-3 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden"
                      />
                    </div>

                    {/* Notes Area */}
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87] mb-2">
                        Lecture Notes
                      </h4>
                      <div
                        ref={editorRef}
                        contentEditable
                        dangerouslySetInnerHTML={{ __html: currentPage.content }}
                        onBlur={(e) => handleUpdatePageFields({ content: e.currentTarget.innerHTML })}
                        className="min-h-[220px] text-sm leading-relaxed text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden p-3 rounded-xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]"
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87] mb-1">
                      Summary (Synthesis)
                    </h4>
                    <p className="text-[11px] text-[#777970] dark:text-[#9AA096] mb-2">
                      Brief 2-3 sentence wrap up of the primary takeaways.
                    </p>
                    <textarea
                      rows={3}
                      value={currentPage.cornellSummary || ''}
                      onChange={(e) => handleUpdatePageFields({ cornellSummary: e.target.value })}
                      placeholder="Synthesize the core message of the lecture here..."
                      className="w-full text-xs p-3 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : currentPage.type === 'casebrief' ? (
                /* Legal Case Brief Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#23483F] dark:text-[#D6BD87] block mb-1">
                        Case Citation & Court
                      </label>
                      <input
                        type="text"
                        value={currentPage.caseCitation || ''}
                        onChange={(e) => handleUpdatePageFields({ caseCitation: e.target.value })}
                        placeholder="e.g. [2021] UKSC 23, Supreme Court"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#23483F] dark:text-[#D6BD87] block mb-1">
                        Applicable Law & Statutes
                      </label>
                      <input
                        type="text"
                        value={currentPage.caseLaw || ''}
                        onChange={(e) => handleUpdatePageFields({ caseLaw: e.target.value })}
                        placeholder="e.g. Section 2, Sale of Goods Act"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#23483F] dark:text-[#D6BD87] block mb-1">
                      Material Facts
                    </label>
                    <textarea
                      rows={3}
                      value={currentPage.caseFacts || ''}
                      onChange={(e) => handleUpdatePageFields({ caseFacts: e.target.value })}
                      placeholder="Summary of the relevant facts that gave rise to the dispute..."
                      className="w-full text-xs p-3 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#23483F] dark:text-[#D6BD87] block mb-1">
                      Legal Issues
                    </label>
                    <textarea
                      rows={2}
                      value={currentPage.caseIssues || ''}
                      onChange={(e) => handleUpdatePageFields({ caseIssues: e.target.value })}
                      placeholder="What legal question did the court need to resolve?"
                      className="w-full text-xs p-3 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#23483F] dark:text-[#D6BD87] block mb-1">
                      Judgment & Legal Reasoning (Ratio Decidendi)
                    </label>
                    <textarea
                      rows={4}
                      value={currentPage.caseReasoning || ''}
                      onChange={(e) => handleUpdatePageFields({ caseReasoning: e.target.value })}
                      placeholder="Why did the judges rule the way they did? What tests or principles were established?"
                      className="w-full text-xs p-3 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE]"
                    />
                  </div>
                </div>
              ) : (
                /* Standard Rich Text Writing Surface */
                <div
                  ref={editorRef}
                  contentEditable
                  dangerouslySetInnerHTML={{ __html: currentPage.content }}
                  onBlur={(e) => handleUpdatePageFields({ content: e.currentTarget.innerHTML })}
                  className="min-h-[450px] text-base leading-relaxed text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden font-normal"
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F3] dark:bg-[#111815]">
            <BookOpen className="w-12 h-12 text-[#23483F] dark:text-[#3C7265] mb-3 opacity-60" />
            <h3 className="font-editorial text-xl font-bold text-[#242823] dark:text-[#F1F3EE]">
              University Study Notebook
            </h3>
            <p className="text-xs text-[#777970] dark:text-[#9AA096] max-w-sm mt-1 mb-6">
              Organize your academic lectures, case briefs, assignments, and research notes in one distraction-free writing environment.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCreatePage(undefined, 'standard')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs transition-all"
              >
                Write Your First Note
              </button>
              <button
                onClick={() => setShowNewNotebookModal(true)}
                className="px-4 py-2 text-xs font-semibold text-[#242823] dark:text-[#F1F3EE] bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-[#FAF8F3] transition-all"
              >
                Create Notebook
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Notebook Modal */}
      {showNewNotebookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm p-5 bg-white dark:bg-[#18221E] shadow-2xl rounded-2xl border border-[#E9E5DC] dark:border-[#263630]">
            <h3 className="text-base font-bold text-[#242823] dark:text-[#F1F3EE] mb-3">
              Create New Notebook
            </h3>
            <input
              type="text"
              placeholder="e.g. Constitutional Law, Biology 101"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewNotebookModal(false)}
                className="px-3 py-1.5 text-xs text-[#777970] rounded-xl border border-[#E9E5DC]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotebook}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!pageToDelete}
        title="Move Note to Trash"
        message={`Are you sure you want to delete "${pageToDelete?.title || 'Untitled'}"?`}
        confirmText="Delete Note"
        isDestructive={true}
        onConfirm={() => {
          if (!pageToDelete) return;
          const updated = pages.filter(p => p.id !== pageToDelete.id);
          StorageService.savePages(updated);
          setPages(updated);
          setPageToDelete(null);
          if (selectedPageId === pageToDelete.id) {
            setSelectedPageId(updated[0]?.id || null);
            setCurrentPage(updated[0] || null);
          }
        }}
        onCancel={() => setPageToDelete(null)}
      />
    </div>
  );
};
