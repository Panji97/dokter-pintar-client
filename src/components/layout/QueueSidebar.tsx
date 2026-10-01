'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardPlus } from 'lucide-react';
import { useShell } from './AppShell';
import { useClinicStore, fmtDate, fmtDateTime } from '@/lib/ClinicStore';

/**
 * Rightbar antrean/status pendaftaran pasien — tampil di semua menu.
 * Desktop (xl+): panel fixed di bawah Topbar (AppShell).
 * Mobile/tablet (<xl): dibuka via Sheet dari tombol di Topbar.
 * Komponen ini murni konten — visibilitas & posisi diatur pemiliknya.
 */
export function QueueSidebar() {
  const router = useRouter();
  const { state } = useClinicStore();
  const { setQueueSheetOpen } = useShell();

  const openEmr = (regId: string) => {
    // Di mobile/tablet rightbar tampil sebagai drawer — tutup otomatis setelah memilih.
    setQueueSheetOpen(false);
    router.push(`/rekam-medis/${regId}`);
  };

  // Diisi setelah mount agar HTML server & hidrasi klien pertama identik.
  // new Date() saat render menghasilkan daftar berbeda (hydration mismatch).
  const [todayStr, setTodayStr] = useState('');
  useEffect(() => {
    setTodayStr(new Date().toISOString().slice(0, 10));
  }, []);

  // Registrasi hari ini — fallback: pendaftaran terakhir bila hari ini kosong.
  const sortedRegs = useMemo(
    () => [...state.registrations].sort((a, b) => b.regDate.localeCompare(a.regDate)),
    [state.registrations]
  );
  const todayRegs = useMemo(
    () => sortedRegs.filter((r) => r.regDate.slice(0, 10) === todayStr),
    [sortedRegs, todayStr]
  );
  const shownRegs = todayRegs.length > 0 ? todayRegs : sortedRegs.slice(0, 10);
  const isTodayView = todayRegs.length > 0;
  const waitingCount = shownRegs.filter((r) => r.status === 'Registrasi').length;
  const emrCount = shownRegs.filter((r) => r.status === 'Proses').length;

  return (
    <aside className="w-full shrink-0">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-800 text-sm">Status Pendaftaran Pasien</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{isTodayView ? 'Registrasi hari ini' : 'Pendaftaran terakhir'}</p>
            </div>
            <span className="text-[10px] font-bold bg-teal-600 text-white rounded-full px-2 py-1 shrink-0">
              {shownRegs.length}
            </span>
          </div>

          {/* Ringkasan status */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
            <div className="px-4 py-3 text-center">
              <div className="text-lg font-bold text-amber-600">{waitingCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Menunggu Pemeriksaan</div>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-lg font-bold text-blue-600">{emrCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Sudah Ada EMR</div>
            </div>
          </div>

          {/* Daftar registrasi */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {shownRegs.map((r) => (
              <button
                key={r.id}
                onClick={() => openEmr(r.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                  {r.patientName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{r.patientName}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {isTodayView ? fmtDateTime(r.regDate).time : fmtDate(r.regDate)} · {r.doctor} · {r.group}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                    r.status === 'Proses' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {r.status}
                </span>
              </button>
            ))}
            {shownRegs.length === 0 && (
              <div className="px-4 py-10 text-center">
                <ClipboardPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Belum ada pendaftaran hari ini.</p>
                <p className="text-[11px] text-slate-300 mt-1">Registrasi baru akan muncul di sini secara otomatis.</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
          Status berubah menjadi <span className="font-semibold text-blue-600">Proses</span> setelah rekam medis pasien disimpan.
        </p>
      </div>
    </aside>
  );
}
