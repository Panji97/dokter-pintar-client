'use client';

import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtRupiah } from '@/lib/ClinicStore';
import {
  Stethoscope, ReceiptText, AlertTriangle, CalendarClock, ChevronDown,
} from 'lucide-react';

/** ===== Dashboard FasKes: KPI + grafik kunjungan/pendapatan + 3 besar penyakit ===== */
function DashboardFasKes() {
  const { state } = useClinicStore();

  const weekRegistrations = state.registrations.filter((r) => {
    const d = new Date(r.regDate);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const newPatients = state.patients.filter((p) => {
    const d = new Date(p.registeredAt);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  // Grafik sederhana 14 hari (data demo deterministik)
  const days = 14;
  const base = 8;
  const visitSeries = Array.from({ length: days }, (_, i) => {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    return Math.max(2, Math.round(base + (seed - Math.floor(seed)) * 8));
  });
  const revenueSeries = visitSeries.map((v) => v * 145000);
  const maxRevenue = Math.max(...revenueSeries);

  const topDiagnoses = [
    { desc: 'Karies dentis', count: 42 },
    { desc: 'Gangguan perkembangan dan erupsi gigi', count: 27 },
    { desc: 'Pulpitis', count: 19 },
  ];

  const kunjunganHariIni = state.registrations.filter(
    (r) => Date.now() - new Date(r.regDate).getTime() < 24 * 60 * 60 * 1000
  ).length;
  const tagihanTertunda = state.invoices.filter((i) => i.paymentStatus === 'Belum Dibayar');
  const stokMenipis = state.medicines.filter((m) => m.stock <= m.minStock).length;

  const kpis = [
    {
      label: 'Kunjungan Hari Ini',
      value: String(kunjunganHariIni),
      accent: 'text-teal-600',
      icon: Stethoscope,
      iconCls: 'text-teal-600',
      sub: 'Registrasi hari ini',
      href: '/registrasi',
    },
    {
      label: 'Tagihan Tertunda',
      value: fmtRupiah(tagihanTertunda.reduce((s, i) => s + i.total, 0)),
      accent: 'text-rose-600',
      icon: ReceiptText,
      iconCls: 'text-rose-500',
      sub: `${tagihanTertunda.length} invoice tertunda`,
      href: '/billing',
    },
    {
      label: 'Stok Menipis',
      value: String(stokMenipis),
      accent: 'text-amber-600',
      icon: AlertTriangle,
      iconCls: 'text-amber-500',
      sub: 'Di bawah batas minimum',
      href: '/farmasi',
    },
  ];

  return (
    <div className="space-y-5">
      {/* KPI live — Mobile: 3 ubin mini sejajar (sama seperti Billing/Farmasi) */}
      <div className="md:hidden grid grid-cols-3 gap-2">
        {kpis.map((k) => (
          <a
            key={k.label}
            href={k.href}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 min-w-0 block"
          >
            <k.icon className={`w-3.5 h-3.5 ${k.iconCls} shrink-0`} />
            <div className={`mt-1 text-[13px] font-bold truncate ${k.accent}`}>{k.value}</div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold truncate">{k.label}</div>
          </a>
        ))}
      </div>
      {/* KPI live — Desktop: 3 kartu */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <a
            key={k.label}
            href={k.href}
            className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition min-w-0"
          >
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <k.icon className={`w-4 h-4 shrink-0 ${k.iconCls}`} />
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">{k.label}</span>
            </div>
            <div className={`text-2xl font-bold truncate ${k.accent} group-hover:scale-[1.02] transition-transform origin-left`}>
              {k.value}
            </div>
            <div className="text-xs text-slate-400 mt-1 truncate">{k.sub}</div>
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 w-fit shadow-sm">
        <CalendarClock className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-semibold text-slate-700" suppressHydrationWarning>
          Minggu ke-{Math.ceil(new Date().getDate() / 7)} {new Date().toLocaleDateString('id-ID', { month: 'long' })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grafik Kunjungan Pasien */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 text-sm mb-4">Grafik Kunjungan Pasien</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Total Pasien Baru</div>
              <div className="text-2xl font-bold text-slate-900">{newPatients}</div>
              <div className="text-[11px] text-slate-400">Satu minggu terakhir</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Total Kunjungan Pasien</div>
              <div className="text-2xl font-bold text-slate-900">{weekRegistrations.length}</div>
              <div className="text-[11px] text-slate-400">Satu minggu terakhir</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-36">
            {visitSeries.map((v, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-teal-700 to-teal-300 rounded-t hover:from-teal-800 transition-all"
                style={{ height: `${(v / Math.max(...visitSeries)) * 100}%` }}
                title={`${v} kunjungan`}
              />
            ))}
          </div>
        </div>

        {/* Grafik Pendapatan + 3 Besar Penyakit */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800 text-sm">Grafik Pendapatan</h2>
              <span className="text-xs text-slate-400">14 hari terakhir</span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {revenueSeries.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-amber-600 to-amber-300 rounded-t hover:from-amber-700 transition-all"
                  style={{ height: `${(v / maxRevenue) * 100}%` }}
                  title={fmtRupiah(v)}
                />
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-600">
              Estimasi 14 hari:{' '}
              <span className="font-bold text-slate-900">{fmtRupiah(revenueSeries.reduce((a, b) => a + b, 0))}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 text-sm mb-3">Grafik 3 Besar Penyakit</h2>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Satu minggu terakhir</span>
            <div className="space-y-2.5 mt-2">
              {topDiagnoses.map((d, i) => (
                <div key={d.desc} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 text-xs font-medium text-slate-700 truncate">{d.desc}</div>
                  <span className="text-sm font-bold text-slate-800">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ===== Dashboard Antrean: tampilan display seperti TV ruang tunggu ===== */
function DashboardAntrean() {
  const [now, setNow] = useState(new Date());
  const { state } = useClinicStore();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const current = state.registrations[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">Pilih Jenis Pelayanan</label>
        <select className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:border-teal-400">
          <option>Semua</option>
          <option>Pelayanan Dokter Gigi Umum</option>
        </select>
        <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" title="Perbesar">
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-teal-700 to-teal-950 rounded-2xl p-8 text-white shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-wide">Dokter Pintar</h2>
          <p className="text-teal-100 text-sm mt-1" suppressHydrationWarning>
            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} —{' '}
            {now.toLocaleTimeString('id-ID')}
          </p>
        </div>

        <p className="text-center text-teal-100 uppercase tracking-[0.3em] text-xs font-bold mb-6">Antrean</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-teal-100 mb-2">Nomor Antrean</p>
            <p className="text-4xl font-black">{current ? 'A-01' : '-'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-teal-100 mb-2">Jenis Pelayanan</p>
            <p className="text-lg font-bold">{current?.serviceType ?? '-'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-teal-100 mb-2">Dokter Pemeriksaan</p>
            <p className="text-lg font-bold">{current?.doctor ?? '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<'faskes' | 'antrean'>('faskes');

  return (
    <>
      <Topbar title="Dashboard" subtitle="Ringkasan operasional dan display antrean FasKes" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-full">
          {([
            ['faskes', 'Dashboard FasKes'],
            ['antrean', 'Dashboard Antrean'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 rounded-lg transition text-center w-full ${tab === key ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'faskes' ? <DashboardFasKes /> : <DashboardAntrean />}
      </main>
    </>
  );
}
