import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  CloudUpload,
  RefreshCw,
  Download,
  Trash2,
  LogOut,
  Folder,
  FileText,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
  listDriveFiles,
  uploadBackupToDrive,
  deleteDriveFile,
  DriveFileItem
} from '../services/googleDrive.ts';
import { StorageService, SyncQueueItem } from '../services/storage.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
  onAuthLogout,
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  
  // Confirmation state for deleting Drive file
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSyncQueue(StorageService.getSyncQueue());
      if (user) {
        fetchFiles();
      }
    }
  }, [isOpen, user]);

  const fetchFiles = async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const files = await listDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to list Google Drive files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        setSuccessMessage('Successfully connected to Google Drive!');
        fetchFiles();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onAuthLogout();
      setDriveFiles([]);
      setSuccessMessage('Google Drive disconnected.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to disconnect');
    }
  };

  const handleUploadFullBackup = async () => {
    const token = await getAccessToken();
    if (!token) {
      setErrorMessage('Please connect Google Drive first.');
      return;
    }
    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const backupJson = StorageService.exportFullBackup();
      await uploadBackupToDrive(token, backupJson);
      setSuccessMessage('Workspace backup saved to Google Drive successfully!');
      fetchFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload backup');
    } finally {
      setIsSyncing(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      await deleteDriveFile(token, fileToDelete.id);
      setSuccessMessage(`Deleted "${fileToDelete.name}" from Google Drive.`);
      setFileToDelete(null);
      fetchFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete file');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#18221E] shadow-2xl rounded-3xl border border-[#E9E5DC] dark:border-[#263630] overflow-hidden">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#E9E5DC] dark:border-[#263630]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#23483F]/10 dark:bg-[#3C7265]/20 text-[#23483F] dark:text-[#A8B8A0]">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-editorial text-xl font-bold text-[#242823] dark:text-[#F1F3EE]">
                  Google Drive Cloud Storage
                </h2>
                <p className="text-xs text-[#777970] dark:text-[#9AA096]">
                  Real-time sync, automated backups, and offline queue
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white hover:bg-[#FAF8F3] dark:hover:bg-[#263630] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Alerts */}
            {errorMessage && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-900">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Connection Status Card */}
            <div className="p-4 rounded-2xl bg-[#FAF8F3] dark:bg-[#111815] border border-[#E9E5DC] dark:border-[#263630]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#777970] dark:text-[#9AA096]">
                      Status
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {user ? 'Authorized & Connected' : 'Not Connected'}
                    </span>
                  </div>
                  {user ? (
                    <div>
                      <p className="text-sm font-semibold text-[#242823] dark:text-[#F1F3EE]">
                        {user.displayName || user.email}
                      </p>
                      <p className="text-xs text-[#777970] dark:text-[#9AA096]">
                        App folder: /Personal Life OS
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#777970] dark:text-[#9AA096] max-w-sm">
                      Connect your Google Account to back up notes, sync documents across devices, and ensure your university work is never lost.
                    </p>
                  )}
                </div>

                {user ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUploadFullBackup}
                      disabled={isSyncing}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] dark:hover:bg-[#488677] rounded-xl shadow-xs transition-all disabled:opacity-50"
                    >
                      <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Backing Up...' : 'Upload Full Backup'}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-[#777970] hover:text-red-600 dark:text-[#9AA096] dark:hover:text-red-400 rounded-xl hover:bg-white dark:hover:bg-[#18221E] border border-transparent hover:border-[#E9E5DC] dark:hover:border-[#263630] transition-colors"
                      title="Disconnect Account"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#242823] dark:text-white bg-white dark:bg-[#18221E] hover:bg-stone-50 dark:hover:bg-[#263630] rounded-xl border border-[#E9E5DC] dark:border-[#263630] shadow-xs transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Offline Sync Queue Section */}
            {syncQueue.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Offline Sync Queue ({syncQueue.length} pending changes)
                  </span>
                  <button
                    onClick={() => {
                      StorageService.saveSyncQueue([]);
                      setSyncQueue([]);
                    }}
                    className="text-[11px] text-amber-800 hover:underline dark:text-amber-300"
                  >
                    Clear Queue
                  </button>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                  Notes and edits made while offline will be automatically uploaded once connectivity and authorization are verified.
                </p>
              </div>
            )}

            {/* Drive Files List */}
            {user && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0]" />
                    <h3 className="text-sm font-semibold text-[#242823] dark:text-[#F1F3EE]">
                      Files in Personal Life OS Folder
                    </h3>
                  </div>
                  <button
                    onClick={fetchFiles}
                    disabled={isLoading}
                    className="p-1 text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white rounded-lg transition-colors"
                    title="Refresh file list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {driveFiles.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#FAF8F3] dark:bg-[#111815] border border-dashed border-[#E9E5DC] dark:border-[#263630]">
                    <HardDrive className="w-8 h-8 mx-auto text-[#777970] mb-2 opacity-50" />
                    <p className="text-sm font-medium text-[#242823] dark:text-[#F1F3EE]">
                      No files in Google Drive yet
                    </p>
                    <p className="text-xs text-[#777970] dark:text-[#9AA096] mt-1">
                      Click "Upload Full Backup" or use "Sync Note" inside any notebook page to save files directly to Google Drive.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E9E5DC] dark:divide-[#263630] border border-[#E9E5DC] dark:border-[#263630] rounded-2xl overflow-hidden bg-white dark:bg-[#18221E]">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 hover:bg-[#FAF8F3] dark:hover:bg-[#111815] transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <FileText className="w-4 h-4 text-[#23483F] dark:text-[#A8B8A0] shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-medium text-[#242823] dark:text-[#F1F3EE] truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-[#777970] dark:text-[#9AA096]">
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Recent'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 text-[#777970] hover:text-red-600 dark:text-[#9AA096] dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Google Drive File Deletion */}
      <ConfirmationModal
        isOpen={!!fileToDelete}
        title="Delete Google Drive File"
        message={`Are you sure you want to permanently delete "${fileToDelete?.name}" from your Google Drive? This action cannot be undone.`}
        confirmText="Delete File"
        isDestructive={true}
        onConfirm={confirmDeleteFile}
        onCancel={() => setFileToDelete(null)}
      />
    </>
  );
};
