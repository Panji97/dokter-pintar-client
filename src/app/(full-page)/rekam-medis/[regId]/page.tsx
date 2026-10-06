'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Odontogram } from '@/components/rme/Odontogram';
import { useClinicStore, fmtRupiah, fmtDate, fmtDateTime } from '@/lib/ClinicStore';
import { ICD10_LIST, ICD9_LIST } from '@/lib/icd';
import {
  EmrDocument, DiagnosaItem, TindakanItem, AlkesItem, CpptEntry, KondisiGigi,
} from '@/types/clinic';
import {
  Plus, Trash2, FileText, Upload, FileCheck, FileSignature, ShieldCheck, ClipboardCheck,
  StickyNote,
} from 'lucide-react';

type MainTab = 'riwayat' | 'so' | 'ap' | 'p' | 'cppt';
type SoTab = 'anamnesa-umum' | 'anamnesa-odonto' | 'pemeriksaan' | 'foto';
type ApTab = 'dokumen' | 'kondisi' | 'diagnosa' | 'tindakan' | 'alkes';
type PTab = 'apotek' | 'rujukan';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
const labelCls = 'text-xs font-medium text-slate-600 block mb-1';

export default function EmrDetailPage() {
  const params = useParams<{ regId: string }>();
  const regId = params.regId;
  const { state, loading, getOrCreateEmr, updateEmr, addInvoice } = useClinicStore();

  const reg = state.registrations.find((r) => r.id === regId);
  const patient = state.patients.find((p) => p.id === reg?.patientId);
  const doc = getOrCreateEmr(regId);

  const [mainTab, setMainTab] = useState<MainTab>('riwayat');
  const [soTab, setSoTab] = useState<SoTab>('anamnesa-umum');
  const [apTab, setApTab] = useState<ApTab>('dokumen');
  const [pTab, setPTab] = useState<PTab>('apotek');
  const [draft, setDraft] = useState<EmrDocument>(doc);
  // Sinkronkan draft saat data tiba (store memuat async).
  const [draftFor, setDraftFor] = useState<string | null>(null);
  if (!loading && reg && draftFor !== regId) {
    setDraft(doc);
    setDraftFor(regId);
  }

  // form state untuk tambah entitas
  const [newKondisi, setNewKondisi] = useState<KondisiGigi>({ id: '', toothNumber: null, deskripsi: '' });
  const [newDiag, setNewDiag] = useState<DiagnosaItem>({ id: '', type: 'Diagnosa dokter', icd10Code: '', icd10Desc: '' });
  const [newTindakan, setNewTindakan] = useState<TindakanItem>({ id: '', code: 'PK0053', name: 'JPKM', tooth: '-', qty: 1, price: 350000, discount: 0 });
  const [newAlkes, setNewAlkes] = useState<AlkesItem>({ id: '', code: 'BHP5', name: 'ALKES 5', qty: 1, price: 95000 });
  const [newCppt, setNewCppt] = useState<CpptEntry>({ id: '', datetime: new Date().toISOString().slice(0, 16), ppa: reg?.doctor ?? '', profesi: 'Dokter Gigi', subjektif: '', objektif: '', asesmen: '', plan: '' });

  const totals = useMemo(() => {
    const tindakan = draft.tindakan.reduce((s, t) => s + t.qty * t.price - t.discount, 0);
    const alkes = draft.alkes.reduce((s, a) => s + a.qty * a.price, 0);
    const obat = draft.resepApotek.reduce((s, r) => s + r.items.reduce((x, i) => x + i.qty * i.price, 0), 0);
    const diskon = draft.tindakan.reduce((s, t) => s + t.discount, 0);
    return { tindakan, alkes, obat, diskon, total: tindakan + alkes + obat };
  }, [draft]);

  const selesai = () => {
    void updateEmr(regId, draft);
    void addInvoice({
      visitId: regId,
      patientId: reg?.patientId ?? '',
      patientName: reg?.patientName ?? '',
      date: new Date().toISOString().slice(0, 10),
      group: reg?.group ?? 'Umum',
      doctor: reg?.doctor ?? '',
      consultationFee: 100000,
      procedureFee: totals.tindakan,
      alkesFee: totals.alkes,
      medicineFee: totals.obat,
      discount: 0,
      total: totals.total + 100000,
      paymentStatus: 'Belum Dibayar',
    });
    setMainTab('riwayat');
  };

  if (loading || !reg) {
    return (
      <>
        <Topbar title="Rekam Medis" showBrand />
        <main className="flex-1 p-4 md:p-6">
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            {loading ? 'Memuat data…' : (
              <>Registrasi tidak ditemukan.{' '}
              <Link href="/rekam-medis" className="text-teal-600 font-medium">Kembali ke daftar</Link></>
            )}
          </div>
        </main>
      </>
    );
  }

  const regDate = fmtDateTime(reg.regDate);

  const subTabCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-xs font-medium transition border shrink-0 whitespace-nowrap ${
      active ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`;

  return (
    <>
      {/* Topbar yang sama dengan halaman lain + brand (pengganti brand di leftbar). */}
      <Topbar title="Rekam Medis" subtitle={`${reg.patientName} · ${reg.group}`} showBrand />

      {/* Header pasien */}
      <div className="px-4 md:px-6 pt-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            {[
              ['Nama Pasien', reg.patientName],
              ['Tgl. Registrasi', regDate.date],
              ['Dokter', reg.doctor],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 md:block">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">{label}</div>
                <div className="text-sm font-semibold text-slate-800 md:mt-0.5 truncate text-right md:text-left">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab utama */}
      <div className="px-4 md:px-6 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            ['riwayat', 'Rekam Medis'],
            ['so', 'Catatan FasKes (SO)'],
            ['ap', 'Diagnosa & Tindakan (AP)'],
            ['p', 'Resep (P)'],
            ['cppt', 'CPPT'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border shrink-0 whitespace-nowrap ${
                mainTab === key
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto hidden md:flex gap-2 shrink-0 pl-2">
            <button onClick={selesai} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white transition">
              <FileCheck className="w-4 h-4" />
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Aksi Selesai mengambang — hanya mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
        <button onClick={selesai} className="pointer-events-auto w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xl transition">
          <FileCheck className="w-4 h-4" />
          Selesai
        </button>
      </div>

      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 space-y-5">
        {/* ============ TAB RIWAYAT ============ */}
        {mainTab === 'riwayat' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Riwayat Medis Pasien</h2>
            </div>
            <div className="p-4 md:p-5">
              {/* Mobile: kartu riwayat */}
              <div className="md:hidden space-y-3">
                {state.registrations
                  .filter((r) => r.patientId === reg.patientId && state.emr[r.id])
                  .map((r) => {
                    const emr = state.emr[r.id];
                    return (
                      <div key={r.id} className="rounded-xl border border-slate-200 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800">{fmtDate(r.regDate)}</span>
                          <Link
                            href={`/rekam-medis/${r.id}`}
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md transition"
                          >
                            <FileText className="w-3 h-3" /> Buka
                          </Link>
                        </div>
                        <div className="mt-1.5 text-sm font-medium text-slate-800">{r.serviceType}</div>
                        <div className="text-[11px] text-slate-500">{emr.diagnosa[0]?.icd10Desc ?? '—'}</div>
                        <div className="text-[11px] text-slate-400">{r.doctor}</div>
                      </div>
                    );
                  })}
                <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800">{regDate.date}</span>
                    <span className="text-[11px] text-teal-600 font-semibold">Sesi ini</span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-slate-800">{reg.serviceType}</div>
                  <div className="text-[11px] text-slate-500">{draft.diagnosa[0]?.icd10Desc ?? '—'}</div>
                  <div className="text-[11px] text-slate-400">{reg.doctor}</div>
                </div>
              </div>
              {/* Desktop: tabel */}
              <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Tgl. Periksa</th>
                    <th className="px-4 py-3 font-semibold">Jenis Pelayanan</th>
                    <th className="px-4 py-3 font-semibold">Diagnosis Utama</th>
                    <th className="px-4 py-3 font-semibold">Dokter Pemeriksa</th>
                    <th className="px-4 py-3 font-semibold text-right">Berkas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.registrations
                    .filter((r) => r.patientId === reg.patientId && state.emr[r.id])
                    .map((r) => {
                      const emr = state.emr[r.id];
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(r.regDate)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{r.serviceType}</td>
                          <td className="px-4 py-3 text-xs text-slate-700">{emr.diagnosa[0]?.icd10Desc ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{r.doctor}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/rekam-medis/${r.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md transition"
                            >
                              <FileText className="w-3 h-3" /> Buka
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  <tr>
                    <td className="px-4 py-3 text-xs text-slate-600">{regDate.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{reg.serviceType}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{draft.diagnosa[0]?.icd10Desc ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{reg.doctor}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[11px] text-teal-600 font-semibold">Sesi ini</span>
                    </td>
                  </tr>
                </tbody>
              </table></div>
              {state.registrations.filter((r) => r.patientId === reg.patientId && state.emr[r.id]).length === 0 && (
                <p className="text-xs text-slate-400 mt-3">*Riwayat lengkap tersedia setelah rekam medis disimpan minimal satu kali.</p>
              )}
            </div>
          </div>
        )}

        {/* ============ TAB SO ============ */}
        {mainTab === 'so' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                ['anamnesa-umum', 'Subjektif — Anamnesa Umum'],
                ['anamnesa-odonto', 'Subjektif — Anamnesa Odontogram'],
                ['pemeriksaan', 'Objektif — Pemeriksaan Umum'],
                ['foto', 'Unggah Foto'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setSoTab(key)} className={subTabCls(soTab === key)}>{label}</button>
              ))}
            </div>

            {soTab === 'anamnesa-umum' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['riwayatPenyakit', 'Riwayat Penyakit'],
                  ['keluhanUtama', 'Keluhan Utama'],
                  ['keluhanTambahan', 'Keluhan Tambahan'],
                  ['penyakitSaatIni', 'Penyakit Saat Ini'],
                  ['gravida', 'Gravida'],
                ] as const).map(([key, label]) => (
                  <div key={key} className={key === 'gravida' ? '' : 'md:col-span-2'}>
                    <label className={labelCls}>{label}</label>
                    {key === 'gravida' ? (
                      <input value={draft.anamnesaUmum.gravida} onChange={(e) => setDraft({ ...draft, anamnesaUmum: { ...draft.anamnesaUmum, gravida: e.target.value } })} className={inputCls} />
                    ) : (
                      <textarea rows={2} value={draft.anamnesaUmum[key]} onChange={(e) => setDraft({ ...draft, anamnesaUmum: { ...draft.anamnesaUmum, [key]: e.target.value } })} className={inputCls} />
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className={labelCls}>Alergi</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(['gatal', 'debu', 'obat', 'makanan', 'lainnya', 'udara'] as const).map((a) => (
                      <div key={a} className="flex items-center gap-2">
                        <label className="text-xs text-slate-600 capitalize w-16">{a}</label>
                        <input
                          value={draft.anamnesaUmum.alergi[a]}
                          onChange={(e) => setDraft({ ...draft, anamnesaUmum: { ...draft.anamnesaUmum, alergi: { ...draft.anamnesaUmum.alergi, [a]: e.target.value } } })}
                          placeholder="-"
                          className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {soTab === 'anamnesa-odonto' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['occlusi', 'Occlusi'],
                  ['torusPlatinus', 'Torus Platinus'],
                  ['torusMandibularis', 'Torus Mandibularis'],
                  ['palatum', 'Palatum'],
                  ['diastema', 'Diastema'],
                  ['gigiAnomali', 'Gigi Anomali'],
                  ['lainLain', 'Lain-lain'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input value={draft.anamnesaOdontogram[key]} onChange={(e) => setDraft({ ...draft, anamnesaOdontogram: { ...draft.anamnesaOdontogram, [key]: e.target.value } })} className={inputCls} />
                  </div>
                ))}
              </div>
            )}

            {soTab === 'pemeriksaan' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
                <div>
                  <label className={labelCls}>Deskripsi Pemeriksaan</label>
                  <textarea rows={2} value={draft.pemeriksaanUmum.deskripsi} onChange={(e) => setDraft({ ...draft, pemeriksaanUmum: { ...draft.pemeriksaanUmum, deskripsi: e.target.value } })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    ['nadi', 'Nadi', 'menit'],
                    ['tensiSistolik', 'Tensi (Sistole)', 'mmHg'],
                    ['tensiDiastolik', 'Tensi (Diastole)', 'mmHg'],
                    ['suhu', 'Suhu', '°C'],
                    ['beratBadan', 'Berat Badan', 'kg'],
                    ['tinggiBadan', 'Tinggi Badan', 'cm'],
                    ['pernapasan', 'Pernapasan', 'menit'],
                  ] as const).map(([key, label, unit]) => (
                    <div key={key}>
                      <label className={labelCls}>{label} ({unit})</label>
                      <input value={draft.pemeriksaanUmum[key]} onChange={(e) => setDraft({ ...draft, pemeriksaanUmum: { ...draft.pemeriksaanUmum, [key]: e.target.value } })} className={inputCls} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['mata', 'gigiMulut', 'kulit'] as const).map((key) => (
                    <div key={key}>
                      <label className={labelCls}>{key === 'mata' ? 'Mata' : key === 'gigiMulut' ? 'Gigi & Mulut' : 'Kulit'}</label>
                      <input value={draft.pemeriksaanUmum[key]} onChange={(e) => setDraft({ ...draft, pemeriksaanUmum: { ...draft.pemeriksaanUmum, [key]: e.target.value } })} className={inputCls} />
                    </div>
                  ))}
                </div>
                <button type="button" className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition">
                  <Plus className="w-3.5 h-3.5" /> Tambah Pemeriksaan Swab
                </button>
              </div>
            )}

            {soTab === 'foto' && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Upload className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">Unggah Foto Sebelum / Sesudah (Before–After)</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Dokumentasikan kondisi pasien sebelum dan sesudah tindakan (fitur Preview Before-After Dokter Pintar).
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, photoCount: draft.photoCount + 1 })}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Foto
                  </button>
                  <span className="text-xs text-slate-500">{draft.photoCount} foto terunggah</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ TAB AP ============ */}
        {mainTab === 'ap' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                ['dokumen', 'Dokumen Medis'],
                ['kondisi', 'Kondisi'],
                ['diagnosa', 'Asesmen — Diagnosa'],
                ['tindakan', 'Plan — Tindakan'],
                ['alkes', 'Plan — Pemakaian Alkes'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setApTab(key)} className={subTabCls(apTab === key)}>{label}</button>
              ))}
            </div>

            {apTab === 'dokumen' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-3">
                <p className="text-xs text-slate-500 mb-2">Centang dokumen medis yang sudah dilengkapi (sesuai alur dokumen Dokter Pintar):</p>
                {([
                  ['generalConsent', 'Anamnesa — General Consent', FileSignature],
                  ['asesmenAwal', 'Anamnesa — Asesmen Awal', ClipboardCheck],
                  ['informedConsent', 'Treatment — Informed Consent', FileSignature],
                  ['asesmenPraTindakan', 'Treatment — Asesmen Pra Tindakan', ClipboardCheck],
                  ['surgicalSafety', 'Treatment — Surgical Safety', ShieldCheck],
                ] as const).map(([key, label, Icon]) => (
                  <label key={key} className="flex items-center gap-3 border border-slate-100 rounded-lg px-4 py-3 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={draft.dokumen[key]}
                      onChange={(e) => setDraft({ ...draft, dokumen: { ...draft.dokumen, [key]: e.target.checked } })}
                      className="w-4 h-4 accent-teal-600"
                    />
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 flex-1">{label}</span>
                    {draft.dokumen[key] && <span className="text-xs text-emerald-600 font-semibold">Selesai</span>}
                  </label>
                ))}
              </div>
            )}

            {apTab === 'kondisi' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
                <h2 className="font-bold text-slate-800 text-sm">Data Kondisi — Odontogram</h2>
                {/* Mobile: daftar kondisi */}
                <div className="md:hidden space-y-2">
                  {draft.kondisi.map((k) => (
                    <div key={k.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {k.toothNumber ?? '-'}
                      </span>
                      <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{k.deskripsi || '-'}</span>
                      <button
                        onClick={() => setDraft({ ...draft, kondisi: draft.kondisi.filter((x) => x.id !== k.id) })}
                        aria-label="Hapus kondisi"
                        className="text-rose-500 hover:text-rose-700 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {draft.kondisi.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Belum ada data kondisi.</p>
                  )}
                </div>
                {/* Desktop: tabel */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">No</th>
                      <th className="px-4 py-2.5 font-semibold">Deskripsi</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {draft.kondisi.map((k) => (
                      <tr key={k.id}>
                        <td className="px-4 py-2.5 text-slate-700 font-mono text-xs">{k.toothNumber ?? '-'}</td>
                        <td className="px-4 py-2.5 text-slate-700">{k.deskripsi}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => setDraft({ ...draft, kondisi: draft.kondisi.filter((x) => x.id !== k.id) })}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {draft.kondisi.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-xs text-slate-400">Belum ada data kondisi.</td></tr>
                    )}
                  </tbody>
                </table></div>
                <div className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-4">
                  <div className="w-28">
                    <label className={labelCls}>No. Gigi</label>
                    <input type="number" value={newKondisi.toothNumber ?? ''} onChange={(e) => setNewKondisi({ ...newKondisi, toothNumber: e.target.value ? Number(e.target.value) : null })} className={inputCls} />
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className={labelCls}>Deskripsi</label>
                    <input value={newKondisi.deskripsi} onChange={(e) => setNewKondisi({ ...newKondisi, deskripsi: e.target.value })} className={inputCls} />
                  </div>
                  <button
                    onClick={() => {
                      if (!newKondisi.deskripsi) return;
                      setDraft({ ...draft, kondisi: [...draft.kondisi, { ...newKondisi, id: `kd-${Date.now()}` }] });
                      setNewKondisi({ id: '', toothNumber: null, deskripsi: '' });
                    }}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Kondisi
                  </button>
                </div>

                <div className="pt-2">
                  <Odontogram
                    value={draft.odontogram}
                    onChange={(val) => setDraft({ ...draft, odontogram: val })}
                  />
                </div>
              </div>
            )}

            {apTab === 'diagnosa' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {(['Diagnosa dokter', 'Asuhan keperawatan'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewDiag({ ...newDiag, type: t })}
                      className={subTabCls(newDiag.type === t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {/* Mobile: daftar diagnosa */}
                <div className="md:hidden space-y-3">
                  {draft.diagnosa.map((d) => (
                    <div key={d.id} className="rounded-xl border border-slate-200 p-3.5 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-teal-700">{d.icd10Code}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{d.type}</span>
                        </div>
                        <div className="text-sm text-slate-700 mt-1">{d.icd10Desc}</div>
                      </div>
                      <button
                        onClick={() => setDraft({ ...draft, diagnosa: draft.diagnosa.filter((x) => x.id !== d.id) })}
                        aria-label="Hapus diagnosa"
                        className="text-rose-500 hover:text-rose-700 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {draft.diagnosa.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Data diagnosa belum tersedia. Tambahkan di bawah.</p>
                  )}
                </div>
                {/* Desktop: tabel */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Tipe</th>
                      <th className="px-4 py-2.5 font-semibold">Kode ICD-10</th>
                      <th className="px-4 py-2.5 font-semibold">Diagnosa</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {draft.diagnosa.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{d.type}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-teal-700">{d.icd10Code}</td>
                        <td className="px-4 py-2.5 text-slate-700">{d.icd10Desc}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => setDraft({ ...draft, diagnosa: draft.diagnosa.filter((x) => x.id !== d.id) })} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {draft.diagnosa.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-400">Data diagnosa belum tersedia. Tambahkan di bawah.</td></tr>
                    )}
                  </tbody>
                </table></div>
                <div className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-4">
                  <div className="flex-1 min-w-56">
                    <label className={labelCls}>ICD-10</label>
                    <select
                      value={newDiag.icd10Code}
                      onChange={(e) => {
                        const found = ICD10_LIST.find((c) => c.code === e.target.value);
                        setNewDiag({ ...newDiag, icd10Code: e.target.value, icd10Desc: found?.desc ?? '' });
                      }}
                      className={inputCls}
                    >
                      <option value="">— Pilih kode ICD-10 —</option>
                      {ICD10_LIST.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.desc}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (!newDiag.icd10Code) return;
                      setDraft({ ...draft, diagnosa: [...draft.diagnosa, { ...newDiag, id: `dg-${Date.now()}` }] });
                      setNewDiag({ id: '', type: newDiag.type, icd10Code: '', icd10Desc: '' });
                    }}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Diagnosa
                  </button>
                </div>
              </div>
            )}

            {apTab === 'tindakan' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
                {/* Mobile: kartu tindakan */}
                <div className="md:hidden space-y-3">
                  {draft.tindakan.map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{t.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{t.code} · Gigi {t.tooth} · ×{t.qty}</div>
                        </div>
                        <button
                          onClick={() => setDraft({ ...draft, tindakan: draft.tindakan.filter((x) => x.id !== t.id) })}
                          aria-label="Hapus tindakan"
                          className="text-rose-500 hover:text-rose-700 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <div className="text-slate-400">Tarif</div>
                          <div className="font-semibold text-slate-700">{fmtRupiah(t.price)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Diskon</div>
                          <div className="font-semibold text-slate-700">{fmtRupiah(t.discount)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400">Subtotal</div>
                          <div className="font-bold text-teal-700">{fmtRupiah(t.qty * t.price - t.discount)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {draft.tindakan.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Belum ada tindakan.</p>
                  )}
                </div>
                {/* Desktop: tabel */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Kode Pelayanan</th>
                      <th className="px-4 py-2.5 font-semibold">Nama Tindakan</th>
                      <th className="px-4 py-2.5 font-semibold">Posisi Gigi</th>
                      <th className="px-4 py-2.5 font-semibold">Jml</th>
                      <th className="px-4 py-2.5 font-semibold">Tarif</th>
                      <th className="px-4 py-2.5 font-semibold">Diskon</th>
                      <th className="px-4 py-2.5 font-semibold">Sub Total</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {draft.tindakan.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{t.code}</td>
                        <td className="px-4 py-2.5 text-slate-700">{t.name}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{t.tooth}</td>
                        <td className="px-4 py-2.5 text-slate-700">{t.qty}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{fmtRupiah(t.price)}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{fmtRupiah(t.discount)}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{fmtRupiah(t.qty * t.price - t.discount)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => setDraft({ ...draft, tindakan: draft.tindakan.filter((x) => x.id !== t.id) })} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {draft.tindakan.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-4 text-center text-xs text-slate-400">Belum ada tindakan.</td></tr>
                    )}
                  </tbody>
                </table></div>

                <div className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-4">
                  <div className="w-40">
                    <label className={labelCls}>Tindakan (Master)</label>
                    <select
                      value={newTindakan.code}
                      onChange={(e) => {
                        const svc = state.services.find((s) => s.code === e.target.value);
                        setNewTindakan({ ...newTindakan, code: e.target.value, name: svc?.name ?? '', price: svc?.price ?? 0 });
                      }}
                      className={inputCls}
                    >
                      {state.services.map((s) => <option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className={labelCls}>Posisi Gigi</label>
                    <input value={newTindakan.tooth} onChange={(e) => setNewTindakan({ ...newTindakan, tooth: e.target.value })} className={inputCls} />
                  </div>
                  <div className="w-20">
                    <label className={labelCls}>Jml</label>
                    <input type="number" min={1} value={newTindakan.qty} onChange={(e) => setNewTindakan({ ...newTindakan, qty: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <button
                    onClick={() => setDraft({ ...draft, tindakan: [...draft.tindakan, { ...newTindakan, id: `tn-${Date.now()}` }] })}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Tindakan
                  </button>
                </div>

                {/* Ringkasan biaya */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
                  {([
                    ['Total Biaya Tindakan', totals.tindakan],
                    ['Total Biaya Alkes', totals.alkes],
                    ['Total Biaya Obat', totals.obat],
                    ['Total Diskon', totals.diskon],
                  ] as const).map(([label, v]) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">{label}</div>
                      <div className="text-sm font-bold text-slate-800">{fmtRupiah(v)}</div>
                    </div>
                  ))}
                  <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2.5">
                    <div className="text-[10px] uppercase font-semibold text-teal-500">Total Biaya</div>
                    <div className="text-sm font-black text-teal-700">{fmtRupiah(totals.total)}</div>
                  </div>
                </div>
              </div>
            )}

            {apTab === 'alkes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
                {/* Mobile: kartu alkes */}
                <div className="md:hidden space-y-3">
                  {draft.alkes.map((a) => (
                    <div key={a.id} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{a.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{a.code} · ×{a.qty}</div>
                        </div>
                        <button
                          onClick={() => setDraft({ ...draft, alkes: draft.alkes.filter((x) => x.id !== a.id) })}
                          aria-label="Hapus alkes"
                          className="text-rose-500 hover:text-rose-700 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400">@ {fmtRupiah(a.price)}</span>
                        <span className="font-bold text-teal-700">{fmtRupiah(a.qty * a.price)}</span>
                      </div>
                    </div>
                  ))}
                  {draft.alkes.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Data pemakaian alkes belum tersedia.</p>
                  )}
                </div>
                {/* Desktop: tabel */}
                <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Kode</th>
                      <th className="px-4 py-2.5 font-semibold">Nama Alkes</th>
                      <th className="px-4 py-2.5 font-semibold">Jml</th>
                      <th className="px-4 py-2.5 font-semibold">Harga</th>
                      <th className="px-4 py-2.5 font-semibold">Sub Total</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {draft.alkes.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{a.code}</td>
                        <td className="px-4 py-2.5 text-slate-700">{a.name}</td>
                        <td className="px-4 py-2.5 text-slate-700">{a.qty}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-xs">{fmtRupiah(a.price)}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{fmtRupiah(a.qty * a.price)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => setDraft({ ...draft, alkes: draft.alkes.filter((x) => x.id !== a.id) })} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {draft.alkes.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-xs text-slate-400">Data pemakaian alkes belum tersedia.</td></tr>
                    )}
                  </tbody>
                </table></div>
                <div className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-4">
                  <div className="w-44">
                    <label className={labelCls}>Alkes (Master)</label>
                    <select
                      value={newAlkes.code}
                      onChange={(e) => {
                        const med = state.medicines.find((m) => m.code === e.target.value);
                        setNewAlkes({ ...newAlkes, code: e.target.value, name: med?.name ?? '', price: med?.price ?? 0 });
                      }}
                      className={inputCls}
                    >
                      {state.medicines.map((m) => <option key={m.id} value={m.code}>{m.code} — {m.name}</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className={labelCls}>Jml</label>
                    <input type="number" min={1} value={newAlkes.qty} onChange={(e) => setNewAlkes({ ...newAlkes, qty: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <button
                    onClick={() => setDraft({ ...draft, alkes: [...draft.alkes, { ...newAlkes, id: `al-${Date.now()}` }] })}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pemakaian Alkes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ TAB P ============ */}
        {mainTab === 'p' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                ['apotek', 'Plan — Resep Apotek'],
                ['rujukan', 'Plan — Resep Rujuk ke Apotek Luar'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setPTab(key)} className={subTabCls(pTab === key)}>{label}</button>
              ))}
            </div>

            {(['apotek', 'rujukan'] as const).map((section) => {
              const list = section === 'apotek' ? draft.resepApotek : draft.resepRujukan;
              const isApotek = section === 'apotek';
              const meds = state.medicines;
              return pTab === section ? (
                <div key={section} className="space-y-4">
                  {list.map((rp, ri) => (
                    <div key={ri} className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-slate-800 text-sm">Resep {ri + 1}</h3>
                        <button
                          onClick={() =>
                            setDraft({
                              ...draft,
                              resepApotek: isApotek ? draft.resepApotek.filter((_, i) => i !== ri) : draft.resepApotek,
                              resepRujukan: !isApotek ? draft.resepRujukan.filter((_, i) => i !== ri) : draft.resepRujukan,
                            })
                          }
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Mobile: kartu item resep */}
                      <div className="md:hidden space-y-2.5">
                        {rp.items.map((it) => (
                          <div key={it.id} className="rounded-xl border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-800 truncate">{it.name}</div>
                                <div className="text-[11px] font-mono text-slate-400">{it.code} · ×{it.qty}</div>
                              </div>
                              <button
                                onClick={() =>
                                  setDraft({
                                    ...draft,
                                    resepApotek: isApotek
                                      ? draft.resepApotek.map((r2, i2) => (i2 === ri ? { ...r2, items: r2.items.filter((x) => x.id !== it.id) } : r2))
                                      : draft.resepApotek,
                                    resepRujukan: !isApotek
                                      ? draft.resepRujukan.map((r2, i2) => (i2 === ri ? { ...r2, items: r2.items.filter((x) => x.id !== it.id) } : r2))
                                      : draft.resepRujukan,
                                  })
                                }
                                aria-label="Hapus item resep"
                                className="text-rose-500 hover:text-rose-700 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-slate-400">@ {fmtRupiah(it.price)}</span>
                              <span className="font-bold text-teal-700">{fmtRupiah(it.qty * it.price)}</span>
                            </div>
                          </div>
                        ))}
                        {rp.items.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-2">Resep kosong.</p>
                        )}
                      </div>
                      {/* Desktop: tabel */}
                      <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-2.5 font-semibold">Kode Barang</th>
                            <th className="px-4 py-2.5 font-semibold">Nama Barang</th>
                            <th className="px-4 py-2.5 font-semibold">Jml</th>
                            <th className="px-4 py-2.5 font-semibold">Harga Satuan</th>
                            <th className="px-4 py-2.5 font-semibold">Sub Total</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {rp.items.map((it) => (
                            <tr key={it.id}>
                              <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{it.code}</td>
                              <td className="px-4 py-2.5 text-slate-700">{it.name}</td>
                              <td className="px-4 py-2.5 text-slate-700">{it.qty}</td>
                              <td className="px-4 py-2.5 text-slate-600 text-xs">{fmtRupiah(it.price)}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-800">{fmtRupiah(it.qty * it.price)}</td>
                              <td className="px-4 py-2.5 text-right">
                                <button
                                  onClick={() =>
                                    setDraft({
                                      ...draft,
                                      resepApotek: isApotek
                                        ? draft.resepApotek.map((r2, i2) => (i2 === ri ? { ...r2, items: r2.items.filter((x) => x.id !== it.id) } : r2))
                                        : draft.resepApotek,
                                      resepRujukan: !isApotek
                                        ? draft.resepRujukan.map((r2, i2) => (i2 === ri ? { ...r2, items: r2.items.filter((x) => x.id !== it.id) } : r2))
                                        : draft.resepRujukan,
                                    })
                                  }
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {rp.items.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-4 text-center text-xs text-slate-400">Resep kosong.</td></tr>
                          )}
                        </tbody>
                      </table></div>
                      <div className="mt-3 flex items-end gap-2">
                        <select
                          onChange={(e) => {
                            const med = meds.find((m) => m.id === e.target.value);
                            if (!med) return;
                            const item = { id: `rx-${Date.now()}`, code: med.code, name: med.name, qty: 1, price: med.price };
                            const updated = list.map((r2, i2) => (i2 === ri ? { ...r2, items: [...r2.items, item] } : r2));
                            setDraft(isApotek ? { ...draft, resepApotek: updated } : { ...draft, resepRujukan: updated });
                          }}
                          defaultValue=""
                          className={`${inputCls} max-w-xs`}
                        >
                          <option value="">+ Tambah obat dari master…</option>
                          {meds.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name} (stok {m.stock})</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newResep = { items: [] as { id: string; code: string; name: string; qty: number; price: number }[] };
                      setDraft(
                        isApotek
                          ? { ...draft, resepApotek: [...draft.resepApotek, newResep] }
                          : { ...draft, resepRujukan: [...draft.resepRujukan, newResep] }
                      );
                    }}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Resep
                  </button>
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* ============ TAB CPPT ============ */}
        {mainTab === 'cppt' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
              <h2 className="font-bold text-slate-800 text-sm">Tambah CPPT (Catatan Perkembangan Pasien Terintegrasi)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Tanggal & Waktu</label>
                  <input type="datetime-local" value={newCppt.datetime.slice(0, 16)} onChange={(e) => setNewCppt({ ...newCppt, datetime: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>PPA</label>
                  <input value={newCppt.ppa} onChange={(e) => setNewCppt({ ...newCppt, ppa: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Profesi</label>
                  <select value={newCppt.profesi} onChange={(e) => setNewCppt({ ...newCppt, profesi: e.target.value })} className={inputCls}>
                    {['Dokter Gigi', 'Dokter', 'Perawat', 'Apoteker'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {([
                  ['subjektif', 'Subjektif'],
                  ['objektif', 'Objektif'],
                  ['asesmen', 'Asesmen'],
                  ['plan', 'Plan'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <textarea rows={2} value={newCppt[key]} onChange={(e) => setNewCppt({ ...newCppt, [key]: e.target.value })} className={inputCls} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!newCppt.subjektif && !newCppt.asesmen) return;
                  setDraft({ ...draft, cppt: [{ ...newCppt, id: `cp-${Date.now()}` }, ...draft.cppt] });
                  setNewCppt({ id: '', datetime: new Date().toISOString().slice(0, 16), ppa: reg.doctor, profesi: 'Dokter Gigi', subjektif: '', objektif: '', asesmen: '', plan: '' });
                }}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah CPPT
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Mobile: kartu CPPT */}
              <div className="md:hidden divide-y divide-slate-100">
                {draft.cppt.map((c) => {
                  const dt = fmtDateTime(c.datetime);
                  return (
                    <div key={c.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800">{dt.date} · {dt.time}</div>
                          <div className="text-[11px] text-slate-500">{c.ppa} — {c.profesi}</div>
                        </div>
                        <button
                          onClick={() => setDraft({ ...draft, cppt: draft.cppt.filter((x) => x.id !== c.id) })}
                          aria-label="Hapus CPPT"
                          className="text-rose-500 hover:text-rose-700 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div><b>S:</b> {c.subjektif || '—'}</div>
                        <div><b>O:</b> {c.objektif || '—'}</div>
                        <div><b>A:</b> {c.asesmen || '—'}</div>
                        <div><b>P:</b> {c.plan || '—'}</div>
                      </div>
                    </div>
                  );
                })}
                {draft.cppt.length === 0 && (
                  <p className="px-4 py-8 text-center text-xs text-slate-400">Belum ada catatan CPPT.</p>
                )}
              </div>
              {/* Desktop: tabel */}
              <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Tanggal dan Waktu</th>
                    <th className="px-4 py-3 font-semibold">Profesi Pemberi Asuhan (PPA)</th>
                    <th className="px-4 py-3 font-semibold">Catatan SOAP</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {draft.cppt.map((c) => {
                    const dt = fmtDateTime(c.datetime);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {dt.date}
                          <span className="inline-flex items-center gap-1 ml-2 text-slate-400"><StickyNote className="w-3 h-3" />{dt.time}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800 text-xs font-semibold">{c.ppa}</div>
                          <div className="text-[11px] text-slate-400">{c.profesi}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-md">
                          <div><b>S:</b> {c.subjektif || '—'}</div>
                          <div><b>O:</b> {c.objektif || '—'}</div>
                          <div><b>A:</b> {c.asesmen || '—'}</div>
                          <div><b>P:</b> {c.plan || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setDraft({ ...draft, cppt: draft.cppt.filter((x) => x.id !== c.id) })} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {draft.cppt.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">Belum ada catatan CPPT.</td></tr>
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
