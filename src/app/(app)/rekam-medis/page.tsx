'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtDateTime } from '@/lib/ClinicStore';
import { Search, FileHeart, ClipboardPlus, FileText, Clock } from 'lucide-react';

export default function RekamMedisPage() {
  const { state } = useClinicStore();
  const [tab, setTab] = useState<'hari-ini' | 'tertunda'>('hari-ini');
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const hariIni = useMemo(
    () =>
      state.registrations.filter((r) => r.regDate.slice(0, 10) === todayStr).filter((r) => {
        const q = search.toLowerCase();
        return r.patientName.toLowerCase().includes(q);
      }),
    [state.registrations, search, todayStr]
  );

  const tertunda = useMemo(
    () =>
      state.registrations
        .filter((r) => r.regDate.slice(0, 10) !== todayStr)
        .filter((r) => {
          const q = search.toLowerCase();
          return r.patientName.toLowerCase().includes(q);
        }),
    [state.registrations, search, todayStr]
  );

  return (
    <>
      <Topbar title="Rekam Medis" subtitle="Cari pasien dan buka rekam medis elektronik (SOAP + Odontogram)" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Cari Pasien */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center gap-4">
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pasien"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* Daftar Pasien Registrasi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Daftar Pasien Registrasi</h2>
          </div>
          <div className="px-5 pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-1 overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible bg-slate-100 p-1.5 rounded-xl text-sm font-medium w-full flex-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                ['hari-ini', 'Hari Ini'],
                ['tertunda', `Diagnosa Transaksi Tertunda (${tertunda.length})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 sm:flex-none shrink-0 whitespace-nowrap sm:whitespace-normal px-4 py-2.5 rounded-lg transition text-center sm:w-full ${tab === key ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link
              href="/registrasi"
              className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2.5 rounded-xl transition shrink-0 w-full sm:w-auto"
            >
              <ClipboardPlus className="w-3.5 h-3.5" />
              Mulai Registrasi
            </Link>
          </div>

          <div className="p-5">
            {(tab === 'hari-ini' ? hariIni : tertunda).length === 0 ? (
              <div className="py-12 text-center">
                <FileHeart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">
                  {tab === 'hari-ini' ? 'Daftar Pasien Registrasi Hari Ini Belum Tersedia' : 'Tidak Ada Transaksi Tertunda'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {tab === 'hari-ini'
                    ? 'Silahkan lakukan registrasi pasien terlebih dahulu dan daftar pasien secara otomatis akan muncul'
                    : 'Registrasi dari hari-hari sebelumnya akan muncul di sini.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Tgl. Registrasi</th>
                    <th className="px-4 py-3 font-semibold">Nama Pasien</th>
                    <th className="px-4 py-3 font-semibold">Dokter Pemeriksa</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(tab === 'hari-ini' ? hariIni : tertunda).map((r) => {
                    const { date } = fmtDateTime(r.regDate);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-xs text-slate-600">{date}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{r.patientName}</div>
                          <div className="text-[11px] text-slate-400">{r.group}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700">{r.doctor}</div>
                          <div className="text-[11px] text-slate-400">{r.serviceType}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              r.status === 'Proses' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/rekam-medis/${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-md transition"
                          >
                            <FileText className="w-3 h-3" />
                            Rekam medis
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
