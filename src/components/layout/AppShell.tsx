'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { QueueSidebar } from './QueueSidebar';
import { ClinicStoreProvider } from '@/lib/ClinicStore';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface ShellContextValue {
  openSidebar: () => void;
  queueOpen: boolean;
  toggleQueue: () => void;
  queueSheetOpen: boolean;
  setQueueSheetOpen: (open: boolean) => void;
}

const ShellContext = createContext<ShellContextValue>({
  openSidebar: () => {},
  queueOpen: true,
  toggleQueue: () => {},
  queueSheetOpen: false,
  setQueueSheetOpen: () => {},
});

/** Hook untuk membuka sheet sidebar / rightbar dari komponen mana pun (dipakai Topbar). */
export function useShell() {
  return useContext(ShellContext);
}

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Layout full responsive:
 * - Leftbar: kolom tetap (md+) / sheet hamburger (mobile).
 * - Topbar (dirender tiap halaman): full-width area konten — rightbar
 *   TIDAK memakan tempat Topbar, melainkan panel fixed di bawahnya (xl+).
 * - Rightbar antrean: fixed kanan di bawah Topbar saat terbuka (xl+),
 *   Sheet kanan di mobile/tablet (<xl) via tombol di Topbar.
 * Notifikasi tampil sebagai dropdown di Topbar.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queueSheetOpen, setQueueSheetOpen] = useState(false);
  // Nilai awal konstan agar HTML server & hidrasi klien pertama identik.
  // Preferensi localStorage disinkronkan setelah mount — membaca
  // localStorage saat render menyebabkan hydration mismatch.
  const [queueOpen, setQueueOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem('dokter-pintar-queue') === 'closed') setQueueOpen(false);
    } catch {
      /* abaikan */
    }
  }, []);
  const pathname = usePathname();

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
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
  const ctx = useMemo(
    () => ({ openSidebar, queueOpen, toggleQueue, queueSheetOpen, setQueueSheetOpen }),
    [openSidebar, queueOpen, toggleQueue, queueSheetOpen]
  );

  return (
    <ShellContext.Provider value={ctx}>
      <ClinicStoreProvider>
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
              <div
                key={pathname}
                className={`flex-1 flex flex-col min-w-0 shell-content ${queueOpen ? 'shell-queue-open' : ''}`}
              >
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* ============ Rightbar desktop (xl+): fixed di bawah Topbar ============ */}
        {queueOpen && (
          <div className="hidden xl:block fixed right-0 top-0 bottom-0 w-80 z-20 overflow-y-auto bg-slate-50 border-l border-slate-200 px-4 pt-[76px] pb-4">
            <QueueSidebar />
          </div>
        )}

        {/* Sheet leftbar (mobile) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72 max-w-[85vw] gap-0" showCloseButton={false}>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Sheet rightbar antrean (mobile/tablet) */}
        <Sheet open={queueSheetOpen} onOpenChange={setQueueSheetOpen}>
          <SheetContent side="right" className="w-80 max-w-[85vw] gap-0 p-4 overflow-y-auto">
            <QueueSidebar />
          </SheetContent>
        </Sheet>
      </ClinicStoreProvider>
    </ShellContext.Provider>
  );
}
