/**
 * Aturan validasi field Rekam Medis — sesuai ketentuan pencatatan medis:
 * - Tanda vital: angka saja + rentang fisiologis wajar (Permenkes 269/2008
 *   mewajibkan pemeriksaan fisik tercatat dengan benar).
 * - Anamnesa: keluhan utama wajib (identitas keluhan = inti RM).
 * - Gigi: notasi FDI dua digit (11–18, 21–28, 31–38, 41–48).
 * - Gravida: format obstetri G_P_A_ (contoh G2P1A0).
 */

export interface VitalRule {
  key: 'nadi' | 'tensiSistolik' | 'tensiDiastolik' | 'suhu' | 'beratBadan' | 'tinggiBadan' | 'pernapasan';
  label: string;
  unit: string;
  min: number;
  max: number;
  /** Jumlah desimal yang diizinkan (0 = bilangan bulat). */
  decimals: number;
}

export const VITAL_RULES: VitalRule[] = [
  { key: 'nadi', label: 'Nadi', unit: 'x/menit', min: 20, max: 300, decimals: 0 },
  { key: 'tensiSistolik', label: 'Tensi sistolik', unit: 'mmHg', min: 50, max: 350, decimals: 0 },
  { key: 'tensiDiastolik', label: 'Tensi diastolik', unit: 'mmHg', min: 20, max: 250, decimals: 0 },
  { key: 'suhu', label: 'Suhu', unit: '°C', min: 25, max: 46, decimals: 1 },
  { key: 'beratBadan', label: 'Berat badan', unit: 'kg', min: 1, max: 500, decimals: 1 },
  { key: 'tinggiBadan', label: 'Tinggi badan', unit: 'cm', min: 20, max: 300, decimals: 0 },
  { key: 'pernapasan', label: 'Pernapasan', unit: 'x/menit', min: 4, max: 100, decimals: 0 },
];

export const vitalRuleOf = (key: string): VitalRule | undefined =>
  VITAL_RULES.find((r) => r.key === key);

/**
 * Bersihkan ketikan menjadi angka saja: buang huruf/simbol, normalisasi
 * koma jadi titik, maksimal 1 titik desimal + batasi digit desimal.
 * Kosong tetap kosong (field vital boleh dikosongkan bila tidak diukur).
 */
export function sanitizeNumeric(raw: string, decimals: number): string {
  let s = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  if (decimals === 0) return s.replace(/\./g, '').slice(0, 5);
  const [int, dec = ''] = s.split('.');
  return `${int.slice(0, 5)}${s.includes('.') ? `.${dec.slice(0, decimals)}` : ''}`;
}

/** Sanitasi bilangan bulat untuk qty (min. 1 digit, tanpa desimal). */
export function sanitizeInt(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, 4);
}

/**
 * Validasi satu nilai vital. Mengembalikan pesan salah (Indonesia) atau
 * null bila kosong/valid. Kosong = tidak diukur = boleh.
 */
export function vitalError(rule: VitalRule, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${rule.label} harus berupa angka.`;
  if (decimalsOf(n) > rule.decimals) {
    return `${rule.label} maksimal ${rule.decimals} angka di belakang koma.`;
  }
  if (n < rule.min || n > rule.max) {
    return `${rule.label} harus ${rule.min}–${rule.max} ${rule.unit}.`;
  }
  return null;
}

function decimalsOf(n: number): number {
  const s = String(n);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

/** Sistolik harus lebih besar dari diastolik (bila keduanya diisi). */
export function tensiPairError(sistolik: string, diastolik: string): string | null {
  if (!sistolik.trim() || !diastolik.trim()) return null;
  const s = Number(sistolik);
  const d = Number(diastolik);
  if (Number.isFinite(s) && Number.isFinite(d) && s <= d) {
    return 'Tensi sistolik harus lebih besar dari diastolik.';
  }
  return null;
}

/** Notasi gigi FDI: 11–18, 21–28, 31–38, 41–48. */
export function isFdiTooth(n: number): boolean {
  const q = Math.floor(n / 10);
  const t = n % 10;
  return q >= 1 && q <= 4 && t >= 1 && t <= 8;
}

export function toothError(value: string, opts: { allowDash?: boolean } = {}): string | null {
  const v = value.trim();
  if (!v) return 'Nomor gigi wajib diisi.';
  if (opts.allowDash && v === '-') return null;
  if (!/^\d+$/.test(v)) return 'Nomor gigi memakai notasi FDI (mis. 26).';
  const n = Number(v);
  if (!isFdiTooth(n)) return 'Nomor gigi FDI 11–18, 21–28, 31–38, 41–48.';
  return null;
}

/** Format obstetri G_P_A_ — contoh: G2P1A0. */
export function gravidaError(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (!v) return null;
  if (!/^G\d+P\d+A\d+$/.test(v)) return 'Format gravida: G_P_A_ (contoh G2P1A0).';
  return null;
}

/** Qty tindakan/alkes: bilangan bulat 1–999. */
export function qtyError(value: number, label = 'Jumlah'): string | null {
  if (!Number.isInteger(value) || value < 1) return `${label} minimal 1.`;
  if (value > 999) return `${label} maksimal 999.`;
  return null;
}

/** Batas panjang teks bebas agar catatan tetap ringkas & konsisten. */
export const TEXT_LIMITS = {
  textarea: 1000,
  input: 200,
  short: 100,
  deskripsi: 500,
} as const;
