import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  RotateCw,
  CheckCircle2,
  XCircle,
  Plus,
  BookA,
  Trophy,
  Trash2,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  Languages
} from 'lucide-react';
import { Flashcard, FlashcardDeck, QuizQuestion, VocabItem } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { GeminiService } from '../services/geminiService.ts';

export const StudyCenterModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'vocab' | 'generator'>('flashcards');

  // Flashcards state
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Practice Quiz state
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Vocabulary state
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newDefinition, setNewDefinition] = useState('');

  // AI Generator state
  const [generatorText, setGeneratorText] = useState('');
  const [generatorType, setGeneratorType] = useState<'flashcards' | 'quiz'>('flashcards');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorSuccess, setGeneratorSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedDecks = StorageService.getFlashcardDecks();
    const loadedCards = StorageService.getFlashcards();
    const loadedQuizzes = StorageService.getQuizzes();
    const loadedVocab = StorageService.getVocab();

    setDecks(loadedDecks);
    setFlashcards(loadedCards);
    setQuizzes(loadedQuizzes);
    setVocabItems(loadedVocab);

    if (loadedDecks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(loadedDecks[0].id);
    }
  };

  // Flashcard review deck cards
  const activeDeckCards = flashcards.filter(f => !selectedDeckId || f.deckId === selectedDeckId);
  const currentCard = activeDeckCards[currentCardIndex];

  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentCardIndex < activeDeckCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  const handleDifficultyRate = (difficulty: Flashcard['difficulty']) => {
    if (!currentCard) return;
    const updated = flashcards.map(c => {
      if (c.id === currentCard.id) {
        return {
          ...c,
          difficulty,
          reviewCount: (c.reviewCount || 0) + 1,
        };
      }
      return c;
    });
    StorageService.saveFlashcards(updated);
    setFlashcards(updated);
    handleNextCard();
  };

  // Add Vocabulary Item
  const handleAddVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    const item: VocabItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      word: newWord.trim(),
      translation: newTranslation.trim(),
      definition: newDefinition.trim(),
      tags: [],
      learned: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...vocabItems];
    StorageService.saveVocab(updated);
    setVocabItems(updated);
    setNewWord('');
    setNewTranslation('');
    setNewDefinition('');
  };

  // AI Generation from study material
  const handleRunGenerator = async () => {
    if (!generatorText.trim()) return;
    setIsGenerating(true);
    setGeneratorSuccess(null);
    try {
      if (generatorType === 'flashcards') {
        const cards = await GeminiService.generateQuiz(generatorText, 5, 'flashcards');
        let deckId = selectedDeckId;
        if (!deckId) {
          deckId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
          const newDeck = { id: deckId, name: 'AI Study Set', createdAt: new Date().toISOString() };
          const updatedDecks = [...decks, newDeck];
          StorageService.saveFlashcardDecks(updatedDecks);
          setDecks(updatedDecks);
          setSelectedDeckId(deckId);
        }

        const newFlashcards: Flashcard[] = cards.map((c: any) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          deckId: deckId!,
          front: c.front || 'Question',
          back: c.back || 'Answer',
          reviewCount: 0,
          createdAt: new Date().toISOString(),
        }));

        const updatedCards = [...newFlashcards, ...flashcards];
        StorageService.saveFlashcards(updatedCards);
        setFlashcards(updatedCards);
        setGeneratorSuccess(`Generated ${newFlashcards.length} flashcards!`);
        setActiveTab('flashcards');
      } else {
        const quizItems = await GeminiService.generateQuiz(generatorText, 5, 'quiz');
        const newQuizzes: QuizQuestion[] = quizItems.map((q: any) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          question: q.question,
          options: q.options || [],
          correctIndex: q.correctIndex || 0,
          explanation: q.explanation || '',
        }));

        const updated = [...newQuizzes, ...quizzes];
        StorageService.saveQuizzes(updated);
        setQuizzes(updated);
        setGeneratorSuccess(`Generated ${newQuizzes.length} quiz questions!`);
        setActiveTab('quiz');
      }
    } catch (err: any) {
      alert('Generation error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Top Header / Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 border-b border-[#E9E5DC] dark:border-[#263630] bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-[#23483F] dark:text-[#A8B8A0]" />
          <h2 className="font-editorial text-lg font-bold text-[#242823] dark:text-[#F1F3EE]">
            University Study Center
          </h2>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] text-xs font-medium">
          {[
            { key: 'flashcards', label: `Flashcards (${flashcards.length})` },
            { key: 'quiz', label: `Practice Quiz (${quizzes.length})` },
            { key: 'vocab', label: `Vocabulary (${vocabItems.length})` },
            { key: 'generator', label: 'AI Generator ✨' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-[#18221E] text-[#23483F] dark:text-[#F1F3EE] shadow-xs font-semibold'
                  : 'text-[#777970] dark:text-[#9AA096] hover:text-[#242823]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
        
        {/* Flashcards View */}
        {activeTab === 'flashcards' && (
          <div className="max-w-xl w-full space-y-6">
            {activeDeckCards.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <GraduationCap className="w-12 h-12 mx-auto text-[#777970] mb-3 opacity-40" />
                <h3 className="font-bold text-base text-[#242823] dark:text-[#F1F3EE]">
                  No Flashcards Yet
                </h3>
                <p className="text-xs text-[#777970] dark:text-[#9AA096] mt-1 mb-4">
                  Extract flashcards automatically from your notes or use the AI Generator tab.
                </p>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Generate Study Cards
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-[#777970]">
                  <span>
                    Card {currentCardIndex + 1} of {activeDeckCards.length}
                  </span>
                  <span>Click card to reveal answer</span>
                </div>

                {/* Interactive Flipping Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[280px] p-8 rounded-3xl cursor-pointer bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft flex flex-col items-center justify-center text-center transition-all hover:scale-[1.01]"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D6BD87] mb-4">
                    {isFlipped ? 'ANSWER / DEFINITION' : 'PROMPT / QUESTION'}
                  </span>
                  <p className="text-base sm:text-lg font-medium text-[#242823] dark:text-[#F1F3EE] leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                  <span className="text-[10px] text-[#777970] mt-6 flex items-center gap-1 opacity-70">
                    <RotateCw className="w-3 h-3" /> Flip card
                  </span>
                </div>

                {/* Spaced Repetition Rating Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleDifficultyRate('again')}
                    className="py-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-900"
                  >
                    Again (1m)
                  </button>
                  <button
                    onClick={() => handleDifficultyRate('hard')}
                    className="py-2.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                  >
                    Hard (10m)
                  </button>
                  <button
                    onClick={() => handleDifficultyRate('good')}
                    className="py-2.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                  >
                    Good (1d)
                  </button>
                  <button
                    onClick={() => handleDifficultyRate('easy')}
                    className="py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                  >
                    Easy (4d)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Practice Quiz View */}
        {activeTab === 'quiz' && (
          <div className="max-w-xl w-full space-y-6">
            {quizzes.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <Trophy className="w-12 h-12 mx-auto text-[#777970] mb-3 opacity-40" />
                <h3 className="font-bold text-base text-[#242823] dark:text-[#F1F3EE]">
                  No Practice Quiz Questions
                </h3>
                <p className="text-xs text-[#777970] mt-1 mb-4">
                  Generate mock exams from lecture notes in the AI Generator tab.
                </p>
                <button
                  onClick={() => {
                    setGeneratorType('quiz');
                    setActiveTab('generator');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Generate Quiz
                </button>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-6">
                <div className="flex items-center justify-between text-xs text-[#777970]">
                  <span>Question {currentQuizIndex + 1} of {quizzes.length}</span>
                  <span className="font-semibold text-emerald-600">Score: {quizScore}/{answeredCount}</span>
                </div>

                <h3 className="text-base font-semibold text-[#242823] dark:text-[#F1F3EE] leading-relaxed">
                  {quizzes[currentQuizIndex]?.question}
                </h3>

                {/* Options */}
                <div className="space-y-2.5">
                  {quizzes[currentQuizIndex]?.options.map((opt, idx) => {
                    const isSelected = selectedAnswerIndex === idx;
                    const isCorrect = idx === quizzes[currentQuizIndex]?.correctIndex;
                    const showFeedback = selectedAnswerIndex !== null;

                    return (
                      <button
                        key={idx}
                        disabled={showFeedback}
                        onClick={() => {
                          setSelectedAnswerIndex(idx);
                          setAnsweredCount(prev => prev + 1);
                          if (isCorrect) setQuizScore(prev => prev + 1);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl text-xs font-medium border transition-all ${
                          showFeedback && isCorrect
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : showFeedback && isSelected && !isCorrect
                            ? 'bg-red-50 text-red-800 border-red-400 dark:bg-red-950/40 dark:text-red-300'
                            : 'bg-[#FAF8F3] dark:bg-[#111815] border-[#E9E5DC] dark:border-[#263630] hover:border-[#23483F]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {selectedAnswerIndex !== null && (
                  <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] text-xs space-y-2">
                    <p className="font-semibold text-[#23483F] dark:text-[#D6BD87]">Explanation:</p>
                    <p className="text-[#777970] dark:text-[#9AA096] leading-relaxed">
                      {quizzes[currentQuizIndex]?.explanation || 'Review the correct option.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedAnswerIndex(null);
                        if (currentQuizIndex < quizzes.length - 1) {
                          setCurrentQuizIndex(prev => prev + 1);
                        } else {
                          setCurrentQuizIndex(0);
                        }
                      }}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl mt-2"
                    >
                      Next Question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vocabulary & Bilingual Bank */}
        {activeTab === 'vocab' && (
          <div className="max-w-2xl w-full space-y-6">
            <form onSubmit={handleAddVocab} className="p-5 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Languages className="w-4 h-4 text-[#23483F] dark:text-[#D6BD87]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87]">
                  Add Word / Terminology (English & Bangla)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Word / Term (e.g. Jurisdiction)..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <input
                  type="text"
                  placeholder="Translation / প্রতিশব্দ (e.g. এখতিয়ার)..."
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  className="font-bangla px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
              </div>
              <input
                type="text"
                placeholder="Definition / Explanation..."
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Save Term
                </button>
              </div>
            </form>

            <div className="divide-y divide-[#E9E5DC] dark:divide-[#263630] bg-white dark:bg-[#18221E] rounded-2xl border border-[#E9E5DC] dark:border-[#263630] overflow-hidden">
              {vocabItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#777970]">
                  No vocabulary words saved yet.
                </div>
              ) : (
                vocabItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#23483F] dark:text-[#F1F3EE]">{item.word}</span>
                        {item.translation && (
                          <span className="font-bangla text-xs px-2 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] dark:text-[#9AA096]">
                            {item.translation}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#777970] dark:text-[#9AA096] mt-1">{item.definition}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = vocabItems.filter(v => v.id !== item.id);
                        StorageService.saveVocab(updated);
                        setVocabItems(updated);
                      }}
                      className="p-1 text-[#777970] hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* AI Generator Tab */}
        {activeTab === 'generator' && (
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#23483F] dark:text-[#D6BD87]" />
              <h3 className="font-editorial text-lg font-bold text-[#242823] dark:text-[#F1F3EE]">
                AI Study Materials Generator
              </h3>
            </div>
            <p className="text-xs text-[#777970] dark:text-[#9AA096]">
              Paste any chapter, lecture transcript, or study notes below. Gemini will synthesize high-yield flashcards or practice test questions instantly.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGeneratorType('flashcards')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  generatorType === 'flashcards'
                    ? 'bg-[#23483F] text-white border-transparent'
                    : 'bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] border-[#E9E5DC]'
                }`}
              >
                Flashcards
              </button>
              <button
                type="button"
                onClick={() => setGeneratorType('quiz')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  generatorType === 'quiz'
                    ? 'bg-[#23483F] text-white border-transparent'
                    : 'bg-[#FAF8F3] dark:bg-[#111815] text-[#777970] border-[#E9E5DC]'
                }`}
              >
                Practice Exam Questions
              </button>
            </div>

            <textarea
              rows={6}
              placeholder="Paste study material or legal concepts here..."
              value={generatorText}
              onChange={(e) => setGeneratorText(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE] focus:outline-hidden"
            />

            <button
              onClick={handleRunGenerator}
              disabled={isGenerating || !generatorText.trim()}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl transition-all disabled:opacity-50"
            >
              {isGenerating ? 'Synthesizing with AI...' : 'Generate Study Set'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
