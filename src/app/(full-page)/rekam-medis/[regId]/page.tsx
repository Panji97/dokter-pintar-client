'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { useShell } from '@/components/layout/AppShell';
import { Odontogram } from '@/components/rme/Odontogram';
import { IcdCombobox } from '@/components/rme/IcdCombobox';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { EditPatientModal } from '@/components/pasien/EditPatientModal';
import { useClinicStore, fmtRupiah, fmtDate, fmtDateTime } from '@/lib/ClinicStore';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import { uploadMedia, deleteMedia, resolveMediaUrl } from '@/lib/strapi';
import { useSignedMediaUrls } from '@/lib/useSignedMedia';
import { getSession } from '@/lib/auth';
import {
  VITAL_RULES, vitalRuleOf, sanitizeNumeric, sanitizeInt,
  vitalError, tensiPairError, toothError, gravidaError, qtyError,
  TEXT_LIMITS,
} from '@/lib/emr-validation';
import {
  EmrDocument, EmrPhoto, DiagnosaItem, TindakanItem, AlkesItem, KondisiGigi,
} from '@/types/clinic';
import {
  Plus, Trash2, FileText, Upload, FileCheck, Loader2, X, ChevronLeft, ChevronRight,
  History, Pencil,
} from 'lucide-react';

type MainTab = 'riwayat' | 'so' | 'ap' | 'p';
type SoTab = 'anamnesa-umum' | 'anamnesa-odonto' | 'pemeriksaan' | 'foto';
type ApTab = 'kondisi' | 'diagnosa' | 'tindakan' | 'alkes';
type PTab = 'apotek' | 'rujukan';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
const labelCls = 'text-xs font-medium text-slate-600 block mb-1';

export default function EmrDetailPage() {
  const params = useParams<{ regId: string }>();
  const regId = params.regId;
  const router = useRouter();
  const { state, loading, getOrCreateEmr, updateEmr, addInvoice, ensureModule } = useClinicStore();
  const { mutate: mutateGlobal } = useSWRConfig();
  const { toast } = useShell();

  useEffect(() => {
    ensureModule('emr');
    ensureModule('pengaturan');
  }, [ensureModule]);

  const reg = state.registrations.find((r) => r.id === regId);
  const doc = getOrCreateEmr(regId);
  // Entri tersimpan (stabil referensinya) — undefined selama modul EMR memuat.
  const storedDoc = reg ? state.emr[regId] : undefined;

  const [mainTab, setMainTab] = useState<MainTab>('riwayat');
  const [soTab, setSoTab] = useState<SoTab>('anamnesa-umum');
  const [apTab, setApTab] = useState<ApTab>('kondisi');
  const [pTab, setPTab] = useState<PTab>('apotek');
  // Tanggal lokal hari ini (diisi setelah mount agar SSR & hidrasi identik).
  const [todayStr, setTodayStr] = useState('');
  useEffect(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setTodayStr(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }, []);
  const [draft, setDraft] = useState<EmrDocument>(doc);
  // Sinkronkan draft saat data tiba (store memuat async).
  const [draftFor, setDraftFor] = useState<string | null>(null);
  // Objek draft terakhir hasil sinkronisasi — untuk bedakan "belum diubah
  // user" vs "sudah diedit". Sinkronisasi ulang hanya bila masih murni.
  const lastSynced = useRef<EmrDocument | null>(null);
  if (!loading && reg && draftFor !== regId) {
    setDraft(doc);
    setDraftFor(regId);
    lastSynced.current = doc;
  } else if (
    !loading && reg && draftFor === regId && storedDoc &&
    lastSynced.current !== storedDoc && draft === lastSynced.current
  ) {
    // Modul EMR selesai dimuat belakangan (dokumen tersimpan tiba setelah
    // draft blank dibuat) → sinkronkan ulang sekali, tanpa menimpa editan.
    setDraft(storedDoc);
    lastSynced.current = storedDoc;
  }

  // form state untuk tambah entitas
  const [newKondisi, setNewKondisi] = useState<KondisiGigi>({ id: '', toothNumber: null, deskripsi: '' });
  const [newDiag, setNewDiag] = useState<DiagnosaItem>({ id: '', type: 'Diagnosa dokter', icd10Code: '', icd10Desc: '' });
  const [newTindakan, setNewTindakan] = useState<TindakanItem>({ id: '', code: 'PK0053', name: 'JPKM', tooth: '-', qty: 1, price: 350000, discount: 0 });
  const [newAlkes, setNewAlkes] = useState<AlkesItem>({ id: '', code: 'BHP5', name: 'ALKES 5', qty: 1, price: 95000 });

  // Ubah data diri pasien dari header (komponen bersama EditPatientModal).
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const patient = reg ? state.patients.find((p) => p.id === reg.patientId) : undefined;

  const totals = useMemo(() => {
    const tindakan = draft.tindakan.reduce((s, t) => s + t.qty * t.price - t.discount, 0);
    const alkes = draft.alkes.reduce((s, a) => s + a.qty * a.price, 0);
    const obat = draft.resepApotek.reduce((s, r) => s + r.items.reduce((x, i) => x + i.qty * i.price, 0), 0);
    const diskon = draft.tindakan.reduce((s, t) => s + t.discount, 0);
    return { tindakan, alkes, obat, diskon, total: tindakan + alkes + obat };
  }, [draft]);

  // Kunci anti-klik-ganda: request Selesai yang sedang berjalan mengabaikan klik berikutnya.
  const selesaiLock = useRef(false);
  const [finishing, setFinishing] = useState(false);

  // ---- Validasi field (baca dari draft, tampil inline + gate Selesai) ----
  const setVital = (key: (typeof VITAL_RULES)[number]['key'], raw: string) => {
    const rule = vitalRuleOf(key);
    if (!rule) return;
    setDraft({
      ...draft,
      pemeriksaanUmum: { ...draft.pemeriksaanUmum, [key]: sanitizeNumeric(raw, rule.decimals) },
    });
  };
  const vitalErrors = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const r of VITAL_RULES) map[r.key] = vitalError(r, draft.pemeriksaanUmum[r.key] ?? '');
    map.tensiPair = tensiPairError(draft.pemeriksaanUmum.tensiSistolik, draft.pemeriksaanUmum.tensiDiastolik);
    return map;
  }, [draft.pemeriksaanUmum]);
  const gravidaErr = useMemo(() => gravidaError(draft.anamnesaUmum.gravida), [draft.anamnesaUmum.gravida]);

  /** Pemeriksaan sebelum Selesai — kembalikan daftar pesan (kosong = lolos). */
  const validateBeforeFinish = (): string[] => {
    const problems: string[] = [];
    if (!draft.anamnesaUmum.keluhanUtama.trim()) {
      problems.push('Keluhan utama wajib diisi (Subjektif — Anamnesa Umum).');
    }
    for (const r of VITAL_RULES) {
      const err = vitalError(r, draft.pemeriksaanUmum[r.key] ?? '');
      if (err) problems.push(`${err} (Objektif — Pemeriksaan Umum).`);
    }
    const pair = tensiPairError(draft.pemeriksaanUmum.tensiSistolik, draft.pemeriksaanUmum.tensiDiastolik);
    if (pair) problems.push(`${pair} (Objektif — Pemeriksaan Umum).`);
    const g = gravidaError(draft.anamnesaUmum.gravida);
    if (g) problems.push(`${g} (Subjektif — Anamnesa Umum).`);
    if (draft.diagnosa.length === 0) {
      problems.push('Minimal 1 diagnosa wajib diisi (Asesmen — Diagnosa).');
    }
    draft.kondisi.forEach((k, i) => {
      if (k.toothNumber == null || !Number.isInteger(k.toothNumber) || k.toothNumber < 11 || k.toothNumber > 48) {
        problems.push(`Kondisi #${i + 1}: nomor gigi FDI tidak valid.`);
      } else {
        const q = Math.floor(k.toothNumber / 10);
        const t = k.toothNumber % 10;
        if (q < 1 || q > 4 || t < 1 || t > 8) problems.push(`Kondisi #${i + 1}: nomor gigi FDI tidak valid.`);
      }
      if (!k.deskripsi.trim()) problems.push(`Kondisi #${i + 1}: deskripsi wajib diisi.`);
    });
    draft.tindakan.forEach((t, i) => {
      const tq = toothError(t.tooth, { allowDash: true });
      if (tq) problems.push(`Tindakan #${i + 1} (${t.name || t.code}): ${tq}`);
      const qq = qtyError(t.qty, 'Jumlah tindakan');
      if (qq) problems.push(`Tindakan #${i + 1} (${t.name || t.code}): ${qq}.`);
    });
    draft.alkes.forEach((a, i) => {
      const qq = qtyError(a.qty, 'Jumlah alkes');
      if (qq) problems.push(`Alkes #${i + 1} (${a.name || a.code}): ${qq}.`);
    });
    return problems;
  };

  /** Arahkan dokter ke tab berisi masalah pertama. */
  const jumpToProblem = (msg: string) => {
    if (msg.includes('Anamnesa Umum')) {
      setMainTab('so');
      setSoTab('anamnesa-umum');
    } else if (msg.includes('Pemeriksaan Umum')) {
      setMainTab('so');
      setSoTab('pemeriksaan');
    } else if (msg.includes('Diagnosa')) {
      setMainTab('ap');
      setApTab('diagnosa');
    } else if (msg.includes('Kondisi')) {
      setMainTab('ap');
      setApTab('kondisi');
    } else if (msg.includes('Tindakan')) {
      setMainTab('ap');
      setApTab('tindakan');
    } else if (msg.includes('Alkes')) {
      setMainTab('ap');
      setApTab('alkes');
    }
  };

  const selesai = async () => {
    if (selesaiLock.current) return;
    // Gate pencatatan medis: data wajib & rentang vital harus benar dulu.
    const problems = validateBeforeFinish();
    if (problems.length > 0) {
      jumpToProblem(problems[0]);
      toast(
        problems.length === 1
          ? problems[0]
          : `${problems[0]} (+${problems.length - 1} masalah lain)`,
      );
      return;
    }
    selesaiLock.current = true;
    setFinishing(true);
    try {
      await updateEmr(regId, draft);
      await addInvoice({
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
      mutateGlobal((key) => typeof key === 'string' && (key.includes(STRAPI_ENDPOINTS.invoices) || key.includes(STRAPI_ENDPOINTS.registrations)));
      // Tetap di tab aktif agar dokter bisa leluasa lanjut mengisi EMR — tanpa pindah tab/halaman.
      toast('Rekam medis selesai disimpan.');
    } finally {
      selesaiLock.current = false;
      setFinishing(false);
    }
  };

  // ---- Unggah foto klinis (before-after) ke Strapi → MinIO bucket `dpi` ----
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [deletingFotoId, setDeletingFotoId] = useState<number | null>(null);
  // Konfirmasi hapus: id foto yang menunggu persetujuan user (null = tidak ada).
  const [confirmHapusId, setConfirmHapusId] = useState<number | null>(null);
  // Dialog konfirmasi bersama untuk SEMUA aksi hapus selain foto.
  const { confirm: confirmHapus, dialog: dialogHapus } = useConfirmDialog();

  /** Hapus 1 baris draft (kondisi/diagnosa/tindakan/alkes) — selalu konfirmasi dulu. */
  const hapusDraftItem = async (
    kind: 'kondisi' | 'diagnosa' | 'tindakan' | 'alkes',
    id: string,
    desc: string,
  ) => {
    const ok = await confirmHapus({ title: `Hapus ${kind}?`, message: `${desc} akan dihapus dari daftar.` });
    if (!ok) return;
    if (kind === 'kondisi') setDraft({ ...draft, kondisi: draft.kondisi.filter((x) => x.id !== id) });
    else if (kind === 'diagnosa') setDraft({ ...draft, diagnosa: draft.diagnosa.filter((x) => x.id !== id) });
    else if (kind === 'tindakan') setDraft({ ...draft, tindakan: draft.tindakan.filter((x) => x.id !== id) });
    else setDraft({ ...draft, alkes: draft.alkes.filter((x) => x.id !== id) });
  };

  /** Hapus 1 lembar resep beserta isinya — selalu konfirmasi dulu. */
  const hapusResep = async (isApotek: boolean, ri: number) => {
    const ok = await confirmHapus({ title: `Hapus Resep ${ri + 1}?`, message: `Seluruh isi Resep ${ri + 1} akan dihapus dari daftar.` });
    if (!ok) return;
    setDraft({
      ...draft,
      resepApotek: isApotek ? draft.resepApotek.filter((_, i) => i !== ri) : draft.resepApotek,
      resepRujukan: !isApotek ? draft.resepRujukan.filter((_, i) => i !== ri) : draft.resepRujukan,
    });
  };

  /** Hapus 1 item obat dari resep — selalu konfirmasi dulu. */
  const hapusResepItem = async (isApotek: boolean, ri: number, id: string, name: string) => {
    const ok = await confirmHapus({ title: 'Hapus obat dari resep?', message: `${name} akan dihapus dari Resep ${ri + 1}.` });
    if (!ok) return;
    setDraft({
      ...draft,
      resepApotek: isApotek
        ? draft.resepApotek.map((r2, i2) => (i2 === ri ? { ...r2, items: r2.items.filter((x) => x.id !== id) } : r2))
        : draft.resepApotek,
      resepRujukan: !isApotek
        ? draft.resepRujukan.map((r2, i2) => (i2 === ri ? { ...r2, items: r2.items.filter((x) => x.id !== id) } : r2))
        : draft.resepRujukan,
    });
  };
  useEffect(() => {
    if (confirmHapusId === null || deletingFotoId !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmHapusId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmHapusId, deletingFotoId]);
  // Bucket private → <img> memakai presigned URL batch (cache + auto-refresh).
  const signedFoto = useSignedMediaUrls(draft.photos.map((p) => p.id));
  const callerFaskesId = getSession()?.faskes?.documentId ?? '';
  // Lightbox: tampilkan foto terpilih secara keseluruhan (fullscreen).
  const [lightbox, setLightbox] = useState<number | null>(null);
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowRight') setLightbox((v) => (v === null ? v : (v + 1) % draft.photos.length));
      else if (e.key === 'ArrowLeft') setLightbox((v) => (v === null ? v : (v - 1 + draft.photos.length) % draft.photos.length));
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, draft.photos.length]);

  const uploadFoto = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) {
        toast(`File ${f.name} bukan gambar — dilewati.`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast(`File ${f.name} melebihi 10MB — dilewati.`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;
    setUploadingFoto(true);
    try {
      // Pola HRIS: FormData `files` → POST /api/upload → pakai id/url respons.
      // Caption = faskesId agar endpoint signed-URL mengizinkan preview
      // file fresh-upload (belum terhubung ke EMR).
      const uploaded = await uploadMedia(valid, callerFaskesId ? { caption: callerFaskesId } : undefined);
      const mapped: EmrPhoto[] = uploaded.map((m) => ({
        id: m.id,
        ...(m.documentId ? { documentId: m.documentId } : {}),
        url: resolveMediaUrl(m.url),
        name: m.name,
      }));
      const photos = [...draft.photos, ...mapped];
      const next = { ...draft, photos, photoCount: photos.length };
      setDraft(next);
      try {
        // Autosave seperti klik Selesai — foto tak hilang bila halaman di-refresh
        // tanpa sempat klik Selesai (tanpa gate validasi & tanpa buat tagihan).
        await updateEmr(regId, next);
        toast(`${mapped.length} foto terunggah dan tersimpan.`);
      } catch {
        toast('Foto terunggah, tetapi belum tersimpan — klik Selesai untuk menyimpan.');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload foto gagal.');
    } finally {
      setUploadingFoto(false);
      if (fotoInputRef.current) fotoInputRef.current.value = '';
    }
  };

  const hapusFoto = async (id: number) => {
    const target = draft.photos.find((p) => p.id === id);
    if (!target || deletingFotoId !== null) return;
    setDeletingFotoId(id);
    try {
      // DELETE /api/upload/files/:id → Strapi menghapus baris file di DB
      // SEKALIGUS objek di MinIO (provider aws-s3: DeleteObjectCommand).
      await deleteMedia(target.id);
      const photos = draft.photos.filter((p) => p.id !== id);
      const next = { ...draft, photos, photoCount: photos.length };
      setDraft(next);
      if (lightbox !== null) {
        if (photos.length === 0) setLightbox(null);
        else if (lightbox >= photos.length) setLightbox(photos.length - 1);
      }
      setConfirmHapusId(null);
      toast('Foto dihapus.');
      // Bersihkan relasi di dokumen langsung (best-effort — klik Selesai juga membersihkan).
      updateEmr(regId, next).catch(() => {});
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Hapus foto gagal — foto tetap ada.');
    } finally {
      setDeletingFotoId(null);
    }
  };

  if (loading || !reg) {
    return (
      <>
        <Topbar title="Rekam Medis" showBrand />
        <main className="flex-1 p-4 md:p-6">
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            {loading ? 'Memuat data…' : (
              <>Pendaftaran tidak ditemukan.{' '}
              <Link href="/rekam-medis" className="text-teal-600 font-medium">Kembali ke daftar</Link></>
            )}
          </div>
        </main>
      </>
    );
  }

  const regDate = fmtDateTime(reg.regDate);

  /** "Sesi ini" hanya untuk kunjungan yang terdaftar di antrean hari ini. */
  const toLocalDateStr = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const isTodayVisit = todayStr !== '' && toLocalDateStr(reg.regDate) === todayStr;

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
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ['Nama Pasien', reg.patientName],
              ['Grup Pasien', reg.group],
              ['Poli', reg.room],
              ['Pelayanan', reg.serviceType],
              ['Tgl. Pendaftaran', regDate.date],
              ['Dokter', reg.doctor],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">{label}</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5 truncate" title={value}>{value}</div>
              </div>
            ))}
          </div>
          {patient && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setEditPatientOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-lg transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                Ubah Data Pasien
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab utama — satu baris scroll horizontal di semua ukuran layar */}
      <div className="px-4 md:px-6 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            ['riwayat', 'Rekam Medis'],
            ['so', 'Catatan FasKes (SO)'],
            ['ap', 'Diagnosa & Tindakan (AP)'],
            ['p', 'Resep (P)'],
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
            <button onClick={selesai} disabled={finishing} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white transition disabled:opacity-60 disabled:pointer-events-none">
              <FileCheck className="w-4 h-4" />
              {finishing ? 'Menyimpan…' : 'Selesai'}
            </button>
          </div>
        </div>
      </div>

      {/* Aksi Selesai mengambang — hanya mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
        <button onClick={selesai} disabled={finishing} className="pointer-events-auto w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xl transition disabled:opacity-60">
          <FileCheck className="w-4 h-4" />
          {finishing ? 'Menyimpan…' : 'Selesai'}
        </button>
      </div>

      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 space-y-5">
        {/* ============ TAB RIWAYAT ============ */}
        {mainTab === 'riwayat' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Riwayat Medis Pasien</h2>
              {/* Pilih kunjungan pasien — form di bawah mengikuti pilihan ini */}
              <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <History className="w-3.5 h-3.5 shrink-0" />
                  Kunjungan pasien ({state.registrations.filter((r) => r.patientId === reg.patientId).length})
                </span>
                <select
                  value={regId}
                  aria-label="Pilih kunjungan pasien yang dibuka"
                  onChange={(e) => {
                    if (e.target.value === regId) return;
                    const target = state.registrations.find((r) => r.id === e.target.value);
                    if (target) toast(`Membuka kunjungan ${fmtDate(target.regDate)} · ${target.serviceType}. Form di bawah mengikuti kunjungan ini.`);
                    router.push(`/rekam-medis/${e.target.value}`);
                  }}
                  className="w-full sm:w-auto px-2.5 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-400 bg-white sm:max-w-64"
                >
                  {[...state.registrations]
                    .filter((r) => r.patientId === reg.patientId)
                    .sort((a, b) => b.regDate.localeCompare(a.regDate))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {fmtDate(r.regDate)} · {r.serviceType}{r.id === regId ? ' (buka)' : ''}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="p-4 md:p-5">
              {/* Mobile: kartu riwayat */}
              <div className="md:hidden space-y-3">
                {state.registrations
                  .filter((r) => r.patientId === reg.patientId)
                  .map((r) => {
                    const emr = r.id === regId ? draft : state.emr[r.id];
                    const isCurrentSession = r.id === regId && isTodayVisit;
                    const isOpened = r.id === regId;
                    return (
                      <div key={r.id} className={`rounded-xl border p-3.5 transition ${isOpened ? 'border-teal-400 bg-teal-50/60 shadow-sm' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800">{fmtDate(r.regDate)}</span>
                          {isCurrentSession ? (
                            <span className="shrink-0 whitespace-nowrap text-[11px] text-teal-700 font-bold bg-teal-100 px-2 py-0.5 rounded-full">Sesi ini — sedang diubah</span>
                          ) : isOpened ? (
                            <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-600 font-bold bg-slate-200 px-2 py-0.5 rounded-full">Sedang dibuka</span>
                          ) : (
                            <Link
                              href={`/rekam-medis/${r.id}`}
                              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md transition"
                            >
                              <FileText className="w-3 h-3" /> Buka
                            </Link>
                          )}
                        </div>
                        <div className="mt-1.5 text-sm font-medium text-slate-800">{r.serviceType}</div>
                        <div className="text-[11px] text-slate-500">{emr?.diagnosa[0]?.icd10Desc ?? '—'}</div>
                        <div className="text-[11px] text-slate-400">{r.doctor}</div>
                      </div>
                    );
                  })}
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
                    .filter((r) => r.patientId === reg.patientId)
                    .map((r) => {
                      const emr = r.id === regId ? draft : state.emr[r.id];
                      const isCurrentSession = r.id === regId && isTodayVisit;
                      const isOpened = r.id === regId;
                      return (
                        <tr key={r.id} className={`transition ${isOpened ? 'bg-teal-50/70 hover:bg-teal-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(r.regDate)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{r.serviceType}</td>
                          <td className="px-4 py-3 text-xs text-slate-700">{emr?.diagnosa[0]?.icd10Desc ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{r.doctor}</td>
                          <td className="px-4 py-3 text-right">
                            {isCurrentSession ? (
                              <span className="text-[11px] text-teal-700 font-bold bg-teal-100 px-2 py-0.5 rounded-full">Sesi ini — sedang diubah</span>
                            ) : isOpened ? (
                              <span className="text-[11px] text-slate-600 font-bold bg-slate-200 px-2 py-0.5 rounded-full">Sedang dibuka</span>
                            ) : (
                              <Link
                                href={`/rekam-medis/${r.id}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md transition"
                              >
                                <FileText className="w-3 h-3" /> Buka
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                    <label className={labelCls}>
                      {label}
                      {key === 'keluhanUtama' && <span className="text-rose-500"> *</span>}
                      {key === 'gravida' && <span className="text-slate-400 font-normal"> — format G_P_A_ (cth. G2P1A0)</span>}
                    </label>
                    {key === 'gravida' ? (
                      <>
                        <input
                          value={draft.anamnesaUmum.gravida}
                          onChange={(e) => setDraft({ ...draft, anamnesaUmum: { ...draft.anamnesaUmum, gravida: e.target.value.toUpperCase().replace(/[^GPAp0-9]/gi, '') } })}
                          maxLength={12}
                          placeholder="G2P1A0"
                          autoComplete="off"
                          aria-invalid={!!gravidaErr}
                          className={`${inputCls} uppercase ${gravidaErr ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40' : ''}`}
                        />
                        {gravidaErr && <p className="text-[11px] text-rose-600 mt-1 leading-tight">{gravidaErr}</p>}
                      </>
                    ) : (
                      <textarea rows={2} maxLength={TEXT_LIMITS.textarea} value={draft.anamnesaUmum[key]} onChange={(e) => setDraft({ ...draft, anamnesaUmum: { ...draft.anamnesaUmum, [key]: e.target.value } })} className={inputCls} />
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
                          maxLength={TEXT_LIMITS.short}
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
                  <div key={key} className={key === 'lainLain' ? 'md:col-span-2' : ''}>
                    <label className={labelCls}>{label}</label>
                    {key === 'lainLain' ? (
                      <textarea rows={3} maxLength={TEXT_LIMITS.textarea} value={draft.anamnesaOdontogram[key]} onChange={(e) => setDraft({ ...draft, anamnesaOdontogram: { ...draft.anamnesaOdontogram, [key]: e.target.value } })} className={inputCls} />
                    ) : (
                      <input maxLength={TEXT_LIMITS.input} value={draft.anamnesaOdontogram[key]} onChange={(e) => setDraft({ ...draft, anamnesaOdontogram: { ...draft.anamnesaOdontogram, [key]: e.target.value } })} className={inputCls} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {soTab === 'pemeriksaan' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
                <div>
                  <label className={labelCls}>Deskripsi Pemeriksaan</label>
                  <textarea rows={2} maxLength={TEXT_LIMITS.textarea} value={draft.pemeriksaanUmum.deskripsi} onChange={(e) => setDraft({ ...draft, pemeriksaanUmum: { ...draft.pemeriksaanUmum, deskripsi: e.target.value } })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {VITAL_RULES.map((rule) => {
                    const err = vitalErrors[rule.key];
                    return (
                      <div key={rule.key}>
                        <label className={labelCls}>{rule.label} ({rule.unit})</label>
                        <input
                          value={draft.pemeriksaanUmum[rule.key]}
                          onChange={(e) => setVital(rule.key, e.target.value)}
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder={`${rule.min}–${rule.max}`}
                          aria-invalid={!!err}
                          aria-describedby={err ? `err-${rule.key}` : undefined}
                          className={`${inputCls} ${err ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40' : ''}`}
                        />
                        {err && (
                          <p id={`err-${rule.key}`} className="text-[11px] text-rose-600 mt-1 leading-tight">{err}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {vitalErrors.tensiPair && (
                  <p className="text-[11px] text-rose-600 leading-tight">{vitalErrors.tensiPair}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['mata', 'gigiMulut', 'kulit'] as const).map((key) => (
                    <div key={key}>
                      <label className={labelCls}>{key === 'mata' ? 'Mata' : key === 'gigiMulut' ? 'Gigi & Mulut' : 'Kulit'}</label>
                      <input maxLength={TEXT_LIMITS.input} value={draft.pemeriksaanUmum[key]} onChange={(e) => setDraft({ ...draft, pemeriksaanUmum: { ...draft.pemeriksaanUmum, [key]: e.target.value } })} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {soTab === 'foto' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-4">
                <div className="text-center py-2">
                  <Upload className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700 text-sm">Unggah Foto Sebelum / Sesudah (Before–After)</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Dokumentasikan kondisi pasien sebelum dan sesudah tindakan. Foto langsung
                    terunggah dan ikut tersimpan saat klik Selesai.
                  </p>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    aria-label="Pilih foto klinis"
                    onChange={(e) => uploadFoto(e.target.files)}
                  />
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => fotoInputRef.current?.click()}
                      disabled={uploadingFoto}
                      className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
                    >
                      {uploadingFoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      {uploadingFoto ? 'Mengunggah…' : 'Tambah Foto'}
                    </button>
                    <span className="text-xs text-slate-500">{draft.photos.length} foto terunggah</span>
                  </div>
                </div>
                {draft.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
                    {draft.photos.map((p, i) => (
                      <div key={`${p.id}-${i}`} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        {signedFoto[p.id] ? (
                          <button
                            type="button"
                            onClick={() => setLightbox(i)}
                            aria-label={`Lihat ${p.name} fullscreen`}
                            className="block w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={signedFoto[p.id]} alt={p.name} className="w-full h-32 object-cover pointer-events-none" loading="lazy" />
                          </button>
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-slate-100" aria-label="Memuat foto…">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                          <span className="text-[11px] text-slate-500 truncate" title={p.name}>{i + 1}. {p.name}</span>
                          <button
                            type="button"
                            onClick={() => setConfirmHapusId(p.id)}
                            aria-label={`Hapus ${p.name}`}
                            className="text-rose-500 hover:text-rose-700 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Lightbox fullscreen — klik thumbnail untuk lihat keseluruhan */}
                {lightbox !== null && draft.photos[lightbox] && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Foto ${lightbox + 1} dari ${draft.photos.length}`}
                    className="fixed inset-0 z-[110] bg-black/90 flex flex-col"
                    onClick={() => setLightbox(null)}
                  >
                    <div className="flex items-center justify-between gap-2 px-4 py-3 text-white">
                      <span className="text-xs truncate">
                        {lightbox + 1} / {draft.photos.length} · {draft.photos[lightbox].name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLightbox(null)}
                        aria-label="Tutup"
                        className="p-2 rounded-lg hover:bg-white/10 transition shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div
                      className="flex-1 min-h-0 flex items-center justify-center gap-2 px-2 pb-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {draft.photos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLightbox((lightbox - 1 + draft.photos.length) % draft.photos.length)}
                          aria-label="Foto sebelumnya"
                          className="p-2 rounded-full text-white hover:bg-white/10 transition shrink-0"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                      )}
                      {signedFoto[draft.photos[lightbox].id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={signedFoto[draft.photos[lightbox].id]}
                          alt={draft.photos[lightbox].name}
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      ) : (
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                      )}
                      {draft.photos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLightbox((lightbox + 1) % draft.photos.length)}
                          aria-label="Foto berikutnya"
                          className="p-2 rounded-full text-white hover:bg-white/10 transition shrink-0"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {/* Konfirmasi hapus — hapus permanen, tak bisa dikembalikan */}
                {confirmHapusId !== null && (() => {
                  const target = draft.photos.find((p) => p.id === confirmHapusId);
                  if (!target) return null;
                  const deleting = deletingFotoId === confirmHapusId;
                  return (
                    <div
                      role="alertdialog"
                      aria-modal="true"
                      aria-label="Konfirmasi hapus foto"
                      className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4"
                      onClick={() => { if (!deleting) setConfirmHapusId(null); }}
                    >
                      <div
                        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="font-bold text-slate-800 text-sm">Hapus foto ini?</h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          <span className="font-medium text-slate-700 break-all">{target.name}</span> akan
                          dihapus permanen dan tidak bisa dikembalikan.
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => setConfirmHapusId(null)}
                            disabled={deleting}
                            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => hapusFoto(target.id)}
                            disabled={deleting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-60"
                          >
                            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {deleting ? 'Menghapus…' : 'Hapus'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ============ TAB AP ============ */}
        {mainTab === 'ap' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                ['kondisi', 'Kondisi'],
                ['diagnosa', 'Asesmen — Diagnosa'],
                ['tindakan', 'Plan — Tindakan'],
                ['alkes', 'Plan — Pemakaian Alkes'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setApTab(key)} className={subTabCls(apTab === key)}>{label}</button>
              ))}
            </div>

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
                        onClick={() => hapusDraftItem('kondisi', k.id, `Gigi ${k.toothNumber ?? '-'} — ${k.deskripsi || 'tanpa deskripsi'}`)}
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
                            onClick={() => hapusDraftItem('kondisi', k.id, `Gigi ${k.toothNumber ?? '-'} — ${k.deskripsi || 'tanpa deskripsi'}`)}
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
                    <label className={labelCls}>No. Gigi (FDI) *</label>
                    <input
                      value={newKondisi.toothNumber ?? ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                        setNewKondisi({ ...newKondisi, toothNumber: digits ? Number(digits) : null });
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="26"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className={labelCls}>Deskripsi *</label>
                    <input maxLength={TEXT_LIMITS.deskripsi} value={newKondisi.deskripsi} onChange={(e) => setNewKondisi({ ...newKondisi, deskripsi: e.target.value })} className={inputCls} />
                  </div>
                  <button
                    onClick={() => {
                      if (!newKondisi.deskripsi.trim()) {
                        toast('Deskripsi kondisi wajib diisi.');
                        return;
                      }
                      if (newKondisi.toothNumber == null) {
                        toast('Nomor gigi (FDI) wajib diisi, contoh 26.');
                        return;
                      }
                      const tErr = toothError(String(newKondisi.toothNumber));
                      if (tErr) {
                        toast(tErr);
                        return;
                      }
                      setDraft({ ...draft, kondisi: [...draft.kondisi, { ...newKondisi, deskripsi: newKondisi.deskripsi.trim(), id: `kd-${Date.now()}` }] });
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
                {/* Mobile: daftar diagnosa */}
                <div className="md:hidden space-y-3">
                  {draft.diagnosa.map((d) => (
                    <div key={d.id} className="rounded-xl border border-slate-200 p-3.5 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-teal-700">{d.icd10Code}</span>
                        </div>
                        <div className="text-sm text-slate-700 mt-1">{d.icd10Desc}</div>
                      </div>
                      <button
                        onClick={() => hapusDraftItem('diagnosa', d.id, `${d.icd10Code} — ${d.icd10Desc || 'tanpa deskripsi'}`)}
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
                      <th className="px-4 py-2.5 font-semibold">Kode ICD-10</th>
                      <th className="px-4 py-2.5 font-semibold">Diagnosa</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {draft.diagnosa.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-2.5 font-mono text-xs text-teal-700">{d.icd10Code}</td>
                        <td className="px-4 py-2.5 text-slate-700">{d.icd10Desc}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => hapusDraftItem('diagnosa', d.id, `${d.icd10Code} — ${d.icd10Desc || 'tanpa deskripsi'}`)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {draft.diagnosa.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-xs text-slate-400">Data diagnosa belum tersedia. Tambahkan di bawah.</td></tr>
                    )}
                  </tbody>
                </table></div>
                <div className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-4">
                  <div className="flex-1 min-w-56">
                    <label className={labelCls}>ICD-10 (dari API)</label>
                    <IcdCombobox
                      value={newDiag.icd10Code}
                      onChange={(code, item) => setNewDiag({ ...newDiag, icd10Code: code, icd10Desc: item?.desc ?? '' })}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newDiag.icd10Code) {
                        toast('Pilih kode ICD-10 dulu.');
                        return;
                      }
                      if (draft.diagnosa.some((d) => d.icd10Code === newDiag.icd10Code)) {
                        toast('Diagnosa tersebut sudah ada di daftar.');
                        return;
                      }
                      setDraft({ ...draft, diagnosa: [...draft.diagnosa, { ...newDiag, type: 'Diagnosa dokter', id: `dg-${Date.now()}` }] });
                      setNewDiag({ id: '', type: 'Diagnosa dokter', icd10Code: '', icd10Desc: '' });
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
                          onClick={() => hapusDraftItem('tindakan', t.id, `${t.name || t.code} (×${t.qty})`)}
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
                          <button onClick={() => hapusDraftItem('tindakan', t.id, `${t.name || t.code} (×${t.qty})`)} className="text-rose-500 hover:text-rose-700">
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

                <div className="grid grid-cols-2 md:grid-cols-[1fr_7rem_6rem_auto] gap-2.5 md:gap-3 items-end border-t border-slate-100 pt-4">
                  <div className="col-span-2 md:col-span-1 min-w-0">
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
                  <div className="min-w-0">
                    <label className={labelCls}>Posisi Gigi</label>
                    <input
                      value={newTindakan.tooth}
                      onChange={(e) => setNewTindakan({ ...newTindakan, tooth: e.target.value.toUpperCase().replace(/[^0-9-]/g, '').slice(0, 2) })}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="- / 26"
                      aria-invalid={!!toothError(newTindakan.tooth, { allowDash: true })}
                      className={`${inputCls} ${toothError(newTindakan.tooth, { allowDash: true }) ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40' : ''}`}
                    />
                    {toothError(newTindakan.tooth, { allowDash: true }) && (
                      <p className="text-[11px] text-rose-600 mt-1 leading-tight">FDI 11–48 / “-”</p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <label className={labelCls}>Jml</label>
                    <input
                      value={newTindakan.qty}
                      onChange={(e) => {
                        const digits = sanitizeInt(e.target.value);
                        setNewTindakan({ ...newTindakan, qty: digits ? Math.min(999, Number(digits)) : 1 });
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      aria-invalid={!!qtyError(newTindakan.qty, 'Jumlah tindakan')}
                      className={`${inputCls} ${qtyError(newTindakan.qty, 'Jumlah tindakan') ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40' : ''}`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const tErr = toothError(newTindakan.tooth, { allowDash: true });
                      if (tErr) {
                        toast(`Posisi gigi: ${tErr} (isi "-" bila bukan gigi spesifik).`);
                        return;
                      }
                      const qErr = qtyError(newTindakan.qty, 'Jumlah tindakan');
                      if (qErr) {
                        toast(qErr);
                        return;
                      }
                      if (!newTindakan.name) {
                        toast('Pilih tindakan dari master dulu.');
                        return;
                      }
                      setDraft({ ...draft, tindakan: [...draft.tindakan, { ...newTindakan, id: `tn-${Date.now()}` }] });
                    }}
                    className="col-span-2 md:col-span-1 inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap"
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
                          onClick={() => hapusDraftItem('alkes', a.id, `${a.name || a.code} (×${a.qty})`)}
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
                          <button onClick={() => hapusDraftItem('alkes', a.id, `${a.name || a.code} (×${a.qty})`)} className="text-rose-500 hover:text-rose-700">
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
                <div className="grid grid-cols-[6rem_1fr] md:grid-cols-[1fr_6rem_auto] gap-2.5 md:gap-3 items-end border-t border-slate-100 pt-4">
                  <div className="col-span-2 md:col-span-1 min-w-0">
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
                  <div className="min-w-0">
                    <label className={labelCls}>Jml</label>
                    <input
                      value={newAlkes.qty}
                      onChange={(e) => {
                        const digits = sanitizeInt(e.target.value);
                        setNewAlkes({ ...newAlkes, qty: digits ? Math.min(999, Number(digits)) : 1 });
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      aria-invalid={!!qtyError(newAlkes.qty, 'Jumlah alkes')}
                      className={`${inputCls} ${qtyError(newAlkes.qty, 'Jumlah alkes') ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40' : ''}`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const qErr = qtyError(newAlkes.qty, 'Jumlah alkes');
                      if (qErr) {
                        toast(qErr);
                        return;
                      }
                      if (!newAlkes.name) {
                        toast('Pilih alkes dari master dulu.');
                        return;
                      }
                      setDraft({ ...draft, alkes: [...draft.alkes, { ...newAlkes, id: `al-${Date.now()}` }] });
                    }}
                    className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap"
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
                          onClick={() => hapusResep(isApotek, ri)}
                          aria-label={`Hapus Resep ${ri + 1}`}
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
                                onClick={() => hapusResepItem(isApotek, ri, it.id, it.name)}
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
                                  onClick={() => hapusResepItem(isApotek, ri, it.id, it.name)}
                                  aria-label="Hapus item resep"
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

      </main>

      {/* Modal ubah data diri pasien (komponen bersama) */}
      {dialogHapus}
      <EditPatientModal
        patient={editPatientOpen ? (patient ?? null) : null}
        onClose={() => setEditPatientOpen(false)}
        onSaved={() => {
          mutateGlobal((key) => typeof key === 'string' && key.includes(STRAPI_ENDPOINTS.registrations));
        }}
      />
    </>
  );
}
