'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtRupiah, fmtDate } from '@/lib/ClinicStore';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import {
  Search, Receipt, Pill, ShieldCheck, Plus, Printer, Banknote, QrCode, CreditCard, Wallet,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

type Tab = 'pasien' | 'apotek' | 'klaim';

/** Ukuran halaman daftar billing (berlaku untuk ketiga tab). */
const PAGE_SIZE = 10;

const PAYMENT_METHODS = [
  { label: 'Tunai', icon: Banknote },
  { label: 'QRIS', icon: QrCode },
  { label: 'Debit', icon: CreditCard },
  { label: 'Transfer', icon: Wallet },
  { label: 'BPJS', icon: Receipt },
] as const;

/** Nomor halaman dengan elipsis (1 … 4 5 6 … 12) agar tetap ringkas bila data banyak. */
function pageNumbers(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const keep = [...new Set(
    [1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages),
  )].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  keep.forEach((n, i) => {
    if (i > 0 && n - keep[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

/**
 * Footer pagination ramah dokter: tombol besar (min. 40px, mudah disentuh),
 * nomor halaman yang bisa dilompat langsung, dan label bahasa sehari-hari.
 * Tampil hanya bila lebih dari 1 halaman.
 */
function BillingPager({ safePage, totalPages, total, unit, onPage }: {
  safePage: number;
  totalPages: number;
  total: number;
  /** Satuan untuk label, mis. "tagihan" / "klaim". */
  unit: string;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const start = (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);
  const navBtn =
    'flex items-center justify-center gap-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:border-teal-400 hover:text-teal-700 active:bg-teal-50 disabled:opacity-40 disabled:pointer-events-none';
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 md:px-5 py-3 border-t border-slate-100 sm:flex-row sm:justify-between">
      <nav aria-label="Navigasi halaman" className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          onClick={() => onPage(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          aria-label="Ke halaman sebelumnya"
          className={navBtn}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden min-[420px]:inline">Sebelumnya</span>
        </button>
        {pageNumbers(safePage, totalPages).map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} aria-hidden className="w-8 text-center text-slate-400">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              aria-label={`Ke halaman ${n}`}
              aria-current={n === safePage ? 'page' : undefined}
              className={`min-w-10 h-10 px-2 rounded-xl text-sm font-bold transition ${
                n === safePage
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700'
              }`}
            >
              {n}
            </button>
          ),
        )}
        <button
          onClick={() => onPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          aria-label="Ke halaman berikutnya"
          className={navBtn}
        >
          <span className="hidden min-[420px]:inline">Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
      <p className="text-xs text-slate-500 order-2 sm:order-1">
        Menampilkan <span className="font-bold text-slate-700">{start}–{end}</span> dari{' '}
        <span className="font-bold text-slate-700">{total}</span> {unit}
      </p>
    </div>
  );
}

export default function BillingPage() {
  const { state, payInvoice, addApotekInvoice, ensureModule } = useClinicStore();
  const { mutate: mutateGlobal } = useSWRConfig();
  const [tab, setTab] = useState<Tab>('pasien');

  useEffect(() => {
    ensureModule('billing');
  }, [ensureModule]);
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

  // Pagination — 1 state dipakai ketiga tab; direset langsung di
  // event handler (ganti tab / ketik pencarian), tanpa effect.
  const [page, setPage] = useState(1);
  const goTab = (t: Tab) => {
    setTab(t);
    setPage(1);
  };
  const paginate = <T,>(list: T[]) => {
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    return {
      items: list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
      totalPages,
      safePage,
      total: list.length,
    };
  };
  const pagedInvoices = paginate(filteredInvoices);
  const pagedApotek = paginate(state.apotekInvoices);
  const pagedKlaim = paginate(claimList);

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
  const labelCls = 'text-xs font-medium text-slate-600 block mb-1';

  return (
    <>
      <Topbar title="Billing" subtitle="Tagihan pasien, tagihan apotek, dan klaim asuransi" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Ringkasan */}
        {/* Mobile: 3 ubin mini sejajar */}
        <div className="md:hidden grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <Receipt className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold truncate">
                Tagihan · {state.invoices.filter((i) => i.paymentStatus === 'Belum Dibayar').length}
              </span>
            </div>
            <div className="mt-1 text-[13px] font-bold text-rose-600 truncate">{fmtRupiah(totalBelum)}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <Pill className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold truncate">Apotek</span>
            </div>
            <div className="mt-1 text-[13px] font-bold text-slate-900 truncate">{state.apotekInvoices.length} tagihan</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold truncate">
                Klaim · {claimList.length}
              </span>
            </div>
            <div className="mt-1 text-[13px] font-bold text-slate-900 truncate">{fmtRupiah(claimList.reduce((s, c) => s + c.amount, 0))}</div>
          </div>
        </div>
        {/* Desktop: 3 kartu */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
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
              onClick={() => goTab(key)}
              className={`px-1 sm:px-4 py-2.5 rounded-lg transition text-center w-full ${tab === key ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ======== TAGIHAN PASIEN ======== */}
        {tab === 'pasien' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Daftar Tagihan</h2>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Cari Pasien"
                  className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 w-full sm:w-60"
                />
              </div>
            </div>
            {/* Mobile: kartu tagihan */}
            <div className="md:hidden divide-y divide-slate-100">
              {pagedInvoices.items.map((inv) => (
                <div key={inv.id} className="px-4 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-800 text-sm truncate">{inv.patientName}</div>
                    {inv.paymentStatus === 'Lunas' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">Lunas</span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">Belum Dibayar</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {fmtDate(inv.date)} · {inv.group} · {inv.doctor}
                  </div>
                  {inv.paymentStatus === 'Lunas' && inv.paymentMethod && (
                    <div className="text-[10px] text-slate-400">{inv.paymentMethod}{inv.paidAt ? ` · ${fmtDate(inv.paidAt)}` : ''}</div>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="font-bold text-slate-800">{fmtRupiah(inv.total)}</span>
                    {inv.paymentStatus === 'Belum Dibayar' ? (
                      <button
                        onClick={() => { setPaying(inv.id); setMethod('Tunai'); setDiscount(0); }}
                        className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-3.5 py-2 rounded-lg transition shrink-0"
                      >
                        Bayar
                      </button>
                    ) : (
                      <button onClick={() => window.print()} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-lg transition shrink-0">
                        <Printer className="w-3 h-3" /> Cetak
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredInvoices.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-slate-400">Belum ada tagihan. Tagihan dibuat otomatis saat rekam medis diselesaikan.</p>
              )}
            </div>
            {/* Desktop: tabel */}
            <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
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
                {pagedInvoices.items.map((inv) => (
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
            <BillingPager safePage={pagedInvoices.safePage} totalPages={pagedInvoices.totalPages} total={pagedInvoices.total} unit="tagihan" onPage={setPage} />
          </div>
        )}

        {/* ======== TAGIHAN APOTEK ======== */}
        {tab === 'apotek' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
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
            {/* Mobile: kartu apotek */}
            <div className="md:hidden divide-y divide-slate-100">
              {pagedApotek.items.map((a) => (
                <div key={a.id} className="px-4 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-800 truncate">{a.patientName}</div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${a.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {a.paymentStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {fmtDate(a.date)} · <span className="text-teal-700 font-medium">{a.type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] text-slate-500 truncate">{a.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</span>
                    <span className="font-bold text-slate-800 text-sm shrink-0">{fmtRupiah(a.total)}</span>
                  </div>
                </div>
              ))}
              {state.apotekInvoices.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-slate-400">Belum ada tagihan apotek.</p>
              )}
            </div>
            {/* Desktop: tabel */}
            <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
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
                {pagedApotek.items.map((a) => (
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
            <BillingPager safePage={pagedApotek.safePage} totalPages={pagedApotek.totalPages} total={pagedApotek.total} unit="tagihan apotek" onPage={setPage} />
          </div>
        )}

        {/* ======== KLAIM ASURANSI ======== */}
        {tab === 'klaim' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Daftar Klaim Pasien</h2>
            </div>
            {/* Mobile: kartu klaim */}
            <div className="md:hidden divide-y divide-slate-100">
              {pagedKlaim.items.map((c) => (
                <div key={c.id} className="px-4 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-800 truncate">{c.patientName}</div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      c.status === 'Dibayar' ? 'bg-emerald-100 text-emerald-700'
                      : c.status === 'Diproses' ? 'bg-blue-100 text-blue-700'
                      : c.status === 'Ditolak' ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{c.penjamin} · {fmtDate(c.date)}</div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] text-slate-400">Nilai klaim</span>
                    <span className="font-bold text-slate-800">{fmtRupiah(c.amount)}</span>
                  </div>
                </div>
              ))}
              {claimList.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-slate-400">
                  Daftar Klaim Pasien Belum Tersedia — tagihan pasien akan muncul setelah data Rekam Medis dilengkapi.
                </p>
              )}
            </div>
            {/* Desktop: tabel */}
            <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
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
                {pagedKlaim.items.map((c) => (
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
            <BillingPager safePage={pagedKlaim.safePage} totalPages={pagedKlaim.totalPages} total={pagedKlaim.total} unit="klaim" onPage={setPage} />
          </div>
        )}
      </main>

      {/* Modal Bayar */}
      {payingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setPaying(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto" onClick={(e) => e.stopPropagation()}>
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
                onClick={async () => {
                  await payInvoice(payingInv.id, method, discount);
                  mutateGlobal((key) => typeof key === 'string' && (key.includes(STRAPI_ENDPOINTS.invoices) || key.includes(STRAPI_ENDPOINTS.registrations)));
                  setPaying(null);
                }}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto" onClick={(e) => e.stopPropagation()}>
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
                  // Hubungkan ke pasien terdaftar bila namanya cocok (obat bebas bisa tanpa relasi).
                  const matched = state.patients.find(
                    (p) => p.name.toUpperCase() === obatForm.patientName.trim().toUpperCase()
                  );
                  addApotekInvoice({
                    date: new Date().toISOString().slice(0, 10),
                    type: obatForm.type,
                    patientName: obatForm.patientName,
                    ...(matched ? { patientId: matched.id } : {}),
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
