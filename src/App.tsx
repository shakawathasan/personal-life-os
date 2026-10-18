/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header.tsx';
import { Sidebar, ModuleKey } from './components/Sidebar.tsx';
import { HomeDashboard } from './components/HomeDashboard.tsx';
import { NotebookModule } from './components/NotebookModule.tsx';
import { DocumentsModule } from './components/DocumentsModule.tsx';
import { TasksModule } from './components/TasksModule.tsx';
import { StudyCenterModule } from './components/StudyCenterModule.tsx';
import { ResearchLawModule } from './components/ResearchLawModule.tsx';
import { VoiceStudioModule } from './components/VoiceStudioModule.tsx';
import { AIWorkspaceModule } from './components/AIWorkspaceModule.tsx';
import { PersonalToolsModule } from './components/PersonalToolsModule.tsx';
import { AdminSettingsModule } from './components/AdminSettingsModule.tsx';
import { GoogleDriveModal } from './components/GoogleDriveModal.tsx';
import { UniversalSearchModal } from './components/UniversalSearchModal.tsx';
import { QuickCaptureModal } from './components/QuickCaptureModal.tsx';
import { StorageService, defaultSettings } from './services/storage.ts';
import { initAuth, getAccessToken } from './services/googleDrive.ts';
import { AppSettings } from './types.ts';

export default function App() {
  const [currentModule, setCurrentModule] = useState<ModuleKey>('home');
  const [activeEntityId, setActiveEntityId] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Sidebar Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showQuickCaptureModal, setShowQuickCaptureModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Google Drive & Auth States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync theme to root DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, accessToken) => {
        setUser(authenticatedUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Keyboard Shortcuts: Cmd/Ctrl+K (Search), Cmd/Ctrl+N (Capture)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setShowQuickCaptureModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    const updated = { ...settings, theme: (next ? 'dark' : 'light') as 'light' | 'dark' };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleNavigate = (module: ModuleKey, entityId?: string) => {
    setCurrentModule(module);
    setActiveEntityId(entityId);
  };

  const driveSyncStatus = user ? 'synced' : 'disconnected';

  const moduleTitles: Record<ModuleKey, string> = {
    home: 'Home Dashboard',
    notebook: 'University Notebook',
    documents: 'Document Vault & OCR',
    tasks: 'Tasks & Planner',
    study: 'Study Center',
    research: 'Research & Law Hub',
    voice: 'Voice Studio',
    ai: 'AI Academic Copilot',
    personal: 'Personal Productivity',
    settings: 'Admin & Settings',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F3] dark:bg-[#111815] text-[#242823] dark:text-[#F1F3EE]">
      {/* Navigation Sidebar */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={(mod) => handleNavigate(mod)}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        settings={settings}
        driveConnected={!!user}
        onOpenDriveModal={() => setShowDriveModal(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenQuickCapture={() => setShowQuickCaptureModal(true)}
          onOpenDriveModal={() => setShowDriveModal(true)}
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          user={user}
          isDriveSyncing={isDriveSyncing}
          driveSyncStatus={driveSyncStatus}
          activeModuleTitle={moduleTitles[currentModule]}
        />

        {/* Active Module Canvas */}
        <main className="flex-1 overflow-hidden" key={refreshKey}>
          {currentModule === 'home' && (
            <HomeDashboard
              onNavigate={handleNavigate}
              onOpenQuickCapture={() => setShowQuickCaptureModal(true)}
              onOpenDriveModal={() => setShowDriveModal(true)}
              driveConnected={!!user}
            />
          )}

          {currentModule === 'notebook' && (
            <NotebookModule
              initialPageId={activeEntityId}
              onOpenDriveModal={() => setShowDriveModal(true)}
            />
          )}

          {currentModule === 'documents' && (
            <DocumentsModule
              onOpenNotebookPage={(pageId) => handleNavigate('notebook', pageId)}
            />
          )}

          {currentModule === 'tasks' && <TasksModule />}

          {currentModule === 'study' && <StudyCenterModule />}

          {currentModule === 'research' && <ResearchLawModule />}

          {currentModule === 'voice' && (
            <VoiceStudioModule
              onNavigateToNote={(pageId) => handleNavigate('notebook', pageId)}
            />
          )}

          {currentModule === 'ai' && (
            <AIWorkspaceModule
              onNavigateToNote={(pageId) => handleNavigate('notebook', pageId)}
            />
          )}

          {currentModule === 'personal' && <PersonalToolsModule />}

          {currentModule === 'settings' && (
            <AdminSettingsModule
              settings={settings}
              onUpdateSettings={(newSettings) => setSettings(newSettings)}
              onOpenDriveModal={() => setShowDriveModal(true)}
              onRefreshAllData={() => setRefreshKey((prev) => prev + 1)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <UniversalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={handleNavigate}
      />

      <QuickCaptureModal
        isOpen={showQuickCaptureModal}
        onClose={() => setShowQuickCaptureModal(false)}
        onRefreshData={() => setRefreshKey((prev) => prev + 1)}
      />

      <GoogleDriveModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        user={user}
        onAuthSuccess={(authUser, authToken) => {
          setUser(authUser);
          setToken(authToken);
        }}
        onAuthLogout={() => {
          setUser(null);
          setToken(null);
        }}
      />
    </div>
  );
}
