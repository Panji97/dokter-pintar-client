'use client';

import { useEffect, useState } from 'react';
import { X, Pencil, UserRound } from 'lucide-react';
import { useClinicStore } from '@/lib/ClinicStore';
import { useOptionGroup } from '@/lib/useOptions';
import { useShell } from '@/components/layout/AppShell';
import type { Patient } from '@/types/clinic';

interface EditPatientModalProps {
  /** Pasien yang diubah; null = modal tertutup. */
  patient: Patient | null;
  onClose: () => void;
  /** Dipanggil setelah tersimpan (untuk mutate ulang di halaman pemanggil). */
  onSaved?: () => void;
}

const inputCls =
  'w-full px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl outline-none bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-500/20 transition placeholder:text-slate-400 dark:placeholder:text-slate-500';
const labelCls = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5';

/** Hitung umur (tahun/bulan/hari) dari tanggal lahir — sama persis form Pendaftaran. */
function calcAge(birthDate: string, refDate: string) {
  if (!birthDate || !refDate) return null;
  const b = new Date(birthDate);
  const r = new Date(refDate);
  if (Number.isNaN(b.getTime()) || Number.isNaN(r.getTime()) || b > r)
    return null;
  let y = r.getFullYear() - b.getFullYear();
  let m = r.getMonth() - b.getMonth();
  let d = r.getDate() - b.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(r.getFullYear(), r.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

/** Geser tanggal acuan mundur Y tahun, M bulan, D hari → string yyyy-mm-dd. */
function shiftDate(refDate: string, y: number, m: number, d: number) {
  const r = new Date(refDate);
  const dt = new Date(r.getFullYear(), r.getMonth(), r.getDate());
  dt.setFullYear(dt.getFullYear() - y);
  dt.setMonth(dt.getMonth() - m);
  dt.setDate(dt.getDate() - d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** Tanggal lokal hari ini YYYY-MM-DD (acuan umur). */
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function initialsOf(name: string): string {
  const init = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return init || '?';
}

/**
 * Modal ubah data diri pasien — dipakai di Pendaftaran & pengisian Rekam Medis.
 * Isi field SAMA PERSIS dengan bagian Informasi Pribadi di form pasien baru
 * (Title, Nama Lengkap, Jenis Kelamin, Tgl. Lahir, Umur, Alamat Lengkap, NIK).
 * Mobile tampil sebagai bottom-sheet, desktop sebagai dialog tengah.
 */
export function EditPatientModal({ patient, onClose, onSaved }: EditPatientModalProps) {
  // Tutup dengan Escape.
  useEffect(() => {
    if (!patient) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [patient, onClose]);

  if (!patient) return null;

  // key = form state diinisialisasi fresh tiap pasien (tanpa setState dalam effect).
  return <EditPatientForm key={patient.id} patient={patient} onClose={onClose} onSaved={onSaved} />;
}

function EditPatientForm({
  patient,
  onClose,
  onSaved,
}: {
  patient: Patient;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { updatePatient, syncPatientName } = useClinicStore();
  const { toast } = useShell();
  const { items: titleOptions, isLoading: loadingTitles } = useOptionGroup('title');
  const { items: genderOptions, isLoading: loadingGenders } = useOptionGroup('gender');

  const [form, setForm] = useState<{
    title: string;
    name: string;
    gender: 'L' | 'P' | '';
    birthDate: string;
    address: string;
    nik: string;
  }>({
    title: patient.title || '',
    name: patient.name || '',
    gender: patient.gender || '',
    birthDate: (patient.birthDate || '').slice(0, 10),
    address: patient.address || '',
    nik: patient.nik === '-' ? '' : patient.nik || '',
  });
  const [saving, setSaving] = useState(false);

  const age = calcAge(form.birthDate, todayLocal());

  /** Ubah salah satu kotak umur → Tgl. Lahir ikut bergeser (two-way binding). */
  const setUmurPart = (part: 'y' | 'm' | 'd', raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return;
    const cur = age ?? { y: 0, m: 0, d: 0 };
    const next = { y: cur.y, m: cur.m, d: cur.d, [part]: n };
    setForm({
      ...form,
      birthDate: shiftDate(todayLocal(), next.y, next.m, next.d),
    });
  };

  const genderLabel = genderOptions.find((o) => o.value === form.gender)?.label;

  const submit = async () => {
    if (!form.name.trim()) {
      toast('Nama pasien wajib diisi.');
      return;
    }
    if (!form.gender) {
      toast('Jenis kelamin wajib dipilih.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updatePatient(patient.id, {
        title: form.title || '',
        name: form.name.trim(),
        gender: form.gender as 'L' | 'P',
        birthDate: form.birthDate || '',
        address: form.address.trim(),
        nik: form.nik.trim() || '-',
      });
      // Nama di baris pendaftaran ikut disamakan (kolom denormalisasi).
      await syncPatientName(patient.id, updated.name).catch(() => null);
      toast(`Data ${updated.name} berhasil diperbarui.`);
      onSaved?.();
      onClose();
    } catch (err) {
      toast(`Gagal menyimpan: ${err instanceof Error ? err.message : 'periksa koneksi internet'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ubah data pasien"
    >
      <div
        className="absolute inset-0 bg-slate-950/50 dark:bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden">
        {/* Gagang bottom-sheet (khusus mobile) */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        {/* Kepala: avatar + judul */}
        <div className="flex items-start gap-3.5 px-5 pt-2 sm:pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 dark:from-teal-500 dark:to-teal-700 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-md shadow-teal-600/25">
            {form.name ? initialsOf(form.name) : <UserRound className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight">Ubah Data Pasien</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
              {patient.nik && patient.nik !== '-' ? `NIK ${patient.nik}` : 'Data diri pasien'}
              {genderLabel ? ` · ${genderLabel}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Isi — cermin bagian Informasi Pribadi form pasien */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3">
              <label className={labelCls}>Title</label>
              <select
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={loadingTitles && titleOptions.length === 0}
                className={inputCls}
              >
                <option value="">
                  {loadingTitles && titleOptions.length === 0 ? 'Memuat...' : 'Pilih...'}
                </option>
                {titleOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-6">
              <label className={labelCls}>
                Nama Lengkap <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="off"
                className={`${inputCls} font-medium`}
              />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>
                Jenis Kelamin <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'L' | 'P' | '' })}
                disabled={loadingGenders && genderOptions.length === 0}
                className={inputCls}
              >
                <option value="">
                  {loadingGenders && genderOptions.length === 0 ? 'Memuat...' : 'Pilih...'}
                </option>
                {genderOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className={labelCls}>
                Tgl. Lahir
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Umur</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['y', 'Th'],
                    ['m', 'Bln'],
                    ['d', 'Hr'],
                  ] as const
                ).map(([part, suffix]) => (
                  <div key={part} className="flex items-center gap-1">
                    <input
                      inputMode="numeric"
                      value={age ? age[part] : ''}
                      placeholder="0"
                      autoComplete="off"
                      onChange={(e) => setUmurPart(part, e.target.value)}
                      className={inputCls}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      {suffix}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>
                Alamat Lengkap
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                autoComplete="off"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>NIK</label>
              <input
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                autoComplete="off"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Kaki menempel */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-700 rounded-xl transition"
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-[2] sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-md shadow-teal-600/25 transition disabled:opacity-60"
          >
            <Pencil className="w-4 h-4" />
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}
