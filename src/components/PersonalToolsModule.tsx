import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  Package,
  BookHeart,
  Bookmark,
  Timer,
  GitFork,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import {
  FinanceTransaction,
  SubscriptionItem,
  InventoryItem,
  JournalEntry,
  BookmarkItem,
  TimeLogItem,
  DecisionItem
} from '../types.ts';
import { StorageService } from '../services/storage.ts';

export const PersonalToolsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finance' | 'subscriptions' | 'inventory' | 'journal' | 'bookmarks' | 'timer' | 'decisions'>('finance');

  // Finance
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Study Supplies');
  const [txDesc, setTxDesc] = useState('');

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [subName, setSubName] = useState('');
  const [subPrice, setSubPrice] = useState('');
  const [subCycle, setSubCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subRenewal, setSubRenewal] = useState('');

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invName, setInvName] = useState('');
  const [invSerial, setInvSerial] = useState('');
  const [invWarranty, setInvWarranty] = useState('');

  // Journal
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState<JournalEntry['mood']>('good');

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bmTitle, setBmTitle] = useState('');
  const [bmUrl, setBmUrl] = useState('');

  // Timer / Pomodoro
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [timeLogs, setTimeLogs] = useState<TimeLogItem[]>([]);

  useEffect(() => {
    setTransactions(StorageService.getTransactions());
    setSubscriptions(StorageService.getSubscriptions());
    setInventory(StorageService.getInventory());
    setJournal(StorageService.getJournal());
    setBookmarks(StorageService.getBookmarks());
    setTimeLogs(StorageService.getTimeLogs());
  }, []);

  // Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Log session
      const log: TimeLogItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        activity: timerMode === 'pomodoro' ? 'Focused Study Session' : 'Rest Break',
        category: 'Study',
        durationMinutes: timerMode === 'pomodoro' ? 25 : 5,
        date: new Date().toISOString().split('T')[0],
      };
      const updated = [log, ...timeLogs];
      StorageService.saveTimeLogs(updated);
      setTimeLogs(updated);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode, timeLogs]);

  // Add Transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;
    const item: FinanceTransaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      type: txType,
      amount: amt,
      category: txCategory,
      description: txDesc || txCategory,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...transactions];
    StorageService.saveTransactions(updated);
    setTransactions(updated);
    setTxAmount('');
    setTxDesc('');
  };

  // Add Subscription
  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(subPrice);
    if (!subName.trim() || isNaN(price)) return;
    const item: SubscriptionItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      name: subName.trim(),
      price,
      cycle: subCycle,
      renewalDate: subRenewal || new Date().toISOString().split('T')[0],
      active: true,
    };
    const updated = [item, ...subscriptions];
    StorageService.saveSubscriptions(updated);
    setSubscriptions(updated);
    setSubName('');
    setSubPrice('');
    setSubRenewal('');
  };

  // Add Journal Entry
  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;
    const item: JournalEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      title: journalTitle.trim() || 'Daily Reflection',
      content: journalContent.trim(),
      mood: journalMood,
      date: new Date().toISOString().split('T')[0],
      tags: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...journal];
    StorageService.saveJournal(updated);
    setJournal(updated);
    setJournalTitle('');
    setJournalContent('');
  };

  // Finance totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Monthly Subscriptions total
  const monthlySubTotal = subscriptions.filter(s => s.active).reduce((acc, s) => {
    return acc + (s.cycle === 'monthly' ? s.price : s.price / 12);
  }, 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF8F3] dark:bg-[#111815]">
      
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 p-3 sm:px-6 border-b border-[#E9E5DC] dark:border-[#263630] bg-white/70 dark:bg-[#18221E]/70 backdrop-blur-md overflow-x-auto">
        {[
          { key: 'finance', label: 'Finance', icon: Wallet },
          { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { key: 'timer', label: 'Study Timer', icon: Timer },
          { key: 'journal', label: 'Private Journal', icon: BookHeart },
          { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
          { key: 'inventory', label: 'Inventory', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-[#23483F] text-white dark:bg-[#3C7265] shadow-xs'
                  : 'text-[#777970] dark:text-[#9AA096] hover:bg-stone-100 dark:hover:bg-[#18221E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
        
        {/* Personal Finance */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <span className="text-[11px] text-[#777970] font-semibold">Total Balance</span>
                <p className={`text-xl font-bold mt-1 ${netBalance >= 0 ? 'text-[#23483F] dark:text-[#A8B8A0]' : 'text-red-600'}`}>
                  ${netBalance.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <span className="text-[11px] text-[#777970] font-semibold">Total Income</span>
                <p className="text-xl font-bold text-emerald-600 mt-1">+${totalIncome.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
                <span className="text-[11px] text-[#777970] font-semibold">Total Expenses</span>
                <p className="text-xl font-bold text-red-600 mt-1">-${totalExpense.toFixed(2)}</p>
              </div>
            </div>

            {/* Log Transaction */}
            <form onSubmit={handleAddTransaction} className="p-5 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87]">
                Log Income / Expense
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Amount ($)..."
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Tuition, Books)..."
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Save Entry
                </button>
              </div>
            </form>

            {/* Transactions List */}
            <div className="divide-y divide-[#E9E5DC] dark:divide-[#263630] rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#777970]">
                  No financial transactions recorded yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE]">{tx.description}</span>
                      <span className="text-[10px] text-[#777970] ml-2 font-mono">({tx.category})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          const updated = transactions.filter(t => t.id !== tx.id);
                          StorageService.saveTransactions(updated);
                          setTransactions(updated);
                        }}
                        className="text-[#777970] hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630]">
              <span className="text-xs text-[#777970]">Estimated Monthly Subscriptions Spend</span>
              <p className="text-2xl font-bold text-[#23483F] dark:text-[#D6BD87] mt-1">
                ${monthlySubTotal.toFixed(2)} / month
              </p>
            </div>

            <form onSubmit={handleAddSubscription} className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87]">
                Track Subscription
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Service (e.g. Notion, Spotify)..."
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Price ($)..."
                  value={subPrice}
                  onChange={(e) => setSubPrice(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <select
                  value={subCycle}
                  onChange={(e) => setSubCycle(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Add Subscription
                </button>
              </div>
            </form>

            <div className="divide-y divide-[#E9E5DC] dark:divide-[#263630] rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] overflow-hidden">
              {subscriptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#777970]">
                  No subscriptions being tracked.
                </div>
              ) : (
                subscriptions.map((s) => (
                  <div key={s.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE]">{s.name}</span>
                      <span className="text-[10px] text-[#777970] ml-2">(${s.price}/{s.cycle})</span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = subscriptions.filter(x => x.id !== s.id);
                        StorageService.saveSubscriptions(updated);
                        setSubscriptions(updated);
                      }}
                      className="text-[#777970] hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Study Timer / Pomodoro */}
        {activeTab === 'timer' && (
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft text-center space-y-6">
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  setTimerMode('pomodoro');
                  setTimerSeconds(25 * 60);
                  setIsTimerRunning(false);
                }}
                className={`px-3 py-1 text-xs rounded-xl font-semibold ${timerMode === 'pomodoro' ? 'bg-[#23483F] text-white' : 'bg-stone-100 text-[#777970]'}`}
              >
                Pomodoro (25m)
              </button>
              <button
                onClick={() => {
                  setTimerMode('shortBreak');
                  setTimerSeconds(5 * 60);
                  setIsTimerRunning(false);
                }}
                className={`px-3 py-1 text-xs rounded-xl font-semibold ${timerMode === 'shortBreak' ? 'bg-[#23483F] text-white' : 'bg-stone-100 text-[#777970]'}`}
              >
                Short Break (5m)
              </button>
            </div>

            <div className="text-5xl font-mono font-bold text-[#23483F] dark:text-[#F1F3EE]">
              {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pause' : 'Start Focus'}</span>
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(timerMode === 'pomodoro' ? 25 * 60 : 5 * 60);
                }}
                className="p-2.5 text-[#777970] rounded-xl border border-[#E9E5DC]"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Private Journal */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            <form onSubmit={handleAddJournal} className="p-5 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] space-y-3">
              <input
                type="text"
                placeholder="Entry Title (e.g. Productive day, midterm reflections)..."
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <textarea
                rows={3}
                required
                placeholder="Write your personal thoughts, reflections, or highlights..."
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#23483F] rounded-xl"
                >
                  Save Reflection
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {journal.map((j) => (
                <div key={j.id} className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#23483F] dark:text-[#F1F3EE]">{j.title}</h4>
                    <span className="text-[10px] text-[#777970]">{j.date}</span>
                  </div>
                  <p className="text-xs text-[#777970] dark:text-[#9AA096] leading-relaxed">{j.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87]">
                Saved Research & Study Links
              </h4>
              <div className="divide-y divide-[#E9E5DC] dark:divide-[#263630]">
                {bookmarks.length === 0 ? (
                  <p className="py-4 text-xs text-[#777970] text-center">No bookmarks saved.</p>
                ) : (
                  bookmarks.map((bm) => (
                    <div key={bm.id} className="py-2.5 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <p className="text-xs font-semibold text-[#242823] dark:text-[#F1F3EE] truncate">{bm.title}</p>
                        <a href={bm.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#23483F] dark:text-[#A8B8A0] hover:underline flex items-center gap-1">
                          <span>{bm.url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          const updated = bookmarks.filter(x => x.id !== bm.id);
                          StorageService.saveBookmarks(updated);
                          setBookmarks(updated);
                        }}
                        className="text-[#777970] hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#23483F] dark:text-[#D6BD87]">
                Personal Belongings & Warranty Tracker
              </h4>
              <p className="text-xs text-[#777970]">
                Track study devices, laptop serial numbers, purchase dates, and warranty alerts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
