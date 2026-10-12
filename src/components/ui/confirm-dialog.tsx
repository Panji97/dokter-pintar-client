'use client';

import { useCallback, useEffect, useState } from 'react';

interface ConfirmRequest {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
}

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
}

/**
 * Dialog konfirmasi hapus bersama — dipakai SEMUA aksi delete aplikasi.
 * @returns confirm(opts) → Promise<boolean> + elemen dialog untuk di-render sekali.
 */
export function useConfirmDialog() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setReq({
          title: opts.title,
          message: opts.message,
          confirmLabel: opts.confirmLabel ?? 'Hapus',
          resolve,
        });
      }),
    [],
  );

  useEffect(() => {
    if (!req) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const pending = req;
        setReq(null);
        pending.resolve(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [req]);

  const answer = (ok: boolean) => {
    const pending = req;
    setReq(null);
    pending?.resolve(ok);
  };

  const dialog = req ? (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={req.title}
      className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4"
      onClick={() => answer(false)}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-slate-800 text-sm">{req.title}</h3>
        <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{req.message}</div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => answer(false)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => answer(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition"
          >
            {req.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
