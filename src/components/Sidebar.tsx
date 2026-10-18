import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CheckSquare,
  GraduationCap,
  Scale,
  Mic,
  Sparkles,
  Briefcase,
  Settings,
  Cloud,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings } from '../types.ts';

export type ModuleKey =
  | 'home'
  | 'notebook'
  | 'documents'
  | 'tasks'
  | 'study'
  | 'research'
  | 'voice'
  | 'ai'
  | 'personal'
  | 'settings';

interface SidebarProps {
  currentModule: ModuleKey;
  onSelectModule: (module: ModuleKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  settings: AppSettings;
  driveConnected: boolean;
  onOpenDriveModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  settings,
  driveConnected,
  onOpenDriveModal,
}) => {
  const navItems: { key: ModuleKey; label: string; icon: React.ElementType; badge?: string }[] = [
    { key: 'home', label: 'Home', icon: LayoutDashboard },
    { key: 'notebook', label: 'Notebook', icon: BookOpen, badge: 'Core' },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'tasks', label: 'Tasks & Planner', icon: CheckSquare },
    { key: 'study', label: 'Study Center', icon: GraduationCap },
    { key: 'research', label: 'Research & Law', icon: Scale },
    { key: 'voice', label: 'Voice Studio', icon: Mic },
    { key: 'ai', label: 'AI Workspace', icon: Sparkles, badge: 'AI' },
    { key: 'personal', label: 'Personal Tools', icon: Briefcase },
    { key: 'settings', label: 'Settings & Admin', icon: Settings },
  ];

  const handleSelect = (key: ModuleKey) => {
    onSelectModule(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-[#FAF8F3]/95 dark:bg-[#111815]/95 backdrop-blur-md border-r border-[#E9E5DC] dark:border-[#263630] transition-all duration-300 lg:static ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E9E5DC] dark:border-[#263630]">
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'lg:justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-2xl bg-[#23483F] dark:bg-[#3C7265] text-[#D6BD87] flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                Ω
              </div>
              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-editorial text-base font-bold text-[#23483F] dark:text-[#F1F3EE] truncate tracking-tight">
                    {settings.appName || 'Personal Life OS'}
                  </span>
                  <span className="text-[11px] text-[#777970] dark:text-[#9AA096] truncate">
                    University & Knowledge OS
                  </span>
                </div>
              )}
            </div>

            {/* Collapse button for desktop */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white hover:bg-white dark:hover:bg-[#263630] border border-transparent hover:border-[#E9E5DC] dark:hover:border-[#263630] transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleSelect(item.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#23483F] text-white dark:bg-[#3C7265] shadow-xs'
                      : 'text-[#242823] dark:text-[#F1F3EE] hover:bg-white dark:hover:bg-[#18221E] hover:text-[#23483F] dark:hover:text-[#D6BD87]'
                  } ${isCollapsed ? 'lg:justify-center' : ''}`}
                  title={item.label}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-[#D6BD87]' : 'text-[#777970] dark:text-[#9AA096]'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      className={`ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#A8B8A0]/20 text-[#23483F] dark:text-[#A8B8A0]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Google Drive status card */}
        <div className="p-3 border-t border-[#E9E5DC] dark:border-[#263630]">
          {!isCollapsed ? (
            <div
              onClick={onOpenDriveModal}
              className="p-3 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] cursor-pointer hover:border-[#23483F]/30 dark:hover:border-[#3C7265] transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Cloud className={`w-4 h-4 ${driveConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#777970]'}`} />
                  <span className="text-xs font-semibold text-[#242823] dark:text-[#F1F3EE]">
                    Google Drive
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  driveConnected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                }`}>
                  {driveConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-[#777970] dark:text-[#9AA096]">
                {driveConnected ? 'Workspace sync active' : 'Sync notes & backup'}
              </p>
            </div>
          ) : (
            <button
              onClick={onOpenDriveModal}
              className="w-full flex justify-center p-3 rounded-2xl bg-white dark:bg-[#18221E] border border-[#E9E5DC] dark:border-[#263630] text-[#23483F] dark:text-[#D6BD87]"
              title="Google Drive Sync"
            >
              <Cloud className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-2 px-3 bg-white/95 dark:bg-[#111815]/95 backdrop-blur-md border-t border-[#E9E5DC] dark:border-[#263630]">
        {[
          { key: 'home', label: 'Home', icon: LayoutDashboard },
          { key: 'notebook', label: 'Notebook', icon: BookOpen },
          { key: 'tasks', label: 'Tasks', icon: CheckSquare },
          { key: 'study', label: 'Study', icon: GraduationCap },
          { key: 'ai', label: 'AI', icon: Sparkles },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key as ModuleKey)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                isActive
                  ? 'text-[#23483F] dark:text-[#D6BD87] font-semibold'
                  : 'text-[#777970] dark:text-[#9AA096]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
