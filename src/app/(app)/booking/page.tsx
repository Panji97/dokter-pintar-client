'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtDate, fmtDateTime } from '@/lib/ClinicStore';
import {
  CalendarPlus, Copy, Check, Search, CalendarDays, History, Clock, Phone, User,
} from 'lucide-react';

type Tab = 'hari-ini' | 'mendatang' | 'riwayat';

const STATUS_STYLE: Record<string, string> = {
  'Menunggu Konfirmasi': 'bg-amber-100 text-amber-700',
  Terjadwal: 'bg-teal-100 text-teal-700',
  Selesai: 'bg-emerald-100 text-emerald-700',
  Dibatalkan: 'bg-rose-100 text-rose-700',
};

export default function BookingPage() {
  const { state, addBooking, updateBookingStatus } = useClinicStore();
  const [tab, setTab] = useState<Tab>('hari-ini');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patientName: '', phone: '', serviceType: 'Konsultasi Gigi', doctor: 'dr. Zaela', date: '', time: '09:00',
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return state.bookings
      .filter((b) =>
        tab === 'hari-ini' ? b.date === todayStr
        : tab === 'mendatang' ? b.date > todayStr
        : b.date < todayStr || b.status === 'Selesai' || b.status === 'Dibatalkan'
      )
      .filter((b) => b.patientName.toLowerCase().includes(q));
  }, [state.bookings, tab, search, todayStr]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://hellodokterpintar.com/dokter-pintar');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard tidak tersedia */
    }
  };

  const submit = () => {
    if (!form.patientName || !form.date) return;
    addBooking({ ...form, status: 'Menunggu Konfirmasi', source: 'Manual' });
    setShowModal(false);
    setForm({ patientName: '', phone: '', serviceType: 'Konsultasi Gigi', doctor: 'dr. Zaela', date: '', time: '09:00' });
  };

  return (
    <>
      <Topbar title="Link Booking" subtitle="Kelola janji temu pasien via HelloDokterPintar dan buat janji manual" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Link Booking card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
            <CalendarPlus className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800">Link Booking</h2>
            <p className="text-xs text-slate-500">
              Anda dapat mengakses link booking untuk dikirimkan ke pasien pada button disamping
            </p>
          </div>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin!' : 'Copy Link'}
          </button>
        </div>

        {/* Daftar Booking */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Daftar Booking</h2>
          </div>

          {/* Tabs + toolbar */}
          <div className="px-5 pt-4 flex flex-col xl:flex-row xl:items-center gap-3">
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-full flex-1">
              {([
                ['hari-ini', 'Hari Ini'],
                ['mendatang', 'Mendatang'],
                ['riwayat', 'Riwayat'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-1 sm:px-4 py-2.5 rounded-lg transition text-center w-full ${tab === key ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full xl:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama pasien"
                  className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 w-full sm:w-56"
                />
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition w-full sm:w-auto"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Buat Janji Pasien
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">
                  {tab === 'riwayat' ? 'Data Riwayat Booking Belum Tersedia' : 'Belum Ada Booking'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {tab === 'riwayat'
                    ? 'Data riwayat booking akan otomatis muncul setelah pasien selesai melakukan pemeriksaan yang ia booking melalui HelloDokterPintar'
                    : 'Booking pasien akan muncul di sini, baik dari HelloDokterPintar, BPJS, maupun manual.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center gap-3 border border-slate-100 rounded-xl px-4 py-3 hover:bg-slate-50 transition">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800">{b.patientName}</div>
                      <div className="text-xs text-slate-400 flex flex-wrap gap-x-3">
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(b.date)} {b.time}</span>
                        <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{b.doctor}</span>
                        <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{b.phone || '-'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {b.serviceType} · {b.source}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[b.status]}`}>
                      {b.status}
                    </span>
                    {b.status === 'Menunggu Konfirmasi' && (
                      <button
                        onClick={() => updateBookingStatus(b.id, 'Terjadwal')}
                        className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-md transition"
                      >
                        Konfirmasi
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal buat janji */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Buat Janji Pasien</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Pasien *</label>
                <input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">No. HP</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Pelayanan</label>
                <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:border-teal-400">
                  {['Konsultasi Gigi', 'Scaling', 'Tambal Gigi', 'Pencabutan Gigi', 'Kontrol Behel'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Dokter</label>
                <select value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:border-teal-400">
                  {['dr. Zaela', 'Drg. Ayu Rosalia', 'dimas', 'dokter made'].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tanggal *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Jam</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Batal</button>
              <button onClick={submit} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition">Simpan Janji</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
