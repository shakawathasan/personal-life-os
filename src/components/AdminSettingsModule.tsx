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
  Cloud
} from 'lucide-react';
import { AppSettings } from '../types.ts';
import { StorageService } from '../services/storage.ts';
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

  useEffect(() => {
    setFormData(settings);
    // Fetch backend health
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
      <div className="max-w-4xl mx-auto space-y-6">
        
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
                Configure appearance, active modules, Google Drive cloud sync, and data backups
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
                System Health & Intelligence Status
              </p>
              <p className="text-[11px] text-[#777970] dark:text-[#9AA096]">
                Backend: {systemHealth ? 'Online (Node.js Express)' : 'Local'} • Gemini AI: {systemHealth?.geminiConfigured ? 'Active (Ready)' : 'Simulated / Standby'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDriveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-stone-100"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Manage Google Drive</span>
          </button>
        </div>

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

            <a
              href="/personal-life-os.tar.gz"
              download="personal-life-os.tar.gz"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#23483F] dark:text-[#D6BD87] bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] rounded-xl hover:bg-stone-50 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project Code (.tar.gz)</span>
            </a>

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
