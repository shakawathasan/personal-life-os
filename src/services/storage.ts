import {
  Notebook,
  Section,
  Page,
  DocumentItem,
  TaskItem,
  ProjectItem,
  Flashcard,
  FlashcardDeck,
  QuizQuestion,
  VocabItem,
  VoiceRecord,
  FinanceTransaction,
  SubscriptionItem,
  InventoryItem,
  JournalEntry,
  BookmarkItem,
  TimeLogItem,
  DecisionItem,
  AppSettings
} from '../types.ts';

const PREFIX = 'personal_life_os_';

export const defaultSettings: AppSettings = {
  appName: 'Personal Life OS',
  tagline: 'Your unified university & life workspace',
  theme: 'light',
  primaryColor: '#23483F',
  fontFamily: 'Inter',
  enabledModules: {
    notebook: true,
    documents: true,
    tasks: true,
    study: true,
    research: true,
    voice: true,
    ai: true,
    finance: true,
    subscriptions: true,
    inventory: true,
    journal: true,
    bookmarks: true,
    timeTracker: true,
    decisions: true,
  },
  googleDriveConnected: false,
  autoSync: false,
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export interface SyncQueueItem {
  id: string;
  type: 'note' | 'backup' | 'document';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  data?: any;
  timestamp: string;
  retries: number;
}

export const StorageService = {
  // Settings
  getSettings: (): AppSettings => getItem<AppSettings>('settings', defaultSettings),
  saveSettings: (settings: AppSettings) => setItem('settings', settings),

  // Gemini API Key
  getGeminiApiKey: (): string => {
    try {
      return localStorage.getItem(PREFIX + 'gemini_api_key') || '';
    } catch {
      return '';
    }
  },
  saveGeminiApiKey: (key: string): void => {
    try {
      localStorage.setItem(PREFIX + 'gemini_api_key', key.trim());
    } catch (e) {
      console.error('Failed to save Gemini API key:', e);
    }
  },

  // Google OAuth & Firebase Config
  getGoogleClientId: (): string => {
    try {
      return localStorage.getItem(PREFIX + 'google_client_id') || '';
    } catch {
      return '';
    }
  },
  saveGoogleClientId: (id: string): void => {
    try {
      localStorage.setItem(PREFIX + 'google_client_id', id.trim());
    } catch (e) {
      console.error('Failed to save Google Client ID:', e);
    }
  },

  getCustomFirebaseConfig: (): any => {
    return getItem<any>('custom_firebase_config', null);
  },
  saveCustomFirebaseConfig: (config: any): void => {
    setItem('custom_firebase_config', config);
  },

  getGoogleAccessToken: (): string | null => {
    try {
      return localStorage.getItem(PREFIX + 'google_access_token');
    } catch {
      return null;
    }
  },
  saveGoogleAccessToken: (token: string | null): void => {
    try {
      if (token) {
        localStorage.setItem(PREFIX + 'google_access_token', token);
      } else {
        localStorage.removeItem(PREFIX + 'google_access_token');
      }
    } catch (e) {
      console.error('Failed to save Google Access Token:', e);
    }
  },

  getGoogleUser: (): any => {
    return getItem<any>('google_user', null);
  },
  saveGoogleUser: (user: any): void => {
    setItem('google_user', user);
  },

  // Notebooks
  getNotebooks: (): Notebook[] => getItem<Notebook[]>('notebooks', []),
  saveNotebooks: (items: Notebook[]) => setItem('notebooks', items),

  // Sections
  getSections: (): Section[] => getItem<Section[]>('sections', []),
  saveSections: (items: Section[]) => setItem('sections', items),

  // Pages
  getPages: (): Page[] => getItem<Page[]>('pages', []),
  savePages: (items: Page[]) => setItem('pages', items),

  // Documents
  getDocuments: (): DocumentItem[] => getItem<DocumentItem[]>('documents', []),
  saveDocuments: (items: DocumentItem[]) => setItem('documents', items),

  // Tasks & Projects
  getTasks: (): TaskItem[] => getItem<TaskItem[]>('tasks', []),
  saveTasks: (items: TaskItem[]) => setItem('tasks', items),
  getProjects: (): ProjectItem[] => getItem<ProjectItem[]>('projects', []),
  saveProjects: (items: ProjectItem[]) => setItem('projects', items),

  // Study
  getFlashcardDecks: (): FlashcardDeck[] => getItem<FlashcardDeck[]>('flashcard_decks', []),
  saveFlashcardDecks: (items: FlashcardDeck[]) => setItem('flashcard_decks', items),
  getFlashcards: (): Flashcard[] => getItem<Flashcard[]>('flashcards', []),
  saveFlashcards: (items: Flashcard[]) => setItem('flashcards', items),
  getQuizzes: (): QuizQuestion[] => getItem<QuizQuestion[]>('quizzes', []),
  saveQuizzes: (items: QuizQuestion[]) => setItem('quizzes', items),
  getVocab: (): VocabItem[] => getItem<VocabItem[]>('vocab', []),
  saveVocab: (items: VocabItem[]) => setItem('vocab', items),

  // Voice
  getVoiceRecords: (): VoiceRecord[] => getItem<VoiceRecord[]>('voice_records', []),
  saveVoiceRecords: (items: VoiceRecord[]) => setItem('voice_records', items),

  // Finance
  getTransactions: (): FinanceTransaction[] => getItem<FinanceTransaction[]>('transactions', []),
  saveTransactions: (items: FinanceTransaction[]) => setItem('transactions', items),
  getSubscriptions: (): SubscriptionItem[] => getItem<SubscriptionItem[]>('subscriptions', []),
  saveSubscriptions: (items: SubscriptionItem[]) => setItem('subscriptions', items),

  // Inventory
  getInventory: (): InventoryItem[] => getItem<InventoryItem[]>('inventory', []),
  saveInventory: (items: InventoryItem[]) => setItem('inventory', items),

  // Journal
  getJournal: (): JournalEntry[] => getItem<JournalEntry[]>('journal', []),
  saveJournal: (items: JournalEntry[]) => setItem('journal', items),

  // Bookmarks
  getBookmarks: (): BookmarkItem[] => getItem<BookmarkItem[]>('bookmarks', []),
  saveBookmarks: (items: BookmarkItem[]) => setItem('bookmarks', items),

  // Time Tracker
  getTimeLogs: (): TimeLogItem[] => getItem<TimeLogItem[]>('time_logs', []),
  saveTimeLogs: (items: TimeLogItem[]) => setItem('time_logs', items),

  // Decisions
  getDecisions: (): DecisionItem[] => getItem<DecisionItem[]>('decisions', []),
  saveDecisions: (items: DecisionItem[]) => setItem('decisions', items),

  // Sync Queue
  getSyncQueue: (): SyncQueueItem[] => getItem<SyncQueueItem[]>('sync_queue', []),
  saveSyncQueue: (items: SyncQueueItem[]) => setItem('sync_queue', items),
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    const queue = StorageService.getSyncQueue();
    queue.push({
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    StorageService.saveSyncQueue(queue);
  },

  // Export Full OS Backup as JSON
  exportFullBackup: (): string => {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: StorageService.getSettings(),
      notebooks: StorageService.getNotebooks(),
      sections: StorageService.getSections(),
      pages: StorageService.getPages(),
      documents: StorageService.getDocuments(),
      tasks: StorageService.getTasks(),
      projects: StorageService.getProjects(),
      flashcardDecks: StorageService.getFlashcardDecks(),
      flashcards: StorageService.getFlashcards(),
      quizzes: StorageService.getQuizzes(),
      vocab: StorageService.getVocab(),
      voiceRecords: StorageService.getVoiceRecords(),
      transactions: StorageService.getTransactions(),
      subscriptions: StorageService.getSubscriptions(),
      inventory: StorageService.getInventory(),
      journal: StorageService.getJournal(),
      bookmarks: StorageService.getBookmarks(),
      timeLogs: StorageService.getTimeLogs(),
      decisions: StorageService.getDecisions(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Restore Full OS Backup from JSON
  restoreFullBackup: (jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format.' };
      }
      if (data.settings) StorageService.saveSettings(data.settings);
      if (Array.isArray(data.notebooks)) StorageService.saveNotebooks(data.notebooks);
      if (Array.isArray(data.sections)) StorageService.saveSections(data.sections);
      if (Array.isArray(data.pages)) StorageService.savePages(data.pages);
      if (Array.isArray(data.documents)) StorageService.saveDocuments(data.documents);
      if (Array.isArray(data.tasks)) StorageService.saveTasks(data.tasks);
      if (Array.isArray(data.projects)) StorageService.saveProjects(data.projects);
      if (Array.isArray(data.flashcardDecks)) StorageService.saveFlashcardDecks(data.flashcardDecks);
      if (Array.isArray(data.flashcards)) StorageService.saveFlashcards(data.flashcards);
      if (Array.isArray(data.quizzes)) StorageService.saveQuizzes(data.quizzes);
      if (Array.isArray(data.vocab)) StorageService.saveVocab(data.vocab);
      if (Array.isArray(data.voiceRecords)) StorageService.saveVoiceRecords(data.voiceRecords);
      if (Array.isArray(data.transactions)) StorageService.saveTransactions(data.transactions);
      if (Array.isArray(data.subscriptions)) StorageService.saveSubscriptions(data.subscriptions);
      if (Array.isArray(data.inventory)) StorageService.saveInventory(data.inventory);
      if (Array.isArray(data.journal)) StorageService.saveJournal(data.journal);
      if (Array.isArray(data.bookmarks)) StorageService.saveBookmarks(data.bookmarks);
      if (Array.isArray(data.timeLogs)) StorageService.saveTimeLogs(data.timeLogs);
      if (Array.isArray(data.decisions)) StorageService.saveDecisions(data.decisions);

      return { success: true, message: 'Workspace restored successfully.' };
    } catch (err: any) {
      return { success: false, message: 'Failed to parse JSON backup: ' + err.message };
    }
  },

  // Clear all workspace data
  clearAll: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};
