import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Palette,
  Cloud,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { AppSettings } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { GeminiService } from '../services/geminiService.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface AdminSettingsModuleProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenDriveModal: () => void;
  onRefreshAllData: () => void;
}

export const AdminSettingsModule: React.FC<AdminSettingsModuleProps> = ({
  settings,
  onUpdateSettings,
  onOpenDriveModal,
  onRefreshAllData,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{ status: string; uptime: number; geminiConfigured: boolean } | null>(null);

  // API & OAuth Keys state
  const [geminiKey, setGeminiKey] = useState(() => StorageService.getGeminiApiKey());
  const [googleClientId, setGoogleClientId] = useState(() => StorageService.getGoogleClientId());
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [apiSaveSuccess, setApiSaveSuccess] = useState(false);
  const [testAiLoading, setTestAiLoading] = useState(false);
  const [testAiMessage, setTestAiMessage] = useState<{ success: boolean; text: string } | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  useEffect(() => {
    setFormData(settings);
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setSystemHealth(data))
      .catch(() => setSystemHealth(null));
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(formData);
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveGeminiApiKey(geminiKey);
    StorageService.saveGoogleClientId(googleClientId);
    setApiSaveSuccess(true);
    setTimeout(() => setApiSaveSuccess(false), 2500);
  };

  const handleTestGemini = async () => {
    setTestAiLoading(true);
    setTestAiMessage(null);
    try {
      StorageService.saveGeminiApiKey(geminiKey);
      const res = await GeminiService.chat('Reply with strictly 5 words: "Gemini AI connection is working!"');
      setTestAiMessage({ success: true, text: res });
    } catch (err: any) {
      setTestAiMessage({ success: false, text: err.message || 'Connection failed' });
    } finally {
      setTestAiLoading(false);
    }
  };

  const handleExportBackup = () => {
    const backupStr = StorageService.exportFullBackup();
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Personal-Life-OS-Backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.restoreFullBackup(content);
      if (res.success) {
        setRestoreMessage('Backup restored successfully!');
        onRefreshAllData();
      } else {
        setRestoreMessage('Restore failed: ' + res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAllData = () => {
    StorageService.clearAll();
    onRefreshAllData();
    setShowClearConfirm(false);
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FAF8F3] dark:bg-[#111815]">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9E5DC] dark:border-[#263630]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#23483F]/10 dark:bg-[#3C7265]/20 text-[#23483F] dark:text-[#A8B8A0]">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#242823] dark:text-[#F1F3EE]">
                Admin & Workspace Settings
              </h2>
              <p className="text-xs text-[#777970] dark:text-[#9AA096]">
                Configure AI intelligence, Google Drive cloud integration, appearance, and backups
              </p>
            </div>
          </div>

          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved!
            </span>
          )}
        </div>

        {/* Backend & Environment Health Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-[#242823] dark:text-[#F1F3EE]">
                Environment Status
              </p>
              <p className="text-[11px] text-[#777970] dark:text-[#9AA096]">
                Host: <span className="font-mono font-medium">{currentHost}</span> • Gemini AI:{' '}
                <span className={geminiKey || systemHealth?.geminiConfigured ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {geminiKey ? 'Active (Client API Key)' : systemHealth?.geminiConfigured ? 'Active (Server)' : 'Key Required'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-stone-100"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Drive Status</span>
          </button>
        </div>

        {/* Cloud & AI API Configuration */}
        <form onSubmit={handleSaveApiKeys} className="p-6 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#23483F] dark:text-[#D6BD87]" />
              <h3 className="font-editorial text-base font-bold text-[#242823] dark:text-[#F1F3EE]">
                AI & Google Cloud Configuration
              </h3>
            </div>
            {apiSaveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" /> API Keys Saved!
              </span>
            )}
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#242823] dark:text-[#F1F3EE]">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#23483F] dark:text-[#D6BD87] hover:underline font-semibold"
              >
                <span>Get Free Gemini Key (AI Studio)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777970] hover:text-[#242823]"
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testAiLoading || !geminiKey.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] hover:bg-stone-100 rounded-xl disabled:opacity-50"
              >
                {testAiLoading ? 'Testing...' : 'Test AI'}
              </button>
            </div>
            <p className="text-[11px] text-[#777970] dark:text-[#9AA096]">
              Powers AI Academic Copilot, Cornell lecture summarization, legal case analysis, and practice quizzes. Stored securely in your browser.
            </p>

            {testAiMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  testAiMessage.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                }`}
              >
                {testAiMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{testAiMessage.text}</span>
              </div>
            )}
          </div>

          {/* Google OAuth Client ID for Google Drive */}
          <div className="space-y-2 pt-2 border-t border-[#E9E5DC]/60 dark:border-[#263630]/60">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#242823] dark:text-[#F1F3EE]">
                Google Cloud OAuth 2.0 Client ID (Optional for Custom Google Drive)
              </label>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#23483F] dark:text-[#D6BD87] hover:underline font-semibold"
              >
                <span>Google Cloud Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              placeholder="e.g. 1234567890-xxx.apps.googleusercontent.com"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
            />
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] text-[11px] text-[#777970] dark:text-[#9AA096] space-y-1">
              <p>
                <strong>Domain Authorization:</strong> To connect Google Drive on your live domain:
              </p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Create an <em>OAuth Client ID (Web Application)</em> in Google Cloud Console.</li>
                <li>Add <code className="bg-white dark:bg-[#18221E] px-1 py-0.5 rounded border border-[#E9E5DC] dark:border-[#263630]">https://{currentHost}</code> under <strong>Authorized JavaScript origins</strong>.</li>
                <li>Paste the Client ID here to enable direct Google Drive sign-in without Firebase domain restrictions.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs"
            >
              Save API & Cloud Keys
            </button>
          </div>
        </form>

        {/* Customization Form */}
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-6">
          <h3 className="font-editorial text-base font-bold text-[#242823] dark:text-[#F1F3EE] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#23483F] dark:text-[#D6BD87]" />
            Workspace Branding & Typography
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                Interface Typography
              </label>
              <select
                value={formData.fontFamily}
                onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E9E5DC] dark:border-[#263630] bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]"
              >
                <option value="Inter">Inter (Clean modern sans-serif)</option>
                <option value="Playfair Display">Playfair Display (Academic editorial)</option>
                <option value="Noto Sans Bengali">Noto Sans Bengali (বাংলা লিপির জন্য)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#777970] dark:text-[#9AA096] mb-1">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#E9E5DC]"
                />
                <span className="text-xs font-mono text-[#777970]">{formData.primaryColor}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs"
            >
              Save Branding Preferences
            </button>
          </div>
        </form>

        {/* Data Portability: Backup & Restore */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#23483F] dark:text-[#D6BD87]" />
            <h3 className="font-editorial text-base font-bold text-[#242823] dark:text-[#F1F3EE]">
              Data Portability & Full JSON Backup
            </h3>
          </div>
          <p className="text-xs text-[#777970] dark:text-[#9AA096] leading-relaxed">
            Your data is strictly yours. You can export a comprehensive JSON snapshot containing all notebooks, pages, research cases, study flashcards, tasks, and journal entries, or restore an earlier backup file.
          </p>

          {restoreMessage && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-between">
              <span>{restoreMessage}</span>
              <button onClick={() => setRestoreMessage(null)}>×</button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] rounded-xl shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Workspace Data (JSON)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#242823] dark:text-[#F1F3EE] bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-stone-100 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Workspace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Reset Entire Workspace"
        message="Are you sure you want to delete all local workspace data? This action cannot be reversed unless you have an exported JSON backup or Google Drive sync."
        confirmText="Erase All Data"
        isDestructive={true}
        onConfirm={handleClearAllData}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
