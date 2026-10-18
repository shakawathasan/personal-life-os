import React from 'react';
import {
  Search,
  Plus,
  Cloud,
  CloudUpload,
  Moon,
  Sun,
  Menu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenQuickCapture: () => void;
  onOpenDriveModal: () => void;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: User | null;
  isDriveSyncing: boolean;
  driveSyncStatus: 'synced' | 'pending' | 'syncing' | 'error' | 'disconnected';
  activeModuleTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenQuickCapture,
  onOpenDriveModal,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme,
  user,
  isDriveSyncing,
  driveSyncStatus,
  activeModuleTitle,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#E9E5DC] dark:border-[#263630] glass-toolbar transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white hover:bg-[#FAF8F3] dark:hover:bg-[#263630] transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-editorial text-lg sm:text-xl font-semibold text-[#23483F] dark:text-[#F1F3EE] tracking-tight">
            {activeModuleTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Universal Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-[#777970] dark:text-[#9AA096] bg-[#FAF8F3] dark:bg-[#18221E] hover:bg-white dark:hover:bg-[#263630] rounded-xl border border-[#E9E5DC] dark:border-[#263630] transition-all shadow-xs"
        >
          <Search className="w-4 h-4 text-[#23483F] dark:text-[#8FA287]" />
          <span className="hidden md:inline">Universal Search...</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630]">
            ⌘K
          </span>
        </button>

        {/* Quick Capture Button */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] dark:hover:bg-[#488677] rounded-xl shadow-sm transition-all active:scale-95"
          title="Quick Capture (Note, Task, Journal)"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Capture</span>
        </button>

        {/* Google Drive Status Pill */}
        <button
          onClick={onOpenDriveModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border transition-all ${
            driveSyncStatus === 'synced'
              ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
              : driveSyncStatus === 'syncing'
              ? 'bg-amber-50/80 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800 animate-pulse'
              : driveSyncStatus === 'pending'
              ? 'bg-blue-50/80 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
              : 'bg-[#FAF8F3] text-[#777970] border-[#E9E5DC] dark:bg-[#18221E] dark:text-[#9AA096] dark:border-[#263630]'
          }`}
          title="Google Drive Cloud Storage"
        >
          {driveSyncStatus === 'synced' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline font-medium">Drive Synced</span>
            </>
          ) : driveSyncStatus === 'syncing' ? (
            <>
              <CloudUpload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
              <span className="hidden md:inline font-medium">Syncing...</span>
            </>
          ) : driveSyncStatus === 'pending' ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline font-medium">Draft Pending</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-[#777970]" />
              <span className="hidden md:inline font-medium">Connect Drive</span>
            </>
          )}
        </button>

        {/* Dark / Light Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white hover:bg-[#FAF8F3] dark:hover:bg-[#263630] border border-transparent hover:border-[#E9E5DC] dark:hover:border-[#263630] transition-colors"
          title={isDarkMode ? 'Switch to Warm Ivory' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-[#D6BD87]" /> : <Moon className="w-4 h-4 text-[#23483F]" />}
        </button>

        {/* User Profile or Sign In */}
        {user ? (
          <div
            onClick={onOpenDriveModal}
            className="flex items-center gap-2 cursor-pointer p-0.5 rounded-full hover:ring-2 hover:ring-[#23483F]/20 transition-all"
            title={`Connected as ${user.displayName || user.email}`}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-[#E9E5DC] dark:border-[#263630] object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#23483F] dark:bg-[#3C7265] text-white flex items-center justify-center text-xs font-semibold">
                {(user.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};
