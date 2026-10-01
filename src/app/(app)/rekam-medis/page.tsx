'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtDate } from '@/lib/ClinicStore';
import { Search, FileHeart, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import type { Registration } from '@/types/clinic';

export default function RekamMedisPage() {
  const { state } = useClinicStore();
  const [search, setSearch] = useState('');

  // Master pasien lama + registrasi terakhir tiap pasien
  // (tanggal, dokter pemeriksa, poli), urut kunjungan terbaru.
  const list = useMemo(
    () => {
      const lastByPatient = new Map<string, Registration>();
      [...state.registrations]
        .sort((a, b) => b.regDate.localeCompare(a.regDate))
        .forEach((r) => {
          if (!lastByPatient.has(r.patientId)) lastByPatient.set(r.patientId, r);
        });
      return state.patients
        .filter((p) => {
          const q = search.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.nik.includes(search);
        })
        .map((p) => ({ patient: p, lastReg: lastByPatient.get(p.id) ?? null }))
        .sort((a, b) =>
          (b.lastReg?.regDate ?? '').localeCompare(a.lastReg?.regDate ?? '')
        );
    },
    [state.patients, state.registrations, search]
  );

  // Pagination: 4 data per halaman
  const PAGE_SIZE = 4;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedList = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = list.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, list.length);

  return (
    <>
      <Topbar title="Rekam Medis" subtitle="Cari pasien dan buka rekam medis elektronik (SOAP + Odontogram)" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Cari Pasien */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
            <Search className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800">Cari Pasien</h2>
            <p className="text-xs text-slate-500">Anda dapat melakukan pencarian data pasien di FasKes Anda</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama pasien"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* Daftar Pasien Registrasi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 md:px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Daftar Pasien</h2>
          </div>
          {list.length === 0 ? (
            <div className="p-4 md:p-5">
              <div className="py-12 text-center">
                <FileHeart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">
                  Daftar Pasien Belum Tersedia
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tambahkan pasien baru melalui menu Registrasi
                </p>
              </div>
            </div>
          ) : (
              <>
                {/* Header kolom (desktop) */}
                <div className="hidden md:grid grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)_130px_120px] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <span className="pl-[52px]">Nama Pasien</span>
                  <span>Reg. Terakhir</span>
                  <span>Dokter Pemeriksa</span>
                  <span>Poli</span>
                  <span className="text-right">Aksi</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {pagedList.map(({ patient: p, lastReg }) => (
                    <div
                      key={p.id}
                      className="w-full text-left px-4 md:px-5 py-3.5 transition grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)_130px_120px] md:items-center gap-2 md:gap-3 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-slate-100 text-slate-500">
                          {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-slate-800 truncate">
                            {p.name}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-mono truncate">
                            NIK {p.nik}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2 md:contents">
                        <span className="md:hidden min-w-0">
                          <span className="block text-[11px] text-slate-400 truncate">
                            Terakhir: {lastReg ? fmtDate(lastReg.regDate) : '-'}
                          </span>
                          <span className="block text-[11px] text-slate-400 truncate">
                            {lastReg ? `${lastReg.doctor} · ${lastReg.room}` : 'Belum ada kunjungan'}
                          </span>
                        </span>
                        <span className="hidden md:block text-xs text-slate-600">
                          {lastReg ? fmtDate(lastReg.regDate) : '-'}
                        </span>
                        <span className="hidden md:block text-xs text-slate-600 truncate">
                          {lastReg ? lastReg.doctor : '-'}
                        </span>
                        <span className="hidden md:block text-xs text-slate-600 truncate">
                          {lastReg ? lastReg.room : '-'}
                        </span>
                        {lastReg ? (
                          <Link
                            href={`/rekam-medis/${lastReg.id}`}
                            className="inline-flex shrink-0 items-center justify-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 active:bg-teal-100 px-2.5 py-1.5 rounded-md transition md:justify-self-end"
                          >
                            <FileText className="w-3 h-3" />
                            Rekam medis
                          </Link>
                        ) : (
                          <button
                            disabled
                            title="Pasien belum memiliki kunjungan"
                            className="inline-flex shrink-0 items-center justify-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-md transition md:justify-self-end disabled:opacity-40 disabled:pointer-events-none"
                          >
                            <FileText className="w-3 h-3" />
                            Rekam medis
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {list.length > 0 && (
              <div className="flex flex-col items-center gap-2.5 px-4 md:px-5 py-3.5 border-t border-slate-100 sm:flex-row sm:justify-between">
                <span className="text-xs text-slate-400 text-center">
                  Menampilkan {rangeStart}–{rangeEnd} dari {list.length} pasien
                </span>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setPage((v) => Math.max(1, v - 1))}
                    disabled={safePage === 1}
                    aria-label="Halaman sebelumnya"
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-medium transition ${
                        n === safePage
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100 active:bg-slate-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Halaman berikutnya"
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
        </div>
      </main>
    </>
  );
}
