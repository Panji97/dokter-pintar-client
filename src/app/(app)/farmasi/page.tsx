'use client';

import { useMemo, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore, fmtRupiah, fmtDate } from '@/lib/ClinicStore';
import {
  Search, ClipboardCheck, Database, PackagePlus, PackageMinus, Boxes, SlidersHorizontal,
  Undo2, AlertTriangle, CalendarClock, Plus, Check,
} from 'lucide-react';

type Tab = 'kajian' | 'master' | 'penerimaan' | 'pengeluaran' | 'stok' | 'penyesuaian' | 'retur';
type MasterTab = 'supplier' | 'pabrik' | 'merek' | 'barang';
type StokTab = 'kartu' | 'balance' | 'opname';
type ReturTab = 'pengeluaran' | 'penerimaan';

export default function FarmasiPage() {
  const { state, updateMedicineStock, addPenyesuaian } = useClinicStore();
  const [tab, setTab] = useState<Tab>('kajian');
  const [masterTab, setMasterTab] = useState<MasterTab>('supplier');
  const [stokTab, setStokTab] = useState<StokTab>('kartu');
  const [returTab, setReturTab] = useState<ReturTab>('pengeluaran');
  const [search, setSearch] = useState('');
  const [stokSearch, setStokSearch] = useState('');
  const [saved, setSaved] = useState(false);

  // kajian resep: pasien dengan resep yang belum diproses
  const resepList = useMemo(() => {
    const q = search.toLowerCase();
    return state.registrations
      .filter((r) => state.emr[r.id] && state.emr[r.id].resepApotek.length > 0)
      .filter((r) => r.patientName.toLowerCase().includes(q))
      .map((r) => ({
        reg: r,
        emr: state.emr[r.id],
        items: state.emr[r.id].resepApotek.flatMap((rp) => rp.items),
      }));
  }, [state.emr, state.registrations, search]);

  const prosesResep = () => {
    // kurangi stok obat sesuai resep yang diproses
    resepList.forEach(({ items }) => {
      items.forEach((it) => {
        const med = state.medicines.find((m) => m.name === it.name);
        if (med) updateMedicineStock(med.id, -it.qty);
      });
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lowStock = state.medicines.filter((m) => m.stock <= m.minStock);
  const nearExpiry = state.medicines.filter(
    (m) => (new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 90
  );

  const filteredMeds = state.medicines.filter(
    (m) => m.name.toLowerCase().includes(stokSearch.toLowerCase()) || m.code.toLowerCase().includes(stokSearch.toLowerCase())
  );

  const tabMeta: { key: Tab; label: string; icon: typeof ClipboardCheck }[] = [
    { key: 'kajian', label: 'Kajian Resep', icon: ClipboardCheck },
    { key: 'master', label: 'Data Master', icon: Database },
    { key: 'penerimaan', label: 'Penerimaan', icon: PackagePlus },
    { key: 'pengeluaran', label: 'Pengeluaran', icon: PackageMinus },
    { key: 'stok', label: 'Stok', icon: Boxes },
    { key: 'penyesuaian', label: 'Penyesuaian', icon: SlidersHorizontal },
    { key: 'retur', label: 'Retur', icon: Undo2 },
  ];

  return (
    <>
      <Topbar title="Farmasi" subtitle="Kajian resep, master obat, mutasi stok, dan persediaan apotek" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Tab utama */}
        <div className="flex gap-2 overflow-x-auto lg:grid lg:grid-cols-7 lg:overflow-visible w-full pb-1 lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabMeta.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition border text-center shrink-0 whitespace-nowrap lg:whitespace-normal lg:w-full ${
                tab === key
                  ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/25 font-semibold'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* ==================== KAJIAN RESEP ==================== */}
        {tab === 'kajian' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-800 text-sm">Daftar Nama Pasien</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama pasien"
                  className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 w-56"
                />
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Tgl. dan Waktu</th>
                  <th className="px-4 py-3 font-semibold">Nama Pasien</th>
                  <th className="px-4 py-3 font-semibold">Dokter Pemeriksa</th>
                  <th className="px-4 py-3 font-semibold">Item Resep</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {resepList.map(({ reg, items }) => {
                  const { date, time } = { date: fmtDate(reg.regDate), time: new Date(reg.regDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-600">{date} · {time}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{reg.patientName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{reg.doctor}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                        {items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Belum Selesai</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={prosesResep} className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-md transition">
                          Proses
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {resepList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">
                      Tidak ada resep menunggu kajian. Resep masuk otomatis setelah dokter menyimpan resep di RME.
                    </td>
                  </tr>
                )}
              </tbody>
            </table></div>
            {saved && (
              <div className="mx-5 my-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                <Check className="w-3.5 h-3.5" /> Resep diproses — stok obat telah dikurangi.
              </div>
            )}
          </div>
        )}

        {/* ==================== DATA MASTER ==================== */}
        {tab === 'master' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
              {([
                ['supplier', 'Supplier Farmasi'],
                ['pabrik', 'Pabrik Farmasi'],
                ['merek', 'Merek Barang Farmasi'],
                ['barang', 'Barang Farmasi'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMasterTab(key)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition border w-full text-center ${
                    masterTab === key ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/25 font-semibold' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {masterTab === 'supplier' && (
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Kode Supplier</th>
                      <th className="px-4 py-3 font-semibold">Nama Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {state.suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.code}</td>
                        <td className="px-4 py-3 text-slate-700">{s.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
              {masterTab === 'pabrik' && (
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Kode Pabrik</th>
                      <th className="px-4 py-3 font-semibold">Nama Pabrik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {state.factories.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{f.code}</td>
                        <td className="px-4 py-3 text-slate-700">{f.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
              {masterTab === 'merek' && (
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Kode Merek</th>
                      <th className="px-4 py-3 font-semibold">Nama Merek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {state.brands.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.code}</td>
                        <td className="px-4 py-3 text-slate-700">{b.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
              {masterTab === 'barang' && (
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Kode</th>
                      <th className="px-4 py-3 font-semibold">Nama Barang</th>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 font-semibold">Satuan</th>
                      <th className="px-4 py-3 font-semibold text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {state.medicines.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.code}</td>
                        <td className="px-4 py-3 text-slate-700">{m.name}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{m.category}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{m.unit}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{fmtRupiah(m.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
            </div>
          </div>
        )}

        {/* ==================== PENERIMAAN ==================== */}
        {tab === 'penerimaan' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-800 text-sm">Cari Penerimaan Barang Farmasi</h2>
              <button className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" /> Form Penerimaan Barang
              </button>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Tgl. Penerimaan</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">No. Faktur</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {state.penerimaan.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(p.date)}</td>
                    <td className="px-4 py-3 text-slate-700">{p.supplier}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.faktur}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {/* ==================== PENGELUARAN ==================== */}
        {tab === 'pengeluaran' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm">Cari Pengeluaran Barang Farmasi</h2>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Poli</th>
                  <th className="px-4 py-3 font-semibold">Kode Barang</th>
                  <th className="px-4 py-3 font-semibold">Nama Barang</th>
                  <th className="px-4 py-3 font-semibold">Satuan</th>
                  <th className="px-4 py-3 font-semibold text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {state.pengeluaran.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(p.date)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.room}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.code}</td>
                    <td className="px-4 py-3 text-slate-700">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {/* ==================== STOK ==================== */}
        {tab === 'stok' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 w-full items-center">
              <div className="grid grid-cols-3 gap-2 w-full">
              {([
                ['kartu', 'Kartu Stok'],
                ['balance', 'Stok Balance'],
                ['opname', 'Stok Opname'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStokTab(key)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition border w-full text-center ${
                    stokTab === key ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/25 font-semibold' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
              </div>
              <div className="relative w-full lg:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={stokSearch}
                  onChange={(e) => setStokSearch(e.target.value)}
                  placeholder="Cari nama barang"
                  className="pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-teal-400 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Boxes className="w-4 h-4 text-teal-500" />
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Item</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{state.medicines.length}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Nilai persediaan: {fmtRupiah(state.medicines.reduce((s, m) => s + m.stock * m.price, 0))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Stok Menipis</span>
                </div>
                <div className="text-2xl font-bold text-rose-600">{lowStock.length}</div>
                <div className="text-xs text-slate-400 mt-1">Di bawah batas minimum</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Kadaluarsa ≤ 90 Hari</span>
                </div>
                <div className="text-2xl font-bold text-amber-600">{nearExpiry.length}</div>
                <div className="text-xs text-slate-400 mt-1">Segera rotasi / retur ke supplier</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Kode</th>
                    <th className="px-4 py-3 font-semibold">Nama Barang</th>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Kadaluarsa</th>
                    <th className="px-4 py-3 font-semibold text-right">Stok</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMeds.map((m) => {
                    const daysLeft = Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.batchNumber}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(m.expiryDate)} ({daysLeft} hari)</td>
                        <td className={`px-4 py-3 text-right font-bold ${m.stock <= m.minStock ? 'text-rose-600' : 'text-slate-800'}`}>
                          {m.stock} <span className="text-[10px] font-normal text-slate-400">/ min {m.minStock}</span>
                        </td>
                        <td className="px-4 py-3">
                          {m.stock <= m.minStock ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Menipis</span>
                          ) : daysLeft <= 90 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Kadaluarsa Dekat</span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Aman</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => updateMedicineStock(m.id, -1)} className="px-2 py-1 rounded-md hover:bg-slate-200 text-slate-600 text-xs font-bold">−</button>
                          <button onClick={() => updateMedicineStock(m.id, 1)} className="px-2 py-1 rounded-md hover:bg-slate-200 text-slate-600 text-xs font-bold">+</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
              {stokTab !== 'kartu' && (
                <div className="px-5 py-4 text-xs text-slate-400 border-t border-slate-100">
                  {stokTab === 'balance' ? 'Stok Balance: perbandingan stok sistem vs fisik per lokasi (demo).' : 'Stok Opname: penghitungan fisik berkala (demo).'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== PENYESUAIAN ==================== */}
        {tab === 'penyesuaian' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-800 text-sm">Cari Penyesuaian Barang Farmasi</h2>
              <button
                onClick={() => {
                  const med = state.medicines[0];
                  if (!med) return;
                  addPenyesuaian({
                    nota: `OPN-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
                    date: new Date().toISOString().slice(0, 10),
                    pic: 'Apoteker',
                    items: [{ id: med.id, code: med.code, name: med.name, stockBefore: med.stock, stockAfter: med.stock, reason: 'Opname rutin' }],
                  });
                }}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Form Penyesuaian
              </button>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Nota Penyesuaian</th>
                  <th className="px-4 py-3 font-semibold">Tgl. Penyesuaian</th>
                  <th className="px-4 py-3 font-semibold">Penanggung Jawab</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {state.penyesuaian.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{a.nota}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(a.date)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{a.pic}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {a.items.map((i) => `${i.name}: ${i.stockBefore} → ${i.stockAfter} (${i.reason})`).join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {/* ==================== RETUR ==================== */}
        {tab === 'retur' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 w-full">
              {([
                ['pengeluaran', 'Retur Pengeluaran'],
                ['penerimaan', 'Retur Penerimaan'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setReturTab(key)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition border w-full text-center ${
                    returTab === key ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/25 font-semibold' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.retur
                    .filter((r) => r.type === (returTab === 'pengeluaran' ? 'Retur Pengeluaran' : 'Retur Penerimaan'))
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(r.date)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.items.map((i) => `${i.name} ×${i.qty} (${i.reason})`).join(', ')}</td>
                      </tr>
                    ))}
                  {state.retur.filter((r) => r.type === (returTab === 'pengeluaran' ? 'Retur Pengeluaran' : 'Retur Penerimaan')).length === 0 && (
                    <tr><td colSpan={2} className="px-4 py-10 text-center text-xs text-slate-400">Belum ada retur pada kategori ini.</td></tr>
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
