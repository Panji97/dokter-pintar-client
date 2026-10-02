'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

/**
  * Guard sederhana untuk route group (main) & (full-page): jika belum login, redirect ke /login.
 * Pemeriksaan dilakukan di client (semua halaman 'use client', sesi di localStorage).
 * Selama memeriksa, tampilkan splash agar konten terlindungi tidak berkedip.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!getSession()) {
      router.replace('/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-[0_0_18px_rgba(45,212,191,0.45)]">
            <span className="text-slate-950 font-black text-xl">D</span>
          </div>
          <div className="text-xs font-medium text-slate-500">Memuat Dokter Pintar…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
