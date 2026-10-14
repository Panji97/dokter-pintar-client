'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Info } from 'lucide-react';

interface PrintPreviewProps {
  open: boolean;
  title: string;
  docNo?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Cetak di dalam tab yang sama (tanpa window.open / tab baru).
 * - Desktop: overlay modal menampilkan dokumen persis seperti hasil cetak
 *   (kertas A4), lalu tombol Cetak / PDF membuka dialog print browser.
 * - Mobile (<768px): tanpa preview — dialog print sistem langsung dibuka
 *   saat tombol Cetak ditekan (preview A4 sulit responsif di layar kecil).
 *   Di dialog sistem, pilih printer untuk kertas atau “Save as PDF”.
 */
export function PrintPreview({ open, title, docNo, onClose, children }: PrintPreviewProps) {
  // Ditentukan sekali saat dibuka agar tidak berubah saat rotasi/resize.
  const [isMobile, setIsMobile] = useState(false);

  const doPrint = useCallback(() => {
    document.body.classList.add('dpi-printing');
    // Tunggu satu frame agar class menempel sebelum dialog print dibuka.
    requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    setIsMobile(mobile);
    const after = () => document.body.classList.remove('dpi-printing');
    window.addEventListener('afterprint', after);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Kunci scroll latar hanya untuk preview desktop (mobile tak ada overlay).
    const prev = document.body.style.overflow;
    if (!mobile) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('afterprint', after);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.body.classList.remove('dpi-printing');
    };
  }, [open, onClose]);

  // Mobile: langsung buka dialog print sistem setelah konten terpasang.
  // Konten ada di DOM (disembunyikan di layar, ditampilkan oleh CSS print),
  // lalu ditutup kembali lewat event afterprint saat dialog selesai.
  useEffect(() => {
    if (!open || !isMobile) return;
    const t = requestAnimationFrame(() => {
      document.body.classList.add('dpi-printing');
      const done = () => {
        document.body.classList.remove('dpi-printing');
        onClose();
      };
      window.addEventListener('afterprint', done, { once: true });
      window.print();
    });
    return () => cancelAnimationFrame(t);
  }, [open, isMobile, onClose]);

  if (!open || typeof document === 'undefined') return null;

  // Mobile: hanya area cetak tersembunyi (tak ada overlay/preview).
  if (isMobile) {
    return createPortal(
      <div id="dpi-print-portal">
        <div className="dpi-print-only">
          <div className="print-area">{children}</div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div id="dpi-print-portal">
      {/* Overlay — disembunyikan saat print via .dpi-no-print */}
      <div
        className="dpi-no-print fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${title}`}
      >
        <div
          className="min-h-full flex flex-col items-center px-3 py-4 md:py-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="w-full max-w-[210mm] bg-white rounded-2xl shadow-2xl px-4 md:px-5 py-3.5 flex flex-wrap items-center gap-2.5 sticky top-2 z-10 border border-slate-200">
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-slate-800 text-sm truncate">{title}</h2>
              {docNo && <p className="text-[11px] text-slate-400 font-mono truncate">{docNo}</p>}
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <X className="w-3.5 h-3.5" /> Tutup
            </button>
            <button
              onClick={doPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / PDF
            </button>
          </div>

          <p className="w-full max-w-[210mm] mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-300">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              Preview di tab ini — tidak membuka tab baru. Klik <b>Cetak / PDF</b>:
              pilih printer untuk cetak kertas, atau pilih tujuan “Save as PDF”
              untuk unduh PDF.
            </span>
          </p>

          {/* Kertas A4 */}
          <div className="print-area w-full max-w-[210mm] bg-white shadow-2xl mt-2.5 mb-6 overflow-hidden rounded-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Area cetak murni — hanya tampil saat print (duplikat agar toolbar
          & overlay tidak ikut tercetak walau visibility gagal). */}
      <div className="dpi-print-only">
        <div className="print-area">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
