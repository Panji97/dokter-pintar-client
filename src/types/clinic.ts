export type ToothSurface = 'center' | 'top' | 'bottom' | 'left' | 'right';

export type ToothCondition =
  | 'healthy'
  | 'caries'
  | 'filling_composite'
  | 'filling_amalgam'
  | 'crown'
  | 'missing'
  | 'impacted'
  | 'radix'
  | 'rct'; // root canal treatment

export interface ToothState {
  toothNumber: number;
  condition: ToothCondition;
  surfaces?: Partial<Record<ToothSurface, ToothCondition>>;
  notes?: string;
}

export type OdontogramMap = Record<number, ToothState>;

/**
 * CATATAN: Entitas tidak lagi membawa nomor custom (No. RM, No. Registrasi, dll).
 * ID/numbering dokumen akan diberikan oleh backend (Strapi 5) sebagai default.
 */
export interface Patient {
  id: string;
  nik: string;
  name: string;
  title?: string;
  birthDate: string;
  gender: 'L' | 'P';
  phone: string;
  address: string;
  bloodType: 'A' | 'B' | 'AB' | 'O' | '-';
  allergies: string[];
  registeredAt: string;
}

export type PatientGroup = 'Umum' | 'BPJS Kesehatan' | 'Asuransi Swasta' | 'Member';

export interface Registration {
  id: string;
  regDate: string; // ISO datetime
  patientId: string;
  patientName: string;
  group: PatientGroup;
  serviceType: string; // e.g. "Pelayanan Dokter Gigi Umum"
  room: string;
  doctor: string;
  /** 'Registrasi' = belum ada rekam medis, 'Proses' = sudah ada EMR, 'Selesai' = sudah bayar */
  status: 'Registrasi' | 'Proses' | 'Selesai';
}

/* ============ BOOKING ============ */
export type BookingStatus = 'Menunggu Konfirmasi' | 'Terjadwal' | 'Selesai' | 'Dibatalkan';

export interface Booking {
  id: string;
  patientName: string;
  /** documentId pasien — diisi bila booking terhubung ke data pasien terdaftar. */
  patientId?: string;
  phone: string;
  serviceType: string;
  doctor: string;
  date: string; // ISO date
  time: string;
  status: BookingStatus;
  source: 'HelloDokterPintar' | 'BPJS' | 'Manual';
  createdAt: string;
}

/* ============ EMR (Rekam Medis detail) ============ */
export interface AllergyNote {
  gatal: string;
  debu: string;
  obat: string;
  makanan: string;
  lainnya: string;
  udara: string;
}

export interface AnamnesaUmum {
  riwayatPenyakit: string;
  keluhanUtama: string;
  keluhanTambahan: string;
  penyakitSaatIni: string;
  gravida: string;
  alergi: AllergyNote;
}

export interface AnamnesaOdontogram {
  occlusi: string;
  torusPlatinus: string;
  torusMandibularis: string;
  palatum: string;
  diastema: string;
  gigiAnomali: string;
  lainLain: string;
}

export interface PemeriksaanUmum {
  deskripsi: string;
  nadi: string;
  tensiSistolik: string;
  tensiDiastolik: string;
  suhu: string;
  beratBadan: string;
  tinggiBadan: string;
  pernapasan: string;
  mata: string;
  gigiMulut: string;
  kulit: string;
}

export interface KondisiGigi {
  id: string;
  toothNumber: number | null;
  deskripsi: string;
}

export interface DiagnosaItem {
  id: string;
  type: 'Diagnosa dokter' | 'Asuhan keperawatan';
  icd10Code: string;
  icd10Desc: string;
}

/** Master ICD dari API `GET /api/ms-icds` (pengganti daftar hardcode). */
export interface IcdItem {
  id: string;
  code: string;
  desc: string;
  category: 'ICD-10' | 'ICD-9';
}

export interface TindakanItem {
  id: string;
  code: string; // kode pelayanan e.g. PK0053
  name: string;
  tooth: string; // posisi gigi, bisa "-"
  qty: number;
  price: number;
  discount: number;
}

export interface AlkesItem {
  id: string;
  code: string;
  name: string;
  qty: number;
  price: number;
}

export interface ResepApotek {
  items: { id: string; code: string; name: string; qty: number; price: number }[];
  date?: string;
}

export interface EmrDocument {
  regId: string;
  anamnesaUmum: AnamnesaUmum;
  anamnesaOdontogram: AnamnesaOdontogram;
  pemeriksaanUmum: PemeriksaanUmum;
  kondisi: KondisiGigi[];
  odontogram: OdontogramMap;
  diagnosa: DiagnosaItem[];
  tindakan: TindakanItem[];
  alkes: AlkesItem[];
  resepApotek: ResepApotek[];
  resepRujukan: ResepApotek[];
  /** Dokumen medis yang sudah diisi */
  dokumen: {
    generalConsent: boolean;
    asesmenAwal: boolean;
    informedConsent: boolean;
    asesmenPraTindakan: boolean;
    surgicalSafety: boolean;
  };
  photoCount: number;
}

/* ============ BILLING ============ */
export interface Invoice {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  date: string;
  group: PatientGroup;
  doctor: string;
  consultationFee: number;
  procedureFee: number;
  alkesFee: number;
  medicineFee: number;
  discount: number;
  total: number;
  paymentMethod?: 'Tunai' | 'QRIS' | 'Debit' | 'Transfer' | 'BPJS';
  paymentStatus: 'Belum Dibayar' | 'Lunas';
  paidAt?: string;
}

export interface ApotekInvoice {
  id: string;
  /** documentId pasien — diisi bila pembeli cocok dengan pasien terdaftar (obat bebas bisa tanpa relasi). */
  patientId?: string;
  date: string;
  type: 'Obat Bebas' | 'Obat Resep';
  patientName: string;
  items: { id: string; name: string; qty: number; price: number }[];
  total: number;
  paymentStatus: 'Belum Dibayar' | 'Lunas';
}

export interface InsuranceClaim {
  id: string;
  patientName: string;
  /** documentId pasien — relasi ke data pasien terdaftar. */
  patientId?: string;
  penjamin: PatientGroup;
  amount: number;
  status: 'Diajukan' | 'Diproses' | 'Dibayar' | 'Ditolak';
  date: string;
}

/* ============ SURAT & RUJUKAN ============ */
export type LetterKind =
  | 'Surat Sakit'
  | 'Surat Sehat'
  | 'Surat Keterangan'
  | 'Surat Kontrol'
  | 'Surat Kematian';

export interface Letter {
  id: string;
  kind: LetterKind;
  patientName: string;
  /** documentId pasien — relasi ke data pasien terdaftar. */
  patientId?: string;
  doctor: string;
  date: string;
  notes: string;
}

export interface Referral {
  id: string;
  kind: 'Rujukan Internal' | 'Rujukan ke Fasilitas Lain';
  patientName: string;
  /** documentId pasien — relasi ke data pasien terdaftar. */
  patientId?: string;
  doctor: string;
  destination: string;
  diagnosis: string;
  date: string;
}

/* ============ FARMASI ============ */
export interface Medicine {
  id: string;
  code: string;
  name: string;
  category: 'Antibiotik' | 'Analgesik' | 'Anastesi' | 'BHP Gigi' | 'Vitamin' | 'Lainnya' | 'Alkes';
  form?: string;
  unit: 'Tablet' | 'Kapsul' | 'Botol' | 'Ampul' | 'Pcs' | 'Strip' | 'Buah';
  stock: number;
  minStock: number;
  price: number;
  batchNumber: string;
  expiryDate: string;
  supplier?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface Factory {
  id: string;
  code: string;
  name: string;
}

export interface Brand {
  id: string;
  code: string;
  name: string;
}

export interface Penerimaan {
  id: string;
  date: string;
  supplier: string;
  faktur: string;
  items: { id: string; code: string; name: string; qty: number; price: number; batch: string; expiry: string }[];
}

export interface Pengeluaran {
  id: string;
  date: string;
  room: string;
  code: string;
  name: string;
  unit: string;
  qty: number;
}

export interface Penyesuaian {
  id: string;
  nota: string;
  date: string;
  pic: string;
  items: { id: string; code: string; name: string; stockBefore: number; stockAfter: number; reason: string }[];
}

export interface Retur {
  id: string;
  date: string;
  type: 'Retur Pengeluaran' | 'Retur Penerimaan';
  items: { id: string; code: string; name: string; qty: number; reason: string }[];
}

/* ============ SETTINGS ============ */
export interface PatientGroupItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface Room {
  id: string;
  name: string;
  satusehat?: boolean;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  price: number;
  room: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
  price: number;
  patientName: string;
}

export interface ServiceDiscount {
  id: string;
  name: string;
  percent: number;
  appliesTo: string;
  active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Dokter Gigi' | 'Dokter Umum' | 'Perawat' | 'Apoteker' | 'Kasir' | 'Admin';
  room: string;
  sip?: string;
  active: boolean;
}

export interface StaffSchedule {
  id: string;
  staffName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}
