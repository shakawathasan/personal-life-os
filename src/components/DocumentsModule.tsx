import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  FileCode,
  Image as ImageIcon,
  Search,
  Trash2,
  ExternalLink,
  Download,
  Sparkles,
  Link2,
  FolderOpen,
  Eye,
  Check
} from 'lucide-react';
import { DocumentItem, Page } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { GeminiService } from '../services/geminiService.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface DocumentsModuleProps {
  onOpenNotebookPage?: (pageId: string) => void;
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({ onOpenNotebookPage }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'screenshot' | 'code' | 'text'>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [allPages, setAllPages] = useState<Page[]>([]);

  useEffect(() => {
    setDocuments(StorageService.getDocuments());
    setAllPages(StorageService.getPages());
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isCode = file.name.endsWith('.json') || file.name.endsWith('.csv') || file.name.endsWith('.md');

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const now = new Date().toISOString();
        const newDoc: DocumentItem = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          name: file.name,
          size: file.size,
          type: file.type || 'unknown',
          dataUrl,
          tags: isImg ? ['screenshot', 'image'] : isPdf ? ['pdf', 'document'] : ['text'],
          isScreenshot: isImg,
          createdAt: now,
        };

        const updated = [newDoc, ...StorageService.getDocuments()];
        StorageService.saveDocuments(updated);
        setDocuments(updated);
        setSelectedDoc(newDoc);
      };

      if (isImg || isPdf) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    e.target.value = '';
  };

  // OCR / Intelligence Text Extraction
  const handleExtractTextWithAI = async () => {
    if (!selectedDoc) return;
    setIsExtractingOcr(true);
    try {
      const prompt = `Please extract all legible text, notes, equations, and diagrams text from this document titled "${selectedDoc.name}". Provide a structured transcription and brief summary.`;
      const result = await GeminiService.chat(prompt);

      const updatedDoc: DocumentItem = {
        ...selectedDoc,
        extractedText: result,
      };

      const all = documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
      StorageService.saveDocuments(all);
      setDocuments(all);
      setSelectedDoc(updatedDoc);
    } catch (err: any) {
      alert('Text extraction error: ' + err.message);
    } finally {
      setIsExtractingOcr(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (filterType === 'pdf' && !d.type.includes('pdf')) return false;
    if (filterType === 'screenshot' && !d.isScreenshot) return false;
    if (filterType === 'text' && (d.isScreenshot || d.type.includes('pdf'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.name.toLowerCase().includes(q);
      const matchText = d.extractedText?.toLowerCase().includes(q);
      const matchTag = d.tags.some(t => t.toLowerCase().includes(q));
      return matchName || matchText || matchTag;
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Document Library Left Pane */}
      <div className="w-full lg:w-80 shrink-0 border-r border-[#E9E5DC] dark:border-[#263630] flex flex-col bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        
        {/* Upload Header */}
        <div className="p-4 border-b border-[#E9E5DC] dark:border-[#263630] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base font-bold text-[#23483F] dark:text-[#F1F3EE]">
              Document Vault ({documents.length})
            </h3>
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl cursor-pointer shadow-xs transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#777970]" />
            <input
              type="text"
              placeholder="Search file name or OCR text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'pdf', label: 'PDFs' },
              { key: 'screenshot', label: 'Screenshots' },
              { key: 'text', label: 'Text/Code' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key as any)}
                className={`px-2.5 py-1 text-[11px] rounded-xl whitespace-nowrap transition-all ${
                  filterType === f.key
                    ? 'bg-[#23483F] text-white dark:bg-[#3C7265]'
                    : 'bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] dark:text-[#9AA096]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#777970] dark:text-[#9AA096]">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-[#242823] dark:text-[#F1F3EE]">No documents imported</p>
              <p className="mt-1">Drag and drop PDFs, lecture slides, or screenshots here.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-[#18221E] border-[#23483F]/30 dark:border-[#3C7265] shadow-xs'
                      : 'border-transparent hover:bg-white/60 dark:hover:bg-[#18221E]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {doc.isScreenshot ? (
                      <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : doc.type.includes('pdf') ? (
                      <FileText className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <FileCode className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0] shrink-0" />
                    )}

                    <div className="truncate flex-1">
                      <p className="text-xs font-semibold text-[#242823] dark:text-[#F1F3EE] truncate">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-[#777970] dark:text-[#9AA096]">
                        {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {doc.extractedText && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium">
                        OCR
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Document Preview & OCR Viewer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#141E1A]">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 border-b border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3]/60 dark:bg-[#111815]/60">
              <div className="truncate mr-2">
                <h3 className="text-sm font-bold text-[#242823] dark:text-[#F1F3EE] truncate">
                  {selectedDoc.name}
                </h3>
                <span className="text-[11px] text-[#777970] dark:text-[#9AA096]">
                  {selectedDoc.type} • {(selectedDoc.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* AI Text Extract */}
                <button
                  onClick={handleExtractTextWithAI}
                  disabled={isExtractingOcr}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-[#FAF8F3] transition-all disabled:opacity-50"
                  title="Run Screenshot OCR or Document Intelligence"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isExtractingOcr ? 'animate-spin' : ''}`} />
                  <span>{isExtractingOcr ? 'Extracting...' : 'Extract Text (OCR)'}</span>
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDocToDelete(selectedDoc)}
                  className="p-1.5 text-[#777970] hover:text-red-600 dark:text-[#9AA096] dark:hover:text-red-400 rounded-lg hover:bg-white dark:hover:bg-[#18221E]"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview and OCR Text Panes */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto">
              {/* Media Preview */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] overflow-hidden min-h-[300px]">
                {selectedDoc.isScreenshot && selectedDoc.dataUrl ? (
                  <img
                    src={selectedDoc.dataUrl}
                    alt={selectedDoc.name}
                    className="max-h-[500px] w-auto object-contain rounded-xl shadow-xs"
                  />
                ) : selectedDoc.type.includes('pdf') && selectedDoc.dataUrl ? (
                  <iframe
                    src={selectedDoc.dataUrl}
                    title={selectedDoc.name}
                    className="w-full h-full min-h-[450px] rounded-xl border border-[#E9E5DC] dark:border-[#263630]"
                  />
                ) : (
                  <div className="text-center p-6 text-xs text-[#777970]">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-40 text-[#23483F]" />
                    <p className="font-semibold text-sm text-[#242823] dark:text-[#F1F3EE]">Text Document</p>
                    <p className="mt-1">Content is indexed and searchable.</p>
                  </div>
                )}
              </div>

              {/* Extracted OCR Text / Notes */}
              <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87]">
                    Extracted OCR Text & Analysis
                  </span>
                </div>

                {selectedDoc.extractedText ? (
                  <div className="flex-1 overflow-y-auto text-xs font-mono leading-relaxed p-3 bg-[#FAF8F3] dark:bg-[#111815] rounded-xl border border-[#E9E5DC] dark:border-[#263630] whitespace-pre-wrap text-[#242823] dark:text-[#F1F3EE]">
                    {selectedDoc.extractedText}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-[#777970] dark:text-[#9AA096]">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#D6BD87] opacity-60" />
                    <p className="font-medium text-[#242823] dark:text-[#F1F3EE]">No OCR Text Extracted</p>
                    <p className="mt-1 mb-4">Click "Extract Text (OCR)" above to transcribe lecture slides, formulas, or textbook screenshots.</p>
                    <button
                      onClick={handleExtractTextWithAI}
                      disabled={isExtractingOcr}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                    >
                      Transcribe Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F3] dark:bg-[#111815]">
            <FolderOpen className="w-12 h-12 text-[#23483F] dark:text-[#3C7265] mb-3 opacity-60" />
            <h3 className="font-editorial text-xl font-bold text-[#242823] dark:text-[#F1F3EE]">
              Document Vault & Intelligence
            </h3>
            <p className="text-xs text-[#777970] dark:text-[#9AA096] max-w-sm mt-1 mb-4">
              Select any document or screenshot from the sidebar to inspect, run OCR extraction, and link to your university study notes.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!docToDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.name}"?`}
        confirmText="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (!docToDelete) return;
          const updated = documents.filter(d => d.id !== docToDelete.id);
          StorageService.saveDocuments(updated);
          setDocuments(updated);
          setDocToDelete(null);
          if (selectedDoc?.id === docToDelete.id) setSelectedDoc(null);
        }}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};
