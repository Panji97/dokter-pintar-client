'use client';

import { useMemo, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtRupiah, fmtDate } from '@/lib/ClinicStore';
import { FileText, TrendingUp, Users, Activity, FileDown, Pill, Receipt } from 'lucide-react';

type Tab = 'rekam-medis' | 'kunjungan' | 'transaksi';

const RM_CATEGORIES = [
  'Laporan Rekam Medis Harian',
  'Laporan Diagnosa (ICD-10)',
  'Laporan Tindakan (ICD-9-CM)',
  'Laporan SKP — Standar Pelayanan Kefarmasian',
  'Laporan Odontogram',
];

export default function LaporanPage() {
  const { state } = useClinicStore();
  const [tab, setTab] = useState<Tab>('rekam-medis');
  const [category, setCategory] = useState(RM_CATEGORIES[0]);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const inRange = (d: string) => d >= from && d <= to;

  const stats = useMemo(() => {
    const regs = state.registrations.filter((r) => inRange(r.regDate.slice(0, 10)));
    const invoices = state.invoices.filter((i) => inRange(i.date));
    const revenue = invoices.reduce((s, i) => s + i.total, 0);
    const lunas = invoices.filter((i) => i.paymentStatus === 'Lunas').reduce((s, i) => s + i.total, 0);
    const apotek = state.apotekInvoices.filter((a) => inRange(a.date)).reduce((s, a) => s + a.total, 0);

    // distribusi diagnosa dari EMR
    const diagCount: Record<string, number> = {};
    Object.values(state.emr).forEach((e) =>
      e.diagnosa.forEach((d) => {
        const key = `${d.icd10Code} ${d.icd10Desc}`;
        diagCount[key] = (diagCount[key] ?? 0) + 1;
      })
    );
    const topDiag = Object.entries(diagCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // pemakaian obat dari resep
    const medCount: Record<string, number> = {};
    Object.values(state.emr).forEach((e) =>
      e.resepApotek.forEach((r) => r.items.forEach((i) => {
        medCount[i.name] = (medCount[i.name] ?? 0) + i.qty;
      }))
    );
    const topMed = Object.entries(medCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const kunjunganPerDokter: Record<string, number> = {};
    regs.forEach((r) => {
      kunjunganPerDokter[r.doctor] = (kunjunganPerDokter[r.doctor] ?? 0) + 1;
    });

    return { regs, invoices, revenue, lunas, apotek, topDiag, topMed, kunjunganPerDokter };
  }, [state, from, to]);

  return (
    <>
      <Topbar title="Laporan" subtitle="Laporan rekam medis, kunjungan, dan transaksi FasKes" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex gap-1 overflow-x-auto sm:grid sm:grid-cols-3 sm:overflow-visible bg-slate-100 p-1.5 rounded-xl text-sm font-medium w-full flex-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {([
              ['rekam-medis', 'Laporan Rekam Medis'],
              ['kunjungan', 'Laporan Kunjungan'],
              ['transaksi', 'Laporan Transaksi'],
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
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition shrink-0 w-full lg:w-auto"
          >
            <FileDown className="w-4 h-4" />
            Unduh / Cetak Laporan
          </button>
        </div>

        {/* Filter periode — grid full width */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          {tab === 'rekam-medis' && (
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Kategori Laporan *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:border-teal-400">
                {RM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Dari Tanggal *</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Sampai Tanggal *</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400" />
          </div>
          <div className="text-xs text-slate-400 md:col-span-2 xl:col-span-4 text-right">{stats.regs.length} registrasi dalam periode</div>
        </div>

        {/* ======== LAPORAN REKAM MEDIS ======== */}
        {tab === 'rekam-medis' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <FileText className="w-4 h-4 text-teal-500" />
                  <span className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">RME Dibuat</span>
                </div>
                <div className="text-[13px] md:text-2xl font-bold text-slate-900">{Object.keys(state.emr).length}</div>
                <div className="text-xs text-slate-400 mt-1 hidden md:block">{category}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">Registrasi</span>
                </div>
                <div className="text-[13px] md:text-2xl font-bold text-slate-900">{stats.regs.length}</div>
                <div className="text-xs text-slate-400 mt-1 hidden md:block">Periode terpilih</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm col-span-2 md:col-span-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Diagnosa Terbanyak</h3>
                {stats.topDiag.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada data diagnosa pada periode ini.</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.topDiag.map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-600 truncate">{k}</span>
                        <span className="font-bold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Mobile: kartu RME */}
              <div className="md:hidden divide-y divide-slate-100">
                {stats.regs.map((r) => {
                  const emr = state.emr[r.id];
                  return (
                    <div key={r.id} className="px-4 py-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-800 truncate">{r.patientName}</div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${emr ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {emr ? 'Proses' : 'Registrasi'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{fmtDate(r.regDate)} · {r.doctor}</div>
                      <div className="text-[11px] text-slate-500 truncate">Dx: {emr?.diagnosa.map((d) => d.icd10Code).join(', ') || '—'}</div>
                    </div>
                  );
                })}
                {stats.regs.length === 0 && (
                  <p className="px-4 py-10 text-center text-xs text-slate-400">Tidak ada registrasi pada periode ini.</p>
                )}
              </div>
              {/* Desktop: tabel */}
              <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Tgl. Registrasi</th>
                    <th className="px-4 py-3 font-semibold">Pasien</th>
                    <th className="px-4 py-3 font-semibold">Dokter</th>
                    <th className="px-4 py-3 font-semibold">Diagnosa</th>
                    <th className="px-4 py-3 font-semibold">Status EMR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.regs.map((r) => {
                    const emr = state.emr[r.id];
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(r.regDate)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{r.patientName}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{r.doctor}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{emr?.diagnosa.map((d) => d.icd10Code).join(', ') || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${emr ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {emr ? 'Proses' : 'Registrasi'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {stats.regs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">Tidak ada registrasi pada periode ini.</td></tr>
                  )}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {/* ======== LAPORAN KUNJUNGAN ======== */}
        {tab === 'kunjungan' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Activity className="w-4 h-4 text-teal-500" />
                  <span className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">Total Kunjungan</span>
                </div>
                <div className="text-[13px] md:text-2xl font-bold text-slate-900">{stats.regs.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">Pasien Unik</span>
                </div>
                <div className="text-[13px] md:text-2xl font-bold text-slate-900">{new Set(stats.regs.map((r) => r.patientId)).size}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm col-span-2 md:col-span-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kunjungan per Dokter</h3>
                {Object.entries(stats.kunjunganPerDokter).length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada kunjungan.</p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(stats.kunjunganPerDokter).map(([d, c]) => (
                      <div key={d} className="flex justify-between text-xs">
                        <span className="text-slate-600">{d}</span>
                        <span className="font-bold text-slate-800">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Mobile: kartu kunjungan */}
              <div className="md:hidden divide-y divide-slate-100">
                {stats.regs.map((r) => (
                  <div key={r.id} className="px-4 py-3.5 space-y-1">
                    <div className="text-sm font-medium text-slate-800 truncate">{r.patientName}</div>
                    <div className="text-[11px] text-slate-400 truncate">{fmtDate(r.regDate)} · {r.group}</div>
                    <div className="text-[11px] text-slate-500 truncate">{r.room} · {r.doctor}</div>
                  </div>
                ))}
                {stats.regs.length === 0 && (
                  <p className="px-4 py-10 text-center text-xs text-slate-400">Tidak ada kunjungan pada periode ini.</p>
                )}
              </div>
              {/* Desktop: tabel */}
              <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Tgl.</th>
                    <th className="px-4 py-3 font-semibold">Pasien</th>
                    <th className="px-4 py-3 font-semibold">Grup</th>
                    <th className="px-4 py-3 font-semibold">Poli</th>
                    <th className="px-4 py-3 font-semibold">Dokter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.regs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(r.regDate)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.patientName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.group}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.room}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.doctor}</td>
                    </tr>
                  ))}
                  {stats.regs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">Tidak ada kunjungan pada periode ini.</td></tr>
                  )}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {/* ======== LAPORAN TRANSAKSI ======== */}
        {tab === 'transaksi' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">
                    <span className="md:hidden">Pendapatan</span>
                    <span className="hidden md:inline">Pendapatan Periode</span>
                  </span>
                </div>
                <div className="text-[13px] md:text-2xl font-bold text-slate-900 truncate">{fmtRupiah(stats.revenue)}</div>
                <div className="text-[11px] md:text-xs text-emerald-600 mt-0.5 md:mt-1 font-medium truncate">Lunas: {fmtRupiah(stats.lunas)}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Receipt className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">
                    <span className="md:hidden">Apotek</span>
                    <span className="hidden md:inline">Pendapatan Apotek</span>
                  </span>
                </div>
                <div className="text-[13px] md:text-2xl font-bold text-slate-900 truncate">{fmtRupiah(stats.apotek)}</div>
                <div className="text-[11px] md:text-xs text-slate-400 mt-0.5 md:mt-1 truncate">Obat bebas & resep</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-5 shadow-sm col-span-2 md:col-span-1">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Pill className="w-4 h-4 text-teal-500" />
                  <span className="text-[9px] md:text-xs uppercase tracking-wider text-slate-500 font-semibold truncate">Obat Terbanyak</span>
                </div>
                {stats.topMed.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada data.</p>
                ) : (
                  <div className="space-y-1">
                    {stats.topMed.map(([n, c]) => (
                      <div key={n} className="flex justify-between text-xs">
                        <span className="text-slate-600 truncate">{n}</span>
                        <span className="font-bold text-slate-800">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Mobile: kartu transaksi */}
              <div className="md:hidden divide-y divide-slate-100">
                {stats.invoices.map((i) => (
                  <div key={i.id} className="px-4 py-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-slate-800 truncate">{i.patientName}</div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${i.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {i.paymentStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{fmtDate(i.date)}</div>
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-[10px] text-slate-400 truncate">Konsul · Tindakan · Alkes · Obat</span>
                      <span className="font-bold text-slate-800 text-sm shrink-0">{fmtRupiah(i.total)}</span>
                    </div>
                  </div>
                ))}
                {stats.invoices.length === 0 && (
                  <p className="px-4 py-10 text-center text-xs text-slate-400">Tidak ada transaksi pada periode ini.</p>
                )}
              </div>
              {/* Desktop: tabel */}
              <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Pasien</th>
                    <th className="px-4 py-3 font-semibold">Rincian</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.invoices.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(i.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{i.patientName}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        Konsul {fmtRupiah(i.consultationFee)} · Tindakan {fmtRupiah(i.procedureFee)} · Alkes {fmtRupiah(i.alkesFee)} · Obat {fmtRupiah(i.medicineFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtRupiah(i.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${i.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {i.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {stats.invoices.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">Tidak ada transaksi pada periode ini.</td></tr>
                  )}
                </tbody>
              </table></div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
