'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardPlus } from 'lucide-react';
import { useShell } from './AppShell';
import { useFetch } from '@/lib/strapi';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import { fmtDate, fmtDateTime } from '@/lib/ClinicStore';

/** Tanggal lokal YYYY-MM-DD (hindari bug UTC: toISOString bisa mundur 1 hari di WIB). */
function getLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ambil tanggal lokal YYYY-MM-DD dari ISO datetime (regDate disimpan tengah malam lokal). */
function toLocalDateStr(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return getLocalDateStr(d);
}

/**
 * Rightbar antrean/status pendaftaran pasien — tampil di semua menu.
 * Desktop (xl+): panel fixed di bawah Topbar (AppShell).
 * Mobile/tablet (<xl): dibuka via Sheet dari tombol di Topbar.
 * Komponen ini murni konten — visibilitas & posisi diatur pemiliknya.
 */
export function QueueSidebar() {
  const router = useRouter();
  const { setQueueSheetOpen } = useShell();

  const { data: roomsRes } = useFetch(STRAPI_ENDPOINTS.rooms, {
    pagination: { pageSize: 100 },
    sort: 'createdAt:ASC',
  });
  const { data: regsRes } = useFetch(STRAPI_ENDPOINTS.registrations, {
    pagination: { pageSize: 100 },
    sort: 'regDate:DESC',
  });
  const { data: invsRes } = useFetch(STRAPI_ENDPOINTS.invoices, {
    pagination: { pageSize: 100 },
    sort: 'createdAt:DESC',
  });

  const openEmr = (regId: string) => {
    // Di mobile/tablet rightbar tampil sebagai drawer — tutup otomatis setelah memilih.
    setQueueSheetOpen(false);
    router.push(`/rekam-medis/${regId}`);
  };

  // Diisi setelah mount agar HTML server & hidrasi klien pertama identik.
  // new Date() saat render menghasilkan daftar berbeda (hydration mismatch).
  // Pakai tanggal LOKAL — toISOString (UTC) mundur 1 hari untuk WIB.
  const [todayStr, setTodayStr] = useState('');
  useEffect(() => {
    setTodayStr(getLocalDateStr());
  }, []);

  const rooms = useMemo(() => {
    return ((roomsRes?.data ?? []) as Array<{ name?: string }>).map((r) => r.name || '').filter(Boolean);
  }, [roomsRes]);

  const registrations = useMemo(() => {
    // Invoice Lunas -> kunci visitId (kunjungan spesifik) + fallback pasien+tanggal
    // agar "Selesai" hanya muncul bila payment untuk kunjungan tanggal tersebut.
    const paidInvs = (
      (invsRes?.data ?? []) as Array<{
        visitId?: string | number;
        patientId?: string;
        patientName?: string;
        date?: string;
        paidAt?: string;
        paymentStatus?: string;
      }>
    ).filter((inv) => inv.paymentStatus === 'Lunas');

    // 1) visitId exact (documentId maupun id numerik, dinormalisasi ke string)
    const paidVisitIds = new Set(
      paidInvs
        .filter((inv) => inv.visitId !== null && inv.visitId !== undefined && String(inv.visitId) !== '')
        .map((inv) => String(inv.visitId))
    );

    // 2) fallback pasien + tanggal kunjungan (bila visitId kosong / tidak cocok):
    //    invoice.date bertipe date (YYYY-MM-DD), paidAt juga date-only.
    const paidPatientDate = new Set(
      paidInvs
        .map((inv) => {
          const pid =
            String(inv.patientId || '').toUpperCase().trim() ||
            String(inv.patientName || '').toUpperCase().trim();
          const d = (inv.date || '').slice(0, 10) || (inv.paidAt || '').slice(0, 10);
          return pid && d ? `${pid}__${d}` : '';
        })
        .filter(Boolean)
    );

    return ((regsRes?.data ?? []) as Array<{
      id?: string | number;
      documentId?: string;
      regDate?: string;
      patientId?: string;
      patientName?: string;
      room?: string;
      doctor?: string;
      status?: string;
    }>).map((r) => {
      const docId = r.documentId || String(r.id ?? '');
      const rawId = String(r.id ?? '');
      const regLocalDate = toLocalDateStr(r.regDate || '');

      const paidByVisit = paidVisitIds.has(docId) || (rawId !== '' && paidVisitIds.has(rawId));
      const pkey =
        String(r.patientId || '').toUpperCase().trim() ||
        String(r.patientName || '').toUpperCase().trim();
      const paidByPatientDate =
        !!pkey && !!regLocalDate && paidPatientDate.has(`${pkey}__${regLocalDate}`);
      // Selesai bila: status server sudah Selesai, atau ada payment Lunas
      // untuk kunjungan (visitId) / tanggal kunjungan tersebut.
      const isPaidToday = paidByVisit || paidByPatientDate;
      const computedStatus =
        r.status === 'Selesai' || isPaidToday ? 'Selesai' : r.status || 'Registrasi';

      return {
        id: docId,
        regDate: r.regDate || '',
        patientName: r.patientName || '',
        room: r.room || '',
        doctor: r.doctor || '',
        status: computedStatus,
      };
    });
  }, [regsRes, invsRes]);

  // Filter antrean berdasarkan poli.
  const [poliFilter, setPoliFilter] = useState('Semua');
  const poliOptions = useMemo(() => rooms, [rooms]);

  // Registrasi hari ini — fallback: pendaftaran terakhir bila hari ini kosong.
  const sortedRegs = useMemo(
    () => [...registrations].sort((a, b) => b.regDate.localeCompare(a.regDate)),
    [registrations]
  );
  const todayRegs = useMemo(
    () => (todayStr ? sortedRegs.filter((r) => toLocalDateStr(r.regDate) === todayStr) : []),
    [sortedRegs, todayStr]
  );
  const baseRegs = todayRegs.length > 0 ? todayRegs : sortedRegs.slice(0, 10);
  const shownRegs =
    poliFilter === 'Semua'
      ? baseRegs
      : baseRegs.filter((r) => r.room === poliFilter);
  const isTodayView = todayRegs.length > 0;
  const waitingCount = shownRegs.filter((r) => r.status === 'Registrasi').length;
  const emrCount = shownRegs.filter((r) => r.status === 'Proses').length;
  const finishedCount = shownRegs.filter((r) => r.status === 'Selesai').length;

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
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="px-2 py-3 text-center">
              <div className="text-lg font-bold text-amber-600">{waitingCount}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Menunggu</div>
            </div>
            <div className="px-2 py-3 text-center">
              <div className="text-lg font-bold text-blue-600">{emrCount}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">EMR / Proses</div>
            </div>
            <div className="px-2 py-3 text-center">
              <div className="text-lg font-bold text-emerald-600">{finishedCount}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Selesai</div>
            </div>
          </div>

          {/* Filter berdasarkan poli */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <label htmlFor="queue-poli-filter" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Filter Poli
            </label>
            <select
              id="queue-poli-filter"
              value={poliFilter}
              onChange={(e) => setPoliFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-400 bg-white text-slate-700"
            >
              <option value="Semua">Semua Poli</option>
              {poliOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
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
                    {isTodayView ? fmtDateTime(r.regDate).time : fmtDate(r.regDate)} · {r.room} · {r.doctor}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                    r.status === 'Selesai'
                      ? 'bg-emerald-100 text-emerald-700'
                      : r.status === 'Proses'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {r.status}
                </span>
              </button>
            ))}
            {shownRegs.length === 0 && (
              <div className="px-4 py-10 text-center">
                <ClipboardPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  {poliFilter === 'Semua'
                    ? 'Belum ada pendaftaran hari ini.'
                    : `Tidak ada antrean di ${poliFilter}.`}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">Registrasi baru akan muncul di sini secara otomatis.</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
          Status: <span className="font-semibold text-amber-600">Registrasi</span> (menunggu) →{' '}
          <span className="font-semibold text-blue-600">Proses</span> (EMR) →{' '}
          <span className="font-semibold text-emerald-600">Selesai</span> (pembayaran lunas).
        </p>
      </div>
    </aside>
  );
}
