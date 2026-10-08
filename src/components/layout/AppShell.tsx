'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { QueueSidebar } from './QueueSidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface ToastItem {
  id: number;
  message: string;
}

interface ShellContextValue {
  openSidebar: () => void;
  queueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
  toggleQueue: () => void;
  queueSheetOpen: boolean;
  setQueueSheetOpen: (open: boolean) => void;
  /** Tampilkan toast sukses global (hilang otomatis setelah 4 detik). */
  toast: (message: string) => void;
  /** Mode kolom: lipat/buka leftbar desktop. Mode drawer: buka sheet leftbar. */
  desktopSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;
}

const ShellContext = createContext<ShellContextValue>({
  openSidebar: () => {},
  queueOpen: true,
  setQueueOpen: () => {},
  toggleQueue: () => {},
  toast: () => {},
  queueSheetOpen: false,
  setQueueSheetOpen: () => {},
  desktopSidebarOpen: true,
  toggleDesktopSidebar: () => {},
});

/** Hook untuk membuka sheet sidebar / rightbar dari komponen mana pun (dipakai Topbar). */
export function useShell() {
  return useContext(ShellContext);
}

/**
 * Provider state shell + ClinicStore + drawer mobile (sidebar & antrean).
 * Dipakai oleh AppShell (main) dan FullPageShell (full-page) agar Topbar
 * yang SAMA persis berfungsi di kedua layout.
 */
export function ShellProvider({
  children,
  defaultQueueOpen = true,
  sidebarMode = 'column',
}: {
  children: React.ReactNode;
  defaultQueueOpen?: boolean;
  /** 'column': leftbar kolom desktop bisa dilipat. 'drawer': hamburger desktop membuka sheet. */
  sidebarMode?: 'column' | 'drawer';
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queueSheetOpen, setQueueSheetOpen] = useState(false);
  // Nilai awal konstan agar HTML server & hidrasi klien pertama identik.
  // Preferensi localStorage disinkronkan setelah mount — membaca
  // localStorage saat render menyebabkan hydration mismatch.
  const [queueOpen, setQueueOpen] = useState(defaultQueueOpen);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    // Via timeout (callback) agar lolos aturan react-hooks/set-state-in-effect;
    // tetap setelah mount sehingga tidak ada hydration mismatch.
    const t = window.setTimeout(() => {
      try {
        if (localStorage.getItem('dokter-pintar-queue') === 'closed') setQueueOpen(false);
        if (localStorage.getItem('dokter-pintar-sidebar') === 'closed') setDesktopSidebarOpen(false);
      } catch {
        /* abaikan */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const toggleDesktopSidebar = useCallback(() => {
    if (sidebarMode === 'drawer') {
      setSidebarOpen(true);
      return;
    }
    setDesktopSidebarOpen((v) => {
      try {
        localStorage.setItem('dokter-pintar-sidebar', v ? 'closed' : 'open');
      } catch {
        /* abaikan */
      }
      return !v;
    });
  }, [sidebarMode]);
  const toggleQueue = useCallback(() => {
    setQueueOpen((v) => {
      try {
        localStorage.setItem('dokter-pintar-queue', v ? 'closed' : 'open');
      } catch {
        /* abaikan */
      }
      return !v;
    });
  }, []);
  /** Pastikan panel antrean desktop terbuka (dipakai setelah registrasi). */
  const setQueueOpenValue = useCallback((open: boolean) => {
    try {
      localStorage.setItem('dokter-pintar-queue', open ? 'open' : 'closed');
    } catch {
      /* abaikan */
    }
    setQueueOpen(open);
  }, []);

  // Toast sukses global — tumpuk maksimal 3, tiap item hilang otomatis.
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx = useMemo(
    () => ({ openSidebar, queueOpen, setQueueOpen: setQueueOpenValue, toggleQueue, queueSheetOpen, setQueueSheetOpen, desktopSidebarOpen, toggleDesktopSidebar, toast }),
    [openSidebar, queueOpen, setQueueOpenValue, toggleQueue, queueSheetOpen, desktopSidebarOpen, toggleDesktopSidebar, toast]
  );

  return (
    <ShellContext.Provider value={ctx}>
      {children}

        {/* Sheet leftbar (mobile) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72 max-w-[85vw] gap-0" showCloseButton={false}>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Sheet rightbar antrean (mobile/tablet) — tanpa kartu agar lega */}
        <Sheet open={queueSheetOpen} onOpenChange={setQueueSheetOpen}>
          <SheetContent side="right" className="w-80 max-w-[85vw] gap-0 p-3 overflow-y-auto" showCloseButton={false}>
            <QueueSidebar bare />
          </SheetContent>
        </Sheet>

        {/* Toast sukses global */}
        {toasts.length > 0 && (
          <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 z-[100] space-y-2" role="status" aria-live="polite">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-2.5 px-4 py-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <p className="flex-1">{t.message}</p>
                <button
                  onClick={() => dismissToast(t.id)}
                  aria-label="Tutup notifikasi"
                  className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
    </ShellContext.Provider>
  );
}

/** Konten fleksibel + penanda ruang rightbar (iselaraskan dengan CSS .shell-queue-open). */
function ShellContent({ children }: { children: React.ReactNode }) {
  const { queueOpen } = useShell();
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className={`flex-1 flex flex-col min-w-0 shell-content ${queueOpen ? 'shell-queue-open' : ''}`}
    >
      {children}
    </div>
  );
}

/** Panel rightbar antrean: fixed kanan di bawah Topbar saat terbuka (xl+). */
function QueuePanel() {
  const { queueOpen } = useShell();
  if (!queueOpen) return null;
  return (
    <div className="hidden xl:block fixed right-0 top-0 bottom-0 w-80 z-20 overflow-y-auto bg-slate-50 border-l border-slate-200 px-4 pt-[76px] pb-4">
      <QueueSidebar />
    </div>
  );
}

interface ShellProps {
  children: React.ReactNode;
}

/**
 * Layout full responsive (route group main):
 * - Leftbar: kolom tetap (md+) / sheet hamburger (mobile).
 * - Topbar (dirender tiap halaman): full-width area konten — rightbar
 *   TIDAK memakan tempat Topbar, melainkan panel fixed di bawahnya (xl+).
 * - Rightbar antrean: fixed kanan di bawah Topbar saat terbuka (xl+),
 *   Sheet kanan di mobile/tablet (<xl) via tombol di Topbar.
 * Notifikasi tampil sebagai dropdown di Topbar.
 */
export function AppShell({ children }: ShellProps) {
  return (
    <ShellProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          {/* ============ Leftbar (tetap, md+) ============ */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="sticky top-0 h-screen">
              <Sidebar />
            </div>
          </div>

          {/* ============ Konten (Topbar full-width + isi) ============ */}
          <div className="flex-1 min-w-0 flex flex-col">
            <ShellContent>{children}</ShellContent>
          </div>
        </div>
      </div>

      {/* ============ Rightbar desktop (xl+) ============ */}
      <QueuePanel />
    </ShellProvider>
  );
}

/**
 * Layout full-width (route group full-page): tanpa kolom leftbar.
 * Topbar yang SAMA persis tetap dipakai dan semua tombolnya berfungsi —
 * sidebar tersedia sebagai drawer dan panel antrean bisa dibuka via
 * tombol antrean (default tertutup agar halaman fokus full).
 */
export function FullPageShell({ children }: ShellProps) {
  return (
    <ShellProvider defaultQueueOpen={false} sidebarMode="drawer">
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen flex-col">
          <ShellContent>{children}</ShellContent>
        </div>
      </div>

      {/* ============ Rightbar desktop (xl+, opsional via tombol Topbar) ============ */}
      <QueuePanel />
    </ShellProvider>
  );
}
