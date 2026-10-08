'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardPlus, CalendarDays, Stethoscope, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useShell } from './AppShell';
import { useFetch } from '@/lib/strapi';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import { fmtDate } from '@/lib/ClinicStore';

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
 * `bare`: tanpa kartu pembungkus (untuk sheet mobile agar lega).
 * Komponen ini murni konten — visibilitas & posisi diatur pemiliknya.
 */
export function QueueSidebar({ bare = false }: { bare?: boolean }) {
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

  // Filter tanggal antrean — default hari ini agar user bisa melihat
  // antrean pasien pada tanggal-tanggal lain.
  const [dateFilter, setDateFilter] = useState('');
  const selectedDate = dateFilter || todayStr;
  const isTodaySelected = !!todayStr && selectedDate === todayStr;

  // Registrasi pada tanggal terpilih — fallback: pendaftaran terakhir bila
  // hari ini yang dipilih sedang kosong.
  const sortedRegs = useMemo(
    () => [...registrations].sort((a, b) => b.regDate.localeCompare(a.regDate)),
    [registrations]
  );
  const dateRegs = useMemo(
    () => (selectedDate ? sortedRegs.filter((r) => toLocalDateStr(r.regDate) === selectedDate) : []),
    [sortedRegs, selectedDate]
  );
  const baseRegs = dateRegs.length > 0 || !isTodaySelected ? dateRegs : sortedRegs.slice(0, 10);
  const shownRegs =
    poliFilter === 'Semua'
      ? baseRegs
      : baseRegs.filter((r) => r.room === poliFilter);
  const isFallbackView = isTodaySelected && dateRegs.length === 0 && baseRegs.length > 0;
  const waitingCount = shownRegs.filter((r) => r.status === 'Registrasi').length;
  const emrCount = shownRegs.filter((r) => r.status === 'Proses').length;
  const finishedCount = shownRegs.filter((r) => r.status === 'Selesai').length;

  // Pagination daftar antrean (5 per halaman).
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [selectedDate, poliFilter]);
  const totalPages = Math.max(1, Math.ceil(shownRegs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRegs = shownRegs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const cardCls = bare
    ? 'overflow-hidden'
    : 'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden';
  const legendCls = bare
    ? 'py-2'
    : 'bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2';
  // Desktop (non-bare) dibuat jauh lebih padat agar seluruh panel muat
  // dalam viewport tanpa scroll halaman; mobile/sheet (bare) tetap lega.
  const wrapCls = bare ? 'space-y-4' : 'space-y-2';
  const pxHead = bare ? 'px-1 py-2.5' : 'px-3 py-2';
  const pxFilter = bare ? 'px-1 py-2' : 'px-3 py-2';
  const pxItem = bare ? 'px-1 py-2' : 'px-3 py-1.5';
  const pxPager = bare ? 'px-1 py-2' : 'px-3 py-1.5';
  const listCls = bare
    ? 'h-[300px] overflow-y-auto divide-y divide-slate-50'
    : 'h-[220px] overflow-y-auto divide-y divide-slate-50';

  return (
    <aside className="w-full shrink-0">
      <div className={wrapCls}>
        <div className={cardCls}>
          <div className={`${pxHead} border-b border-slate-100 flex items-center justify-between gap-2`}>
            <div className="min-w-0">
              <h2 className={`font-bold text-slate-800 ${bare ? 'text-sm' : 'text-[13px] leading-tight'}`}>Status Pendaftaran Pasien</h2>
              <p className={`${bare ? 'text-[11px] mt-0.5' : 'text-[10px] mt-px leading-tight'} text-slate-400`}>
                {isFallbackView
                  ? 'Pendaftaran terakhir'
                  : isTodaySelected
                    ? 'Registrasi hari ini'
                    : `Antrean ${fmtDate(selectedDate)}`}
              </p>
            </div>
            <span className={`font-bold bg-teal-600 text-white rounded-full px-2 shrink-0 ${bare ? 'text-[10px] py-1' : 'text-[10px] py-0.5 leading-tight'}`}>
              {shownRegs.length}
            </span>
          </div>

          {/* Ringkasan status */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className={`px-2 text-center ${bare ? 'py-3' : 'py-1.5'}`}>
              <div className={`font-bold text-amber-600 ${bare ? 'text-lg' : 'text-base leading-tight'}`}>{waitingCount}</div>
              <div className={`${bare ? 'text-[9px]' : 'text-[8px]'} uppercase tracking-wider text-slate-400 font-semibold`}>Menunggu</div>
            </div>
            <div className={`px-2 text-center ${bare ? 'py-3' : 'py-1.5'}`}>
              <div className={`font-bold text-blue-600 ${bare ? 'text-lg' : 'text-base leading-tight'}`}>{emrCount}</div>
              <div className={`${bare ? 'text-[9px]' : 'text-[8px]'} uppercase tracking-wider text-slate-400 font-semibold`}>EMR / Proses</div>
            </div>
            <div className={`px-2 text-center ${bare ? 'py-3' : 'py-1.5'}`}>
              <div className={`font-bold text-emerald-600 ${bare ? 'text-lg' : 'text-base leading-tight'}`}>{finishedCount}</div>
              <div className={`${bare ? 'text-[9px]' : 'text-[8px]'} uppercase tracking-wider text-slate-400 font-semibold`}>Selesai</div>
            </div>
          </div>

          {/* Filter antrean: tanggal + poli dalam satu kelompok */}
          <div className={`${pxFilter} border-b border-slate-100 bg-slate-50/60`}>
            <div className={`flex items-center justify-between ${bare ? 'mb-2' : 'mb-1.5'}`}>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <SlidersHorizontal className="w-3 h-3" />
                Filter Antrean
              </span>
              {!isTodaySelected && (
                <button
                  onClick={() => setDateFilter('')}
                  title="Kembali ke hari ini"
                  className="shrink-0 px-2 py-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-full transition"
                >
                  Hari ini
                </button>
              )}
            </div>
            <div className={bare ? 'space-y-2' : 'space-y-1.5'}>
              <div className={`flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 focus-within:border-teal-400 transition ${bare ? 'py-1.5' : 'py-1'}`}>
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  id="queue-date-filter"
                  type="date"
                  aria-label="Tanggal antrean"
                  value={selectedDate}
                  max={todayStr || undefined}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 min-w-0 text-xs bg-transparent outline-none text-slate-700"
                />
              </div>
              <div className={`flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 focus-within:border-teal-400 transition ${bare ? 'py-1.5' : 'py-1'}`}>
                <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  id="queue-poli-filter"
                  aria-label="Filter poli"
                  value={poliFilter}
                  onChange={(e) => setPoliFilter(e.target.value)}
                  className="flex-1 min-w-0 text-xs bg-transparent outline-none text-slate-700"
                >
                  <option value="Semua">Semua Poli</option>
                  {poliOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Daftar registrasi — tinggi tetap untuk 5 baris per halaman, scroll internal */}
          <div className={listCls}>
            {pagedRegs.map((r) => (
              <button
                key={r.id}
                onClick={() => openEmr(r.id)}
                className={`w-full text-left ${pxItem} flex items-center gap-2 hover:bg-slate-50 transition`}
              >
                <div className={`rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0 ${bare ? 'w-8 h-8 text-[11px]' : 'w-7 h-7 text-[10px]'}`}>
                  {r.patientName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-slate-800 truncate ${bare ? 'text-sm' : 'text-[13px] leading-tight'}`}>{r.patientName}</div>
                  <div className={`${bare ? 'text-[11px]' : 'text-[10px] leading-tight'} text-slate-400 truncate`}>
                    {isTodaySelected && !isFallbackView ? `${r.room} · ${r.doctor}` : `${fmtDate(r.regDate)} · ${r.room} · ${r.doctor}`}
                  </div>
                </div>
                <span
                  className={`font-semibold rounded-full shrink-0 ${
                    bare ? 'text-[10px] px-2 py-1' : 'text-[10px] px-1.5 py-0.5 leading-tight'
                  } ${
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
              <div className={`text-center ${bare ? 'px-4 py-10' : 'px-3 py-5'}`}>
                <ClipboardPlus className={`text-slate-200 mx-auto mb-1.5 ${bare ? 'w-8 h-8' : 'w-6 h-6'}`} />
                <p className="text-xs text-slate-400">
                  {poliFilter === 'Semua'
                    ? (isTodaySelected ? 'Belum ada pendaftaran hari ini.' : `Belum ada pendaftaran pada ${fmtDate(selectedDate)}.`)
                    : `Tidak ada antrean di ${poliFilter}.`}
                </p>
                {bare && <p className="text-[11px] text-slate-300 mt-1">Registrasi baru akan muncul di sini secara otomatis.</p>}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`shrink-0 flex items-center justify-between ${pxPager} border-t border-slate-100 ${bare ? '' : 'bg-white'}`}>
              <span className="text-[10px] text-slate-400">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, shownRegs.length)} dari {shownRegs.length}
              </span>
              <span className="flex items-center gap-1">
                <button
                  onClick={() => setPage((v) => Math.max(1, v - 1))}
                  disabled={safePage === 1}
                  aria-label="Halaman sebelumnya"
                  className={`rounded-md text-slate-500 hover:bg-slate-100 transition disabled:opacity-30 disabled:pointer-events-none ${bare ? 'p-1.5' : 'p-1'}`}
                >
                  <ChevronLeft className={bare ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
                </button>
                <span className="text-[10px] font-bold text-slate-600 min-w-7 text-center">
                  {safePage}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Halaman berikutnya"
                  className={`rounded-md text-slate-500 hover:bg-slate-100 transition disabled:opacity-30 disabled:pointer-events-none ${bare ? 'p-1.5' : 'p-1'}`}
                >
                  <ChevronRight className={bare ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
                </button>
              </span>
            </div>
          )}
        </div>
        {/* Panduan alur status — vertikal sama seperti mobile, versi desktop lebih rapat */}
        <div className={legendCls}>
          <p className={`uppercase tracking-wider text-slate-400 font-bold ${bare ? 'text-[10px] mb-2' : 'text-[9px] mb-1'}`}>Alur Status</p>
          <ol>
            {[
              { dot: 'bg-amber-500', label: 'Registrasi', desc: 'Pasien menunggu antrean' },
              { dot: 'bg-blue-500', label: 'Proses', desc: 'Rekam medis (EMR) diisi' },
              { dot: 'bg-emerald-500', label: 'Selesai', desc: 'Pembayaran lunas', last: true },
            ].map((s) => (
              <li key={s.label} className={`flex ${bare ? 'gap-2.5' : 'gap-2'}`}>
                <span className="flex flex-col items-center shrink-0">
                  <span className={`rounded-full mt-0.5 ${s.dot} ${bare ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
                  {!s.last && <span className="w-px flex-1 bg-slate-200 my-0.5" />}
                </span>
                <span className={!s.last ? (bare ? 'pb-2.5' : 'pb-1') : ''}>
                  <span className={`block font-bold text-slate-700 leading-tight ${bare ? 'text-[11px]' : 'text-[10px]'}`}>{s.label}</span>
                  <span className={`block text-slate-400 leading-tight ${bare ? 'text-[10px]' : 'text-[9px]'}`}>{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  );
}
