'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

/**
 * Modal form bersama untuk semua CRUD Pengaturan Sistem —
 * daftar tetap ramping, form hanya muncul saat Tambah/Ubah.
 */
export function FormModal({
  open,
  title,
  submitLabel,
  saving = false,
  onClose,
  onSubmit,
  children,
}: FormModalProps) {
  useEffect(() => {
    if (!open || saving) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white transition disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
