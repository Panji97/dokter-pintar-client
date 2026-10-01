'use client';

import { useMemo, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtRupiah, fmtDate } from '@/lib/ClinicStore';
import {
  Search, Receipt, Pill, ShieldCheck, Plus, Printer, Banknote, QrCode, CreditCard, Wallet,
} from 'lucide-react';

type Tab = 'pasien' | 'apotek' | 'klaim';

const PAYMENT_METHODS = [
  { label: 'Tunai', icon: Banknote },
  { label: 'QRIS', icon: QrCode },
  { label: 'Debit', icon: CreditCard },
  { label: 'Transfer', icon: Wallet },
  { label: 'BPJS', icon: Receipt },
] as const;

export default function BillingPage() {
  const { state, payInvoice, addApotekInvoice } = useClinicStore();
  const [tab, setTab] = useState<Tab>('pasien');
  const [search, setSearch] = useState('');
  const [paying, setPaying] = useState<string | null>(null);
  const [method, setMethod] = useState<NonNullable<typeof state.invoices[number]['paymentMethod']>>('Tunai');
  const [discount, setDiscount] = useState(0);

  // form obat bebas
  const [showObat, setShowObat] = useState(false);
  const [obatForm, setObatForm] = useState({ patientName: '', type: 'Obat Bebas' as 'Obat Bebas' | 'Obat Resep', items: [{ id: 'med-paracetamol', name: 'Paracetamol 2', qty: 1, price: 7200 }] });

  const payingInv = state.invoices.find((i) => i.id === paying) ?? null;

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return state.invoices.filter((i) => i.patientName.toLowerCase().includes(q));
  }, [state.invoices, search]);

  const claimList = state.claims;
  const totalBelum = state.invoices.filter((i) => i.paymentStatus === 'Belum Dibayar').reduce((s, i) => s + i.total, 0);

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
  const labelCls = 'text-xs font-medium text-slate-600 block mb-1';

  return (
    <>
      <Topbar title="Billing" subtitle="Tagihan pasien, tagihan apotek, dan klaim asuransi" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tagihan Belum Dibayar</span>
            </div>
            <div className="text-2xl font-bold text-rose-600">{fmtRupiah(totalBelum)}</div>
            <div className="text-xs text-slate-400 mt-1">
              {state.invoices.filter((i) => i.paymentStatus === 'Belum Dibayar').length} invoice tertunda
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-teal-500" />
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tagihan Apotek</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{state.apotekInvoices.length}</div>
            <div className="text-xs text-slate-400 mt-1">Obat bebas & resep hari ini</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Klaim Asuransi</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{claimList.length}</div>
            <div className="text-xs text-slate-400 mt-1">
              {fmtRupiah(claimList.reduce((s, c) => s + c.amount, 0))} total nilai klaim
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-full">
          {([
            ['pasien', 'Tagihan Pasien'],
            ['apotek', 'Tagihan Apotek'],
            ['klaim', 'Klaim Asuransi'],
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

        {/* ======== TAGIHAN PASIEN ======== */}
        {tab === 'pasien' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Daftar Tagihan</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari Pasien"
                  className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 w-60"
                />
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Tgl. Masuk</th>
                  <th className="px-4 py-3 font-semibold">Nama Pasien</th>
                  <th className="px-4 py-3 font-semibold">Grup Pasien</th>
                  <th className="px-4 py-3 font-semibold">Dokter</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Status Bayar</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(inv.date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{inv.patientName}</div>
                      <div className="text-[11px] text-slate-400">{inv.group}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{inv.group}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{inv.doctor}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtRupiah(inv.total)}</td>
                    <td className="px-4 py-3">
                      {inv.paymentStatus === 'Lunas' ? (
                        <div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Lunas</span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{inv.paymentMethod} · {inv.paidAt ? fmtDate(inv.paidAt) : ''}</div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Belum Dibayar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {inv.paymentStatus === 'Belum Dibayar' ? (
                        <button
                          onClick={() => { setPaying(inv.id); setMethod('Tunai'); setDiscount(0); }}
                          className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md transition"
                        >
                          Bayar
                        </button>
                      ) : (
                        <button onClick={() => window.print()} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition">
                          <Printer className="w-3 h-3" /> Cetak
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-slate-400">Belum ada tagihan. Tagihan dibuat otomatis saat rekam medis diselesaikan.</td></tr>
                )}
              </tbody>
            </table></div>
          </div>
        )}

        {/* ======== TAGIHAN APOTEK ======== */}
        {tab === 'apotek' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setShowObat(true); setObatForm((f) => ({ ...f, type: 'Obat Bebas' })); }}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Obat Bebas
              </button>
              <button
                onClick={() => { setShowObat(true); setObatForm((f) => ({ ...f, type: 'Obat Resep' })); }}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Obat Resep
              </button>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Jenis</th>
                  <th className="px-4 py-3 font-semibold">Pembeli</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {state.apotekInvoices.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(a.date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{a.type}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.patientName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{a.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtRupiah(a.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {a.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {state.apotekInvoices.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-slate-400">Belum ada tagihan apotek.</td></tr>
                )}
              </tbody>
            </table></div>
          </div>
        )}

        {/* ======== KLAIM ASURANSI ======== */}
        {tab === 'klaim' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Daftar Klaim Pasien</h2>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Nama Pasien</th>
                  <th className="px-4 py-3 font-semibold">Penjamin</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold text-right">Nilai Klaim</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {claimList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{c.patientName}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.penjamin}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(c.date)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtRupiah(c.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.status === 'Dibayar' ? 'bg-emerald-100 text-emerald-700'
                        : c.status === 'Diproses' ? 'bg-blue-100 text-blue-700'
                        : c.status === 'Ditolak' ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {claimList.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-slate-400">
                    Daftar Klaim Pasien Belum Tersedia — tagihan pasien akan muncul setelah data Rekam Medis dilengkapi.
                  </td></tr>
                )}
              </tbody>
            </table></div>
          </div>
        )}
      </main>

      {/* Modal Bayar */}
      {payingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setPaying(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Pembayaran {payingInv.patientName}</h3>
              <button onClick={() => setPaying(null)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Pasien</span><span className="font-medium text-slate-800">{payingInv.patientName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Konsultasi</span><span className="text-slate-800">{fmtRupiah(payingInv.consultationFee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tindakan</span><span className="text-slate-800">{fmtRupiah(payingInv.procedureFee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Alkes</span><span className="text-slate-800">{fmtRupiah(payingInv.alkesFee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Obat</span><span className="text-slate-800">{fmtRupiah(payingInv.medicineFee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Diskon</span><span className="text-rose-600">−{fmtRupiah(discount)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                  <span className="font-semibold text-slate-700">Total Bayar</span>
                  <span className="font-bold text-emerald-600">{fmtRupiah(Math.max(0, payingInv.total - discount))}</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Diskon (Rp)</label>
                <input type="number" value={discount} min={0} max={payingInv.total} onChange={(e) => setDiscount(Math.min(payingInv.total, Math.max(0, Number(e.target.value))))} className={inputCls} />
              </div>

              <div>
                <label className={`${labelCls}`}>Metode Pembayaran</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => setMethod(label)}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition ${
                        method === label ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setPaying(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Batal</button>
              <button
                onClick={() => { payInvoice(payingInv.id, method, discount); setPaying(null); }}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
              >
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Obat Bebas / Resep */}
      {showObat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowObat(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Form {obatForm.type}</h3>
              <button onClick={() => setShowObat(false)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className={labelCls}>Nama Pembeli</label>
                <input value={obatForm.patientName} onChange={(e) => setObatForm({ ...obatForm, patientName: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Obat</label>
                <select
                  onChange={(e) => {
                    const med = state.medicines.find((m) => m.id === e.target.value);
                    if (med) setObatForm({ ...obatForm, items: [{ id: med.id, name: med.name, qty: 1, price: med.price }] });
                  }}
                  className={inputCls}
                >
                  {state.medicines.map((m) => <option key={m.id} value={m.id}>{m.name} — {fmtRupiah(m.price)}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-800">{fmtRupiah(obatForm.items.reduce((s, i) => s + i.qty * i.price, 0))}</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowObat(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Batal</button>
              <button
                onClick={() => {
                  if (!obatForm.patientName) return;
                  addApotekInvoice({
                    date: new Date().toISOString().slice(0, 10),
                    type: obatForm.type,
                    patientName: obatForm.patientName,
                    items: obatForm.items,
                    total: obatForm.items.reduce((s, i) => s + i.qty * i.price, 0),
                    paymentStatus: 'Lunas',
                  });
                  setShowObat(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
