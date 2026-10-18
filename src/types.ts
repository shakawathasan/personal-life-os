export interface Notebook {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  notebookId: string;
  name: string;
  createdAt: string;
}

export interface PageProperty {
  key: string;
  value: string;
}

export interface Page {
  id: string;
  notebookId: string;
  sectionId?: string;
  title: string;
  content: string; // HTML or Markdown
  type: 'standard' | 'cornell' | 'casebrief' | 'statute' | 'assignment';
  tags: string[];
  properties?: PageProperty[];
  // Cornell specifics
  cornellCues?: string[];
  cornellSummary?: string;
  // Case brief specifics
  caseCitation?: string;
  caseFacts?: string;
  caseIssues?: string;
  caseLaw?: string;
  caseJudgment?: string;
  caseReasoning?: string;
  casePrinciple?: string;
  // Metadata
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrash?: boolean;
  driveFileId?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  extractedText?: string;
  tags: string[];
  relatedPageId?: string;
  isScreenshot?: boolean;
  driveFileId?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  tags: string[];
  projectId?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  relatedPageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  color?: string;
  description?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'onhold';
  createdAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  difficulty?: 'easy' | 'good' | 'hard' | 'again';
  nextReviewDate?: string;
  reviewCount: number;
  createdAt: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  category?: string;
}

export interface VocabItem {
  id: string;
  word: string;
  translation?: string; // English / Bangla
  pronunciation?: string;
  definition: string;
  example?: string;
  tags: string[];
  learned?: boolean;
  createdAt: string;
}

export interface VoiceRecord {
  id: string;
  title: string;
  durationSeconds: number;
  audioBlobUrl?: string;
  transcript: string;
  summary?: string;
  actionItems?: string[];
  language?: string;
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptAttachment?: string;
  createdAt: string;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  price: number;
  cycle: 'monthly' | 'yearly';
  renewalDate: string;
  category?: string;
  active: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  price?: number;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: 'great' | 'good' | 'neutral' | 'challenging' | 'tired';
  tags: string[];
  createdAt: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  notes?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface TimeLogItem {
  id: string;
  activity: string;
  category: string;
  durationMinutes: number;
  date: string;
  notes?: string;
}

export interface DecisionItem {
  id: string;
  title: string;
  description: string;
  status: 'evaluating' | 'decided' | 'reviewed';
  options: { name: string; score: number }[];
  chosenOption?: string;
  reasoning?: string;
  reflection?: string;
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  tagline: string;
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontFamily: 'Inter' | 'Playfair Display' | 'Noto Sans Bengali';
  enabledModules: {
    notebook: boolean;
    documents: boolean;
    tasks: boolean;
    study: boolean;
    research: boolean;
    voice: boolean;
    ai: boolean;
    finance: boolean;
    subscriptions: boolean;
    inventory: boolean;
    journal: boolean;
    bookmarks: boolean;
    timeTracker: boolean;
    decisions: boolean;
  };
  googleDriveConnected: boolean;
  autoSync: boolean;
}
