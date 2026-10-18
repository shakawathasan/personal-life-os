import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  BookOpen,
  Copy,
  Check,
  FilePlus,
  HelpCircle,
  BrainCircuit,
  Scale,
  GraduationCap
} from 'lucide-react';
import { GeminiService, ChatMessage } from '../services/geminiService.ts';
import { StorageService } from '../services/storage.ts';
import { Page } from '../types.ts';

interface AIWorkspaceModuleProps {
  onNavigateToNote?: (pageId: string) => void;
}

export const AIWorkspaceModule: React.FC<AIWorkspaceModuleProps> = ({ onNavigateToNote }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  const quickPrompts = [
    {
      label: 'Socratic Tutor',
      prompt: 'Act as a Socratic university tutor. Test my understanding on a chosen topic with deep questions one at a time.',
      icon: GraduationCap,
    },
    {
      label: 'Legal Case Breakdown',
      prompt: 'Explain the core principles of negligence and the duty of care with modern case references.',
      icon: Scale,
    },
    {
      label: 'Simplify Concept',
      prompt: 'Explain marginal rate of substitution and indifference curves simply with a clear analogy.',
      icon: BrainCircuit,
    },
    {
      label: 'Essay Thesis Polish',
      prompt: 'Review this draft argument and provide constructive feedback on logical structure, clarity, and academic tone: ',
      icon: BookOpen,
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await GeminiService.chat(text, messages);
      setMessages([...newHistory, { role: 'assistant', content: response }]);
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to Gemini: ' + (err.message || 'Service unavailable'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotebook = (content: string, index: number) => {
    const now = new Date().toISOString();
    const newPage: Page = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      notebookId: 'default',
      title: `AI Study Notes - ${new Date().toLocaleDateString()}`,
      content: `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
      type: 'standard',
      tags: ['ai-study', 'gemini'],
      createdAt: now,
      updatedAt: now,
    };

    const pages = StorageService.getPages();
    pages.unshift(newPage);
    StorageService.savePages(pages);

    setSavedIndex(index);
    setTimeout(() => setSavedIndex(null), 2000);

    if (onNavigateToNote) {
      setTimeout(() => onNavigateToNote(newPage.id), 800);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 sm:px-6 border-b border-[#E9E5DC] dark:border-[#263630] bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#23483F]/10 dark:bg-[#3C7265]/20 text-[#23483F] dark:text-[#A8B8A0]">
            <Sparkles className="w-5 h-5 text-[#D6BD87]" />
          </div>
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#242823] dark:text-[#F1F3EE]">
              AI Academic Copilot
            </h2>
            <p className="text-xs text-[#777970] dark:text-[#9AA096]">
              Powered by Gemini 2.5 Flash • Contextual academic intelligence
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white"
          >
            Clear Conversation
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="py-12 space-y-8 text-center">
            <div className="max-w-md mx-auto space-y-2">
              <Sparkles className="w-12 h-12 mx-auto text-[#23483F] dark:text-[#3C7265] opacity-60" />
              <h3 className="font-editorial text-2xl font-bold text-[#23483F] dark:text-[#F1F3EE]">
                Academic Intelligence Workspace
              </h3>
              <p className="text-xs text-[#777970] dark:text-[#9AA096] leading-relaxed">
                Formulate essays, dissect judicial opinions, solve complex problem questions, or synthesize lectures into concise study guides.
              </p>
            </div>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
              {quickPrompts.map((qp, idx) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.prompt)}
                    className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] hover:border-[#23483F]/40 dark:hover:border-[#3C7265] text-left transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-[#23483F] dark:text-[#D6BD87]" />
                      <span className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE]">
                        {qp.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777970] dark:text-[#9AA096] line-clamp-2">
                      {qp.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#23483F] text-white dark:bg-[#3C7265] rounded-br-xs'
                    : 'bg-white dark:bg-[#18221E] text-[#242823] dark:text-[#F1F3EE] border border-[#E9E5DC] dark:border-[#263630] shadow-soft rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E9E5DC]/50 dark:border-[#263630]/50 text-xs">
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="flex items-center gap-1 text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleSaveToNotebook(msg.content, idx)}
                      className="flex items-center gap-1 text-[#23483F] dark:text-[#D6BD87] hover:underline font-semibold ml-2"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>{savedIndex === idx ? 'Saved to Notebook!' : 'Save to Notebook'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#777970] dark:text-[#9AA096] italic p-2">
            <Sparkles className="w-4 h-4 animate-spin text-[#D6BD87]" />
            <span>Gemini is synthesizing academic response...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 sm:px-6 border-t border-[#E9E5DC] dark:border-[#263630] bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            placeholder="Ask questions about lecture notes, legal precedents, or study concepts..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm rounded-2xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden focus:border-[#23483F] dark:focus:border-[#3C7265]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-3 text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-2xl shadow-xs transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
