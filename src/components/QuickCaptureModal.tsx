import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckSquare,
  Bookmark,
  BookHeart,
  Send,
  Calendar,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../services/storage.ts';
import { Page, TaskItem, BookmarkItem, JournalEntry } from '../types.ts';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'task' | 'bookmark' | 'journal'>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [url, setUrl] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'neutral' | 'challenging' | 'tired'>('good');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim() && !url.trim()) return;

    const now = new Date().toISOString();
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    if (activeTab === 'note') {
      const notebooks = StorageService.getNotebooks();
      const notebookId = notebooks.length > 0 ? notebooks[0].id : 'default';
      const newPage: Page = {
        id,
        notebookId,
        title: title.trim() || 'Quick Capture Note',
        content: content.trim() || 'No content provided.',
        type: 'standard',
        tags: ['quick-capture'],
        createdAt: now,
        updatedAt: now,
      };
      const pages = StorageService.getPages();
      pages.unshift(newPage);
      StorageService.savePages(pages);
      StorageService.addToSyncQueue({
        type: 'note',
        action: 'create',
        entityId: id,
        data: newPage,
      });
    } else if (activeTab === 'task') {
      const newTask: TaskItem = {
        id,
        title: title.trim() || 'Quick Task',
        description: content.trim(),
        status: 'todo',
        priority,
        dueDate: dueDate || undefined,
        tags: ['quick-capture'],
        createdAt: now,
        updatedAt: now,
      };
      const tasks = StorageService.getTasks();
      tasks.unshift(newTask);
      StorageService.saveTasks(tasks);
    } else if (activeTab === 'bookmark') {
      const newBookmark: BookmarkItem = {
        id,
        title: title.trim() || url,
        url: url.trim(),
        notes: content.trim(),
        isRead: false,
        createdAt: now,
      };
      const bookmarks = StorageService.getBookmarks();
      bookmarks.unshift(newBookmark);
      StorageService.saveBookmarks(bookmarks);
    } else if (activeTab === 'journal') {
      const newEntry: JournalEntry = {
        id,
        title: title.trim() || 'Daily Reflection',
        content: content.trim(),
        mood,
        date: new Date().toISOString().split('T')[0],
        tags: ['quick-capture'],
        createdAt: now,
      };
      const journal = StorageService.getJournal();
      journal.unshift(newEntry);
      StorageService.saveJournal(journal);
    }

    setIsSuccess(true);
    onRefreshData();
    setTimeout(() => {
      setIsSuccess(false);
      setTitle('');
      setContent('');
      setUrl('');
      setDueDate('');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-lg bg-white dark:bg-[#18221E] shadow-2xl rounded-3xl border border-[#E9E5DC] dark:border-[#263630] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E9E5DC] dark:border-[#263630]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0]" />
            <h3 className="font-editorial text-lg font-bold text-[#242823] dark:text-[#F1F3EE]">
              Universal Quick Capture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white hover:bg-[#FAF8F3] dark:hover:bg-[#263630] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-around border-b border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] p-1.5">
          {[
            { key: 'note', label: 'Note', icon: FileText },
            { key: 'task', label: 'Task', icon: CheckSquare },
            { key: 'bookmark', label: 'Link', icon: Bookmark },
            { key: 'journal', label: 'Journal', icon: BookHeart },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-white dark:bg-[#18221E] text-[#23483F] dark:text-[#F1F3EE] shadow-xs'
                    : 'text-[#777970] dark:text-[#9AA096] hover:text-[#242823]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {activeTab === 'bookmark' && (
            <div>
              <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                URL / Web Address
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden focus:border-[#23483F] dark:focus:border-[#3C7265]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
              {activeTab === 'task' ? 'Task Title' : activeTab === 'bookmark' ? 'Link Title (Optional)' : 'Title'}
            </label>
            <input
              type="text"
              placeholder={activeTab === 'note' ? 'Lecture key takeaway...' : activeTab === 'task' ? 'Finish revision paper...' : 'Short title...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden focus:border-[#23483F] dark:focus:border-[#3C7265]"
              autoFocus
            />
          </div>

          {activeTab === 'task' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
              </div>
            </div>
          )}

          {activeTab === 'journal' && (
            <div>
              <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                Today's Mood
              </label>
              <div className="flex items-center gap-2">
                {[
                  { key: 'great', label: '🌟 Great' },
                  { key: 'good', label: '🌿 Good' },
                  { key: 'neutral', label: '☕ Neutral' },
                  { key: 'tired', label: '💤 Tired' },
                  { key: 'challenging', label: '⚡ Heavy' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMood(m.key as any)}
                    className={`px-2.5 py-1 text-xs rounded-xl border transition-all ${
                      mood === m.key
                        ? 'bg-[#23483F] text-white border-transparent'
                        : 'bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] border-[#E9E5DC] dark:border-[#263630]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
              Details / Content
            </label>
            <textarea
              rows={3}
              placeholder="Jot down notes, context, or thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden focus:border-[#23483F] dark:focus:border-[#3C7265]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#777970] dark:text-[#9AA096] hover:bg-[#FAF8F3] dark:hover:bg-[#263630] rounded-xl border border-[#E9E5DC] dark:border-[#263630]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] dark:hover:bg-[#488677] rounded-xl shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSuccess ? 'Captured!' : 'Save Capture'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
