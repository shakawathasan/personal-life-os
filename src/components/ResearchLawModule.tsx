import React, { useState, useEffect } from 'react';
import {
  Scale,
  BookOpen,
  FileText,
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Calendar,
  CheckSquare
} from 'lucide-react';
import { StorageService } from '../services/storage.ts';

interface CaseBriefRecord {
  id: string;
  name: string;
  citation: string;
  court: string;
  year: string;
  facts: string;
  issues: string;
  held: string;
  principle: string;
}

interface StatuteRecord {
  id: string;
  actTitle: string;
  sectionNumber: string;
  sectionHeading: string;
  text: string;
  commentary: string;
}

interface CitationItem {
  id: string;
  author: string;
  title: string;
  source: string;
  year: string;
  url?: string;
  style: 'APA' | 'OSCOLA' | 'Harvard' | 'MLA';
}

export const ResearchLawModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cases' | 'statutes' | 'citations'>('cases');
  const [cases, setCases] = useState<CaseBriefRecord[]>([]);
  const [statutes, setStatutes] = useState<StatuteRecord[]>([]);
  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Case Modal / Inputs
  const [showNewCase, setShowNewCase] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [caseCitation, setCaseCitation] = useState('');
  const [caseCourt, setCaseCourt] = useState('');
  const [caseYear, setCaseYear] = useState('');
  const [caseFacts, setCaseFacts] = useState('');
  const [caseIssues, setCaseIssues] = useState('');
  const [caseHeld, setCaseHeld] = useState('');
  const [casePrinciple, setCasePrinciple] = useState('');

  // New Statute Inputs
  const [showNewStatute, setShowNewStatute] = useState(false);
  const [statuteAct, setStatuteAct] = useState('');
  const [statuteSection, setStatuteSection] = useState('');
  const [statuteHeading, setStatuteHeading] = useState('');
  const [statuteText, setStatuteText] = useState('');
  const [statuteCommentary, setStatuteCommentary] = useState('');

  // New Citation Inputs
  const [showNewCitation, setShowNewCitation] = useState(false);
  const [citAuthor, setCitAuthor] = useState('');
  const [citTitle, setCitTitle] = useState('');
  const [citSource, setCitSource] = useState('');
  const [citYear, setCitYear] = useState('');
  const [citStyle, setCitStyle] = useState<'APA' | 'OSCOLA' | 'Harvard' | 'MLA'>('OSCOLA');

  useEffect(() => {
    // Load from storage or initialize empty
    try {
      const c = localStorage.getItem('personal_life_os_case_library');
      if (c) setCases(JSON.parse(c));
      const s = localStorage.getItem('personal_life_os_statute_library');
      if (s) setStatutes(JSON.parse(s));
      const cit = localStorage.getItem('personal_life_os_citations');
      if (cit) setCitations(JSON.parse(cit));
    } catch {}
  }, []);

  const saveCases = (items: CaseBriefRecord[]) => {
    setCases(items);
    localStorage.setItem('personal_life_os_case_library', JSON.stringify(items));
  };
  const saveStatutes = (items: StatuteRecord[]) => {
    setStatutes(items);
    localStorage.setItem('personal_life_os_statute_library', JSON.stringify(items));
  };
  const saveCitations = (items: CitationItem[]) => {
    setCitations(items);
    localStorage.setItem('personal_life_os_citations', JSON.stringify(items));
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;
    const item: CaseBriefRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      name: caseName.trim(),
      citation: caseCitation.trim(),
      court: caseCourt.trim(),
      year: caseYear.trim(),
      facts: caseFacts.trim(),
      issues: caseIssues.trim(),
      held: caseHeld.trim(),
      principle: casePrinciple.trim(),
    };
    saveCases([item, ...cases]);
    setCaseName('');
    setCaseCitation('');
    setCaseCourt('');
    setCaseYear('');
    setCaseFacts('');
    setCaseIssues('');
    setCaseHeld('');
    setCasePrinciple('');
    setShowNewCase(false);
  };

  const handleCreateStatute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statuteAct.trim()) return;
    const item: StatuteRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      actTitle: statuteAct.trim(),
      sectionNumber: statuteSection.trim(),
      sectionHeading: statuteHeading.trim(),
      text: statuteText.trim(),
      commentary: statuteCommentary.trim(),
    };
    saveStatutes([item, ...statutes]);
    setStatuteAct('');
    setStatuteSection('');
    setStatuteHeading('');
    setStatuteText('');
    setStatuteCommentary('');
    setShowNewStatute(false);
  };

  const handleCreateCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citTitle.trim()) return;
    const item: CitationItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      author: citAuthor.trim(),
      title: citTitle.trim(),
      source: citSource.trim(),
      year: citYear.trim(),
      style: citStyle,
    };
    saveCitations([item, ...citations]);
    setCitAuthor('');
    setCitTitle('');
    setCitSource('');
    setCitYear('');
    setShowNewCitation(false);
  };

  const formatCitation = (c: CitationItem): string => {
    if (c.style === 'OSCOLA') {
      return `${c.author}, '${c.title}' [${c.year}] ${c.source}`;
    } else if (c.style === 'APA') {
      return `${c.author} (${c.year}). ${c.title}. ${c.source}.`;
    } else if (c.style === 'Harvard') {
      return `${c.author}, ${c.year}. ${c.title}. ${c.source}.`;
    }
    return `${c.author}. "${c.title}." ${c.source}, ${c.year}.`;
  };

  const handleCopyCitation = (c: CitationItem) => {
    navigator.clipboard.writeText(formatCitation(c));
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 border-b border-[#E9E5DC] dark:border-[#263630] bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0]" />
          <h2 className="font-editorial text-lg font-bold text-[#242823] dark:text-[#F1F3EE]">
            Research & Law Hub
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] text-xs">
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'cases'
                  ? 'bg-white dark:bg-[#18221E] text-[#23483F] dark:text-[#F1F3EE] font-semibold shadow-xs'
                  : 'text-[#777970] dark:text-[#9AA096]'
              }`}
            >
              Case Law ({cases.length})
            </button>
            <button
              onClick={() => setActiveTab('statutes')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'statutes'
                  ? 'bg-white dark:bg-[#18221E] text-[#23483F] dark:text-[#F1F3EE] font-semibold shadow-xs'
                  : 'text-[#777970] dark:text-[#9AA096]'
              }`}
            >
              Statutes ({statutes.length})
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'citations'
                  ? 'bg-white dark:bg-[#18221E] text-[#23483F] dark:text-[#F1F3EE] font-semibold shadow-xs'
                  : 'text-[#777970] dark:text-[#9AA096]'
              }`}
            >
              Citations ({citations.length})
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'cases') setShowNewCase(true);
              else if (activeTab === 'statutes') setShowNewStatute(true);
              else setShowNewCitation(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'cases' && (
          <div className="space-y-4">
            {cases.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <Scale className="w-12 h-12 mx-auto text-[#777970] mb-2 opacity-40" />
                <h4 className="font-bold text-base text-[#242823] dark:text-[#F1F3EE]">No Legal Cases Logged</h4>
                <p className="text-xs text-[#777970] mt-1 mb-4">Record precedents, material facts, ratio decidendi, and citations.</p>
                <button
                  onClick={() => setShowNewCase(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Add First Case
                </button>
              </div>
            ) : (
              cases.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-editorial text-base font-bold text-[#23483F] dark:text-[#F1F3EE]">
                        {c.name}
                      </h3>
                      <p className="text-xs font-mono text-[#D6BD87] mt-0.5">
                        {c.citation} • {c.court} ({c.year})
                      </p>
                    </div>
                    <button
                      onClick={() => saveCases(cases.filter(x => x.id !== c.id))}
                      className="p-1.5 text-[#777970] hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {c.principle && (
                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[10px] block mb-1">
                        Legal Principle / Ratio
                      </span>
                      <p className="text-amber-900/90 dark:text-amber-200">{c.principle}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {c.facts && (
                      <div className="p-3 rounded-xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630]">
                        <span className="font-bold text-[#23483F] dark:text-[#D6BD87] block mb-1">Material Facts</span>
                        <p className="text-[#777970] dark:text-[#9AA096]">{c.facts}</p>
                      </div>
                    )}
                    {c.held && (
                      <div className="p-3 rounded-xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630]">
                        <span className="font-bold text-[#23483F] dark:text-[#D6BD87] block mb-1">Court Ruling & Reasoning</span>
                        <p className="text-[#777970] dark:text-[#9AA096]">{c.held}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'statutes' && (
          <div className="space-y-4">
            {statutes.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <BookOpen className="w-12 h-12 mx-auto text-[#777970] mb-2 opacity-40" />
                <h4 className="font-bold text-base text-[#242823] dark:text-[#F1F3EE]">No Statutes Saved</h4>
                <p className="text-xs text-[#777970] mt-1 mb-4">Store constitutional articles, statutes, acts, and your own legal analysis.</p>
                <button
                  onClick={() => setShowNewStatute(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Add Statute Section
                </button>
              </div>
            ) : (
              statutes.map((s) => (
                <div key={s.id} className="p-5 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#D6BD87]">
                        {s.actTitle}
                      </span>
                      <h3 className="text-sm font-bold text-[#242823] dark:text-[#F1F3EE]">
                        Section {s.sectionNumber}: {s.sectionHeading}
                      </h3>
                    </div>
                    <button
                      onClick={() => saveStatutes(statutes.filter(x => x.id !== s.id))}
                      className="p-1.5 text-[#777970] hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF8F3] dark:bg-[#111815] text-xs font-serif leading-relaxed text-[#242823] dark:text-[#F1F3EE] border border-[#E9E5DC] dark:border-[#263630]">
                    "{s.text}"
                  </div>
                  {s.commentary && (
                    <p className="text-xs text-[#777970] dark:text-[#9AA096] pt-1">
                      <span className="font-semibold text-[#23483F] dark:text-[#D6BD87]">Notes: </span>
                      {s.commentary}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'citations' && (
          <div className="space-y-4">
            {citations.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <FileText className="w-12 h-12 mx-auto text-[#777970] mb-2 opacity-40" />
                <h4 className="font-bold text-base text-[#242823] dark:text-[#F1F3EE]">No Citations Formatted</h4>
                <p className="text-xs text-[#777970] mt-1 mb-4">Format references in OSCOLA, APA, Harvard, or MLA with one-click copy.</p>
                <button
                  onClick={() => setShowNewCitation(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Add Citation
                </button>
              </div>
            ) : (
              citations.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6BD87] px-1.5 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#111815]">
                      {c.style}
                    </span>
                    <p className="text-xs font-serif text-[#242823] dark:text-[#F1F3EE] mt-1.5 leading-relaxed">
                      {formatCitation(c)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyCitation(c)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] hover:bg-stone-100"
                    >
                      {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === c.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => saveCitations(citations.filter(x => x.id !== c.id))}
                      className="p-1.5 text-[#777970] hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* New Case Modal */}
      {showNewCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-5 bg-white dark:bg-[#18221E] shadow-2xl rounded-2xl border border-[#E9E5DC] dark:border-[#263630] max-h-[90vh] overflow-y-auto space-y-3">
            <h3 className="text-base font-bold text-[#242823] dark:text-[#F1F3EE]">
              Log Legal Case Brief
            </h3>
            <form onSubmit={handleCreateCase} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Case Name (e.g. Donoghue v Stevenson)"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Citation (e.g. [1932] AC 562)"
                  value={caseCitation}
                  onChange={(e) => setCaseCitation(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <input
                  type="text"
                  placeholder="Court (e.g. House of Lords)"
                  value={caseCourt}
                  onChange={(e) => setCaseCourt(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <input
                  type="text"
                  placeholder="Year (e.g. 1932)"
                  value={caseYear}
                  onChange={(e) => setCaseYear(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Core Legal Principle / Ratio Decidendi..."
                value={casePrinciple}
                onChange={(e) => setCasePrinciple(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <textarea
                rows={2}
                placeholder="Material Facts..."
                value={caseFacts}
                onChange={(e) => setCaseFacts(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <textarea
                rows={2}
                placeholder="Judgment & Court Reasoning..."
                value={caseHeld}
                onChange={(e) => setCaseHeld(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCase(false)}
                  className="px-3 py-1.5 text-xs text-[#777970] rounded-xl border border-[#E9E5DC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Save Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Statute Modal */}
      {showNewStatute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-5 bg-white dark:bg-[#18221E] shadow-2xl rounded-2xl border border-[#E9E5DC] dark:border-[#263630] space-y-3">
            <h3 className="text-base font-bold text-[#242823] dark:text-[#F1F3EE]">
              Add Statute Section
            </h3>
            <form onSubmit={handleCreateStatute} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Act / Statute Title (e.g. Constitution of Bangladesh)"
                value={statuteAct}
                onChange={(e) => setStatuteAct(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Section (e.g. 27)"
                  value={statuteSection}
                  onChange={(e) => setStatuteSection(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <input
                  type="text"
                  placeholder="Heading (e.g. Equality before law)"
                  value={statuteHeading}
                  onChange={(e) => setStatuteHeading(e.target.value)}
                  className="col-span-2 px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Statutory Text..."
                value={statuteText}
                onChange={(e) => setStatuteText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <textarea
                rows={2}
                placeholder="Personal Commentary / Case references..."
                value={statuteCommentary}
                onChange={(e) => setStatuteCommentary(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewStatute(false)}
                  className="px-3 py-1.5 text-xs text-[#777970] rounded-xl border border-[#E9E5DC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Citation Modal */}
      {showNewCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-5 bg-white dark:bg-[#18221E] shadow-2xl rounded-2xl border border-[#E9E5DC] dark:border-[#263630] space-y-3">
            <h3 className="text-base font-bold text-[#242823] dark:text-[#F1F3EE]">
              Create Bibliographic Citation
            </h3>
            <form onSubmit={handleCreateCitation} className="space-y-3">
              <div className="flex gap-2">
                {(['OSCOLA', 'APA', 'Harvard', 'MLA'] as const).map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setCitStyle(style)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border ${
                      citStyle === style ? 'bg-[#23483F] text-white border-transparent' : 'bg-[#FAF8F3] text-[#777970] border-[#E9E5DC]'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                placeholder="Author / Editor (e.g. HLA Hart)"
                value={citAuthor}
                onChange={(e) => setCitAuthor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <input
                type="text"
                required
                placeholder="Book / Article Title (e.g. The Concept of Law)"
                value={citTitle}
                onChange={(e) => setCitTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Publisher / Journal (e.g. Oxford University Press)"
                  value={citSource}
                  onChange={(e) => setCitSource(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <input
                  type="text"
                  placeholder="Year (e.g. 1961)"
                  value={citYear}
                  onChange={(e) => setCitYear(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCitation(false)}
                  className="px-3 py-1.5 text-xs text-[#777970] rounded-xl border border-[#E9E5DC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Save Citation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
