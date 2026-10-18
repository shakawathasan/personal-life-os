import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-md p-6 bg-white dark:bg-[#18221E] shadow-2xl rounded-2xl border border-[#E9E5DC] dark:border-[#263630]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${isDestructive ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-[#242823] dark:text-[#F1F3EE]">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[#777970] hover:text-[#242823] dark:text-[#9AA096] dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#777970] dark:text-[#9AA096] mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#242823] dark:text-[#F1F3EE] hover:bg-[#FAF8F3] dark:hover:bg-[#263630] rounded-xl border border-[#E9E5DC] dark:border-[#263630] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-all ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#23483F] hover:bg-[#1C3932] dark:bg-[#3C7265] dark:hover:bg-[#488677]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
