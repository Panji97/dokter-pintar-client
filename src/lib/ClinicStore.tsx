'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Registration, Booking, EmrDocument, AnamnesaUmum, AnamnesaOdontogram, PemeriksaanUmum,
  KondisiGigi, DiagnosaItem, TindakanItem, AlkesItem, OdontogramMap, ToothState,
  ToothCondition, ResepApotek, Invoice, Patient, Letter, Referral, Medicine,
  ApotekInvoice, InsuranceClaim, Room, Service, ServicePackage, ServiceDiscount, Staff,
  StaffSchedule, Supplier, Factory, Brand, Penerimaan, Pengeluaran, Penyesuaian, Retur,
  PatientGroupItem,
} from '@/types/clinic';
import { STRAPI_ENDPOINTS } from './strapi-endpoints';
import { getLocalStorage } from './storage';
import { logout, getSession } from './auth';
import { STRAPI_SESSION_EVENT } from './strapi';

/**
 * ClinicStore — SELURUH data langsung dari Strapi API (tanpa cache storage).
 * - Baca: selalu fetch fresh dari server, disekat per faskes
 *   (pola tenant HRIS: user.company/client).
 * - Tulis: POST/PUT/DELETE langsung ke database, state memori diperbarui
 *   dari respons server.
 * - Auth (JWT/sesi user) tetap di localStorage — itu kredensial, bukan data.
 */

const apiBase = () => process.env.NEXT_PUBLIC_STRAPI_URL ?? '';

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const jwt = getLocalStorage('jwt');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
  const res = await fetch(apiBase() + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null as T;
  const json = await res.json();
  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string } })?.error?.message ||
      `Permintaan gagal (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}

interface StrapiEntity {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface StrapiList {
  data: StrapiEntity[];
  meta?: { pagination?: { pageCount?: number } };
}

/** Strapi entity -> model faskes (`id` = documentId). */
function toModel<T>(e: StrapiEntity): T {
  const { id, documentId, updatedAt, publishedAt: _p, ...rest } = e as StrapiEntity & {
    publishedAt?: unknown;
  };
  void id;
  void _p;
  void updatedAt;
  return { ...rest, id: documentId } as unknown as T;
}

/** documentId faskes milik user yang login. Wajib ada untuk semua baca/tulis. */
function currentFaskesId(): string {
  const sess = getSession();
  if (sess?.faskes?.documentId) return sess.faskes.documentId;
  try {
    const raw = getLocalStorage('user');
    if (raw) {
      const u = JSON.parse(raw);
      const fk = Array.isArray(u.faskes) ? u.faskes[0] : u.faskes;
      const docId = fk?.documentId ?? fk?.document_id;
      if (docId) return docId;
    }
  } catch {
    /* abaikan */
  }
  throw new Error('Sesi tanpa faskes. Masuk ulang ke akun faskes Anda.');
}

function currentFaskesIdSafe(): string | null {
  try {
    return currentFaskesId();
  } catch {
    return null;
  }
}

async function fetchAll<T>(endpoint: string, sort: string, populate: string[] = []): Promise<T[]> {
  const faskesId = currentFaskesId();
  const out: T[] = [];
  let page = 1;
  for (;;) {
    const params = new URLSearchParams({
      'pagination[page]': String(page),
      'pagination[pageSize]': '100',
      sort,
      'filters[faskes][documentId][$eq]': faskesId,
    });
    for (const rel of populate) params.append(`populate[${rel}][fields][0]`, 'documentId');
    const res = await api<StrapiList>('GET', `${endpoint}?${params.toString()}`);
    out.push(...res.data.map(toModel<T>));
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page += 1;
  }
  return out;
}

/** Ambil documentId relasi hasil populate (objek) dengan fallback nilai string lama. */
function relDocId(v: unknown): string | null {
  if (v && typeof v === 'object' && typeof (v as { documentId?: unknown }).documentId === 'string') {
    return (v as { documentId: string }).documentId;
  }
  return null;
}

/** Semua nama pasien & dokter selalu huruf kapital (UPPERCASE). */
export const toUpperCase = (s: string) => s.toUpperCase();

/* ============================================================
 * Persistensi relasional (tanpa kolom JSON): tiap baris anak punya
 * tabel/endpoint sendiri, kolom skalar tersimpan per kolom.
 * Bentuk UI (EmrDocument, Penerimaan, ...) TIDAK berubah — yang
 * berubah hanya cara baca/tulis ke Strapi: dirakit/dipisah di sini.
 * ============================================================ */

/** Baris anak + documentId induknya (didapat via populate). */
type ChildRow<T> = T & { __parent: string | null };

/** Ambil semua baris anak se-faskes beserta documentId induknya. */
async function fetchChildren<T>(endpoint: string, parentAttr: string, sort = 'createdAt:ASC'): Promise<ChildRow<T>[]> {
  const faskesId = currentFaskesId();
  const out: ChildRow<T>[] = [];
  let page = 1;
  for (;;) {
    const params = new URLSearchParams({
      'pagination[page]': String(page),
      'pagination[pageSize]': '100',
      sort,
      'filters[faskes][documentId][$eq]': faskesId,
      [`populate[${parentAttr}][fields][0]`]: 'documentId',
    });
    const res = await api<StrapiList>('GET', `${endpoint}?${params.toString()}`);
    for (const e of res.data ?? []) {
      const parent = e[parentAttr] as { documentId?: string } | null | undefined;
      out.push({ ...toModel<T>(e), __parent: parent?.documentId ?? null });
    }
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page += 1;
  }
  return out;
}

/** Kelompokkan baris anak per documentId induk (buang penanda __parent). */
function groupKids<T>(rows: ChildRow<T>[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    if (!r.__parent) continue;
    const { __parent, ...rest } = r;
    void __parent;
    const arr = m.get(r.__parent) ?? [];
    arr.push(rest as T);
    m.set(r.__parent, arr);
  }
  return m;
}

/** Hapus semua baris anak milik satu induk (dipakai sebelum tulis ulang). */
async function clearChildren(endpoint: string, parentAttr: string, parentDocId: string) {
  const params = new URLSearchParams({
    'pagination[pageSize]': '100',
    [`filters[${parentAttr}][documentId][$eq]`]: parentDocId,
  });
  const res = await api<StrapiList>('GET', `${endpoint}?${params.toString()}`).catch(() => null);
  const rows = res?.data ?? [];
  await Promise.all(
    rows.map((e) => api('DELETE', `${endpoint}/${e.documentId}`).catch(() => null)),
  );
}

async function postRow(endpoint: string, data: Record<string, unknown>): Promise<string> {
  const res = await api<{ data: StrapiEntity }>('POST', endpoint, { data });
  return res.data.documentId;
}

/* ---------- Bentuk baris tiap tabel anak ---------- */

interface KondisiRow { id: string; toothNumber: number | null; deskripsi: string | null; }
interface OdontoRow {
  id: string; toothNumber: number; condition: string;
  surfaceTop: string | null; surfaceBottom: string | null; surfaceLeft: string | null;
  surfaceRight: string | null; surfaceCenter: string | null; notes: string | null;
}
interface DiagnosaRow { id: string; tipe: string | null; icd10Code: string | null; icd10Desc: string | null; }
interface TindakanRow { id: string; code: string | null; name: string | null; tooth: string | null; qty: number; price: number; discount: number; }
interface AlkesRow { id: string; code: string | null; name: string | null; qty: number; price: number; }
interface ResepRow { id: string; jenis: 'apotek' | 'rujukan'; urutan: number; }
interface ResepItemRow { id: string; code: string | null; name: string | null; qty: number; price: number; }
interface AllergyRow { id: string; alergen: string; keterangan: string | null; }
interface PenerimaanItemRow { id: string; code: string | null; name: string | null; qty: number; price: number; batch: string | null; expiry: string | null; }
interface PenyesuaianItemRow { id: string; code: string | null; name: string | null; stockBefore: number; stockAfter: number; reason: string | null; }
interface ReturItemRow { id: string; code: string | null; name: string | null; qty: number; reason: string | null; }
interface ApotekItemRow { id: string; code: string | null; name: string | null; qty: number; price: number; }

/** Kolom skalar emr-documents (tambah `id` = documentId). */
interface EmrDocScalars {
  id: string;
  regId: string;
  [key: string]: unknown;
}

const s = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

/** EmrDocument -> payload kolom skalar (tanpa relasi). */
function emrScalars(doc: EmrDocument): Record<string, unknown> {
  const a: AnamnesaUmum = doc.anamnesaUmum;
  const o: AnamnesaOdontogram = doc.anamnesaOdontogram;
  const p: PemeriksaanUmum = doc.pemeriksaanUmum;
  return {
    regId: doc.regId,
    riwayatPenyakit: a.riwayatPenyakit,
    keluhanUtama: a.keluhanUtama,
    keluhanTambahan: a.keluhanTambahan,
    penyakitSaatIni: a.penyakitSaatIni,
    gravida: a.gravida,
    alergiGatal: a.alergi.gatal,
    alergiDebu: a.alergi.debu,
    alergiObat: a.alergi.obat,
    alergiMakanan: a.alergi.makanan,
    alergiLainnya: a.alergi.lainnya,
    alergiUdara: a.alergi.udara,
    occlusi: o.occlusi,
    torusPlatinus: o.torusPlatinus,
    torusMandibularis: o.torusMandibularis,
    palatum: o.palatum,
    diastema: o.diastema,
    gigiAnomali: o.gigiAnomali,
    odontoLain: o.lainLain,
    deskripsiPemeriksaan: p.deskripsi,
    nadi: p.nadi,
    tensiSistolik: p.tensiSistolik,
    tensiDiastolik: p.tensiDiastolik,
    suhu: p.suhu,
    beratBadan: p.beratBadan,
    tinggiBadan: p.tinggiBadan,
    pernapasan: p.pernapasan,
    mata: p.mata,
    gigiMulut: p.gigiMulut,
    kulit: p.kulit,
    dokumenGeneralConsent: doc.dokumen.generalConsent,
    dokumenAsesmenAwal: doc.dokumen.asesmenAwal,
    dokumenInformedConsent: doc.dokumen.informedConsent,
    dokumenAsesmenPraTindakan: doc.dokumen.asesmenPraTindakan,
    dokumenSurgicalSafety: doc.dokumen.surgicalSafety,
    photoCount: doc.photoCount,
  };
}

interface EmrKids {
  kondisi: ChildRow<KondisiRow>[];
  odonto: ChildRow<OdontoRow>[];
  diagnosa: ChildRow<DiagnosaRow>[];
  tindakan: ChildRow<TindakanRow>[];
  alkes: ChildRow<AlkesRow>[];
  reseps: ChildRow<ResepRow>[];
  resepItems: ChildRow<ResepItemRow>[];
}

/** Rakit EmrDocument penuh dari kolom skalar + baris-baris anak. */
function assembleEmr(docs: EmrDocScalars[], kids: EmrKids): Record<string, EmrDocument> {
  const byKondisi = groupKids(kids.kondisi);
  const byOdonto = groupKids(kids.odonto);
  const byDiagnosa = groupKids(kids.diagnosa);
  const byTindakan = groupKids(kids.tindakan);
  const byAlkes = groupKids(kids.alkes);
  const byResep = groupKids(kids.reseps);
  const itemsByResep = groupKids(kids.resepItems);
  const emr: Record<string, EmrDocument> = {};
  for (const d of docs) {
    const reseps = (byResep.get(d.id) ?? []).sort((a, b) => a.urutan - b.urutan);
    const toResep = (jenis: 'apotek' | 'rujukan'): ResepApotek[] =>
      reseps
        .filter((r) => r.jenis === jenis)
        .map((r) => ({
          items: (itemsByResep.get(r.id) ?? []).map((it) => ({
            id: it.id,
            code: it.code ?? '',
            name: it.name ?? '',
            qty: it.qty ?? 0,
            price: it.price ?? 0,
          })),
        }));
    const odontogram: OdontogramMap = {};
    for (const g of byOdonto.get(d.id) ?? []) {
      const surfaces: ToothState['surfaces'] = {};
      if (g.surfaceTop) surfaces.top = g.surfaceTop as ToothCondition;
      if (g.surfaceBottom) surfaces.bottom = g.surfaceBottom as ToothCondition;
      if (g.surfaceLeft) surfaces.left = g.surfaceLeft as ToothCondition;
      if (g.surfaceRight) surfaces.right = g.surfaceRight as ToothCondition;
      if (g.surfaceCenter) surfaces.center = g.surfaceCenter as ToothCondition;
      odontogram[g.toothNumber] = {
        toothNumber: g.toothNumber,
        condition: (g.condition || 'healthy') as ToothCondition,
        ...(Object.keys(surfaces).length > 0 ? { surfaces } : {}),
        ...(g.notes ? { notes: g.notes } : {}),
      };
    }
    const doc: EmrDocument & { id: string } = {
      id: d.id,
      regId: d.regId,
      anamnesaUmum: {
        riwayatPenyakit: s(d.riwayatPenyakit),
        keluhanUtama: s(d.keluhanUtama),
        keluhanTambahan: s(d.keluhanTambahan),
        penyakitSaatIni: s(d.penyakitSaatIni),
        gravida: s(d.gravida),
        alergi: {
          gatal: s(d.alergiGatal),
          debu: s(d.alergiDebu),
          obat: s(d.alergiObat),
          makanan: s(d.alergiMakanan),
          lainnya: s(d.alergiLainnya),
          udara: s(d.alergiUdara),
        },
      },
      anamnesaOdontogram: {
        occlusi: s(d.occlusi),
        torusPlatinus: s(d.torusPlatinus),
        torusMandibularis: s(d.torusMandibularis),
        palatum: s(d.palatum),
        diastema: s(d.diastema),
        gigiAnomali: s(d.gigiAnomali),
        lainLain: s(d.odontoLain),
      },
      pemeriksaanUmum: {
        deskripsi: s(d.deskripsiPemeriksaan),
        nadi: s(d.nadi),
        tensiSistolik: s(d.tensiSistolik),
        tensiDiastolik: s(d.tensiDiastolik),
        suhu: s(d.suhu),
        beratBadan: s(d.beratBadan),
        tinggiBadan: s(d.tinggiBadan),
        pernapasan: s(d.pernapasan),
        mata: s(d.mata),
        gigiMulut: s(d.gigiMulut),
        kulit: s(d.kulit),
      },
      kondisi: (byKondisi.get(d.id) ?? []).map((k): KondisiGigi => ({
        id: k.id,
        toothNumber: k.toothNumber,
        deskripsi: k.deskripsi ?? '',
      })),
      odontogram,
      diagnosa: (byDiagnosa.get(d.id) ?? []).map((x): DiagnosaItem => ({
        id: x.id,
        type: (x.tipe === 'Asuhan keperawatan' ? 'Asuhan keperawatan' : 'Diagnosa dokter'),
        icd10Code: x.icd10Code ?? '',
        icd10Desc: x.icd10Desc ?? '',
      })),
      tindakan: (byTindakan.get(d.id) ?? []).map((x): TindakanItem => ({
        id: x.id,
        code: x.code ?? '',
        name: x.name ?? '',
        tooth: x.tooth ?? '-',
        qty: x.qty ?? 1,
        price: x.price ?? 0,
        discount: x.discount ?? 0,
      })),
      alkes: (byAlkes.get(d.id) ?? []).map((x): AlkesItem => ({
        id: x.id,
        code: x.code ?? '',
        name: x.name ?? '',
        qty: x.qty ?? 1,
        price: x.price ?? 0,
      })),
      resepApotek: toResep('apotek'),
      resepRujukan: toResep('rujukan'),
      dokumen: {
        generalConsent: d.dokumenGeneralConsent === true,
        asesmenAwal: d.dokumenAsesmenAwal === true,
        informedConsent: d.dokumenInformedConsent === true,
        asesmenPraTindakan: d.dokumenAsesmenPraTindakan === true,
        surgicalSafety: d.dokumenSurgicalSafety === true,
      },
      photoCount: typeof d.photoCount === 'number' ? d.photoCount : 0,
    };
    emr[d.regId] = doc;
  }
  return emr;
}

/** Tulis ulang seluruh baris anak satu dokumen EMR (hapus lama, buat baru). */
async function saveEmrChildren(docId: string, faskesId: string, doc: EmrDocument) {
  const E = STRAPI_ENDPOINTS;
  await Promise.all([
    clearChildren(E.emrKondisi, 'emr_document', docId),
    clearChildren(E.emrOdontogram, 'emr_document', docId),
    clearChildren(E.emrDiagnosa, 'emr_document', docId),
    clearChildren(E.emrTindakan, 'emr_document', docId),
    clearChildren(E.emrAlkes, 'emr_document', docId),
  ]);
  // Resep: hapus item tiap resep lama dulu (tanpa cascade), lalu resepnya.
  const oldReseps = await api<StrapiList>('GET',
    `${E.emrResep}?pagination[pageSize]=100&filters[emr_document][documentId][$eq]=${docId}`).catch(() => null);
  for (const r of oldReseps?.data ?? []) {
    await clearChildren(E.emrResepItem, 'resep', r.documentId);
    await api('DELETE', `${E.emrResep}/${r.documentId}`).catch(() => null);
  }
  // Buat baru — tiap tabel punya endpoint sendiri (tanpa JSON).
  for (const k of doc.kondisi) {
    await postRow(E.emrKondisi, {
      toothNumber: k.toothNumber, deskripsi: k.deskripsi, emr_document: docId, faskes: faskesId,
    });
  }
  for (const [num, t] of Object.entries(doc.odontogram)) {
    const surf = t.surfaces ?? {};
    await postRow(E.emrOdontogram, {
      toothNumber: Number(num),
      condition: t.condition,
      surfaceTop: surf.top ?? null,
      surfaceBottom: surf.bottom ?? null,
      surfaceLeft: surf.left ?? null,
      surfaceRight: surf.right ?? null,
      surfaceCenter: surf.center ?? null,
      notes: t.notes ?? null,
      emr_document: docId,
      faskes: faskesId,
    });
  }
  for (const x of doc.diagnosa) {
    await postRow(E.emrDiagnosa, {
      tipe: x.type, icd10Code: x.icd10Code, icd10Desc: x.icd10Desc, emr_document: docId, faskes: faskesId,
    });
  }
  for (const x of doc.tindakan) {
    await postRow(E.emrTindakan, {
      code: x.code, name: x.name, tooth: x.tooth, qty: x.qty, price: x.price, discount: x.discount,
      emr_document: docId, faskes: faskesId,
    });
  }
  for (const x of doc.alkes) {
    await postRow(E.emrAlkes, {
      code: x.code, name: x.name, qty: x.qty, price: x.price, emr_document: docId, faskes: faskesId,
    });
  }
  const resepGroups: Array<['apotek' | 'rujukan', ResepApotek[]]> = [
    ['apotek', doc.resepApotek],
    ['rujukan', doc.resepRujukan],
  ];
  for (const [jenis, list] of resepGroups) {
    for (let i = 0; i < list.length; i += 1) {
      const resepId = await postRow(E.emrResep, {
        jenis, urutan: i, emr_document: docId, faskes: faskesId,
      });
      for (const it of list[i].items) {
        await postRow(E.emrResepItem, {
          code: it.code, name: it.name, qty: it.qty, price: it.price, resep: resepId, faskes: faskesId,
        });
      }
    }
  }
}

interface ClinicState {
  patients: Patient[];
  registrations: Registration[];
  bookings: Booking[];
  emr: Record<string, EmrDocument>;
  invoices: Invoice[];
  apotekInvoices: ApotekInvoice[];
  claims: InsuranceClaim[];
  letters: Letter[];
  referrals: Referral[];
  medicines: Medicine[];
  suppliers: Supplier[];
  factories: Factory[];
  brands: Brand[];
  penerimaan: Penerimaan[];
  pengeluaran: Pengeluaran[];
  penyesuaian: Penyesuaian[];
  retur: Retur[];
  rooms: Room[];
  patientGroups: PatientGroupItem[];
  services: Service[];
  packages: ServicePackage[];
  discounts: ServiceDiscount[];
  staff: Staff[];
  schedules: StaffSchedule[];
}

const EMPTY_STATE: ClinicState = {
  patients: [],
  registrations: [],
  bookings: [],
  emr: {},
  invoices: [],
  apotekInvoices: [],
  claims: [],
  letters: [],
  referrals: [],
  medicines: [],
  suppliers: [],
  factories: [],
  brands: [],
  penerimaan: [],
  pengeluaran: [],
  penyesuaian: [],
  retur: [],
  rooms: [],
  patientGroups: [],
  services: [],
  packages: [],
  discounts: [],
  staff: [],
  schedules: [],
};

function blankEmr(regId: string): EmrDocument {
  return {
    regId,
    anamnesaUmum: { riwayatPenyakit: '', keluhanUtama: '', keluhanTambahan: '', penyakitSaatIni: '', gravida: '', alergi: { gatal: '', debu: '', obat: '', makanan: '', lainnya: '', udara: '' } },
    anamnesaOdontogram: { occlusi: '', torusPlatinus: '', torusMandibularis: '', palatum: '', diastema: '', gigiAnomali: '', lainLain: '' },
    pemeriksaanUmum: { deskripsi: '', nadi: '', tensiSistolik: '', tensiDiastolik: '', suhu: '', beratBadan: '', tinggiBadan: '', pernapasan: '', mata: '', gigiMulut: '', kulit: '' },
    kondisi: [],
    odontogram: {},
    diagnosa: [],
    tindakan: [],
    alkes: [],
    resepApotek: [],
    resepRujukan: [],
    dokumen: { generalConsent: false, asesmenAwal: false, informedConsent: false, asesmenPraTindakan: false, surgicalSafety: false },
    photoCount: 0,
  };
}

const stripId = <T extends { id?: string }>(o: T): Omit<T, 'id'> => {
  const { id, ...rest } = o;
  void id;
  return rest;
};

interface ClinicStoreContextValue {
  state: ClinicState;
  /** True selama memuat awal dari server. */
  loading: boolean;
  /** Muat ulang seluruh state dari server. */
  refresh: () => Promise<void>;
  /** Muat modul data tambahan secara on-demand (lazy load). */
  ensureModule: (mod: 'farmasi' | 'billing' | 'surat' | 'pengaturan' | 'emr' | 'all') => Promise<void>;
  /** Tambah registrasi baru (Pasien Baru atau Pasien Lama) */
  addRegistration: (reg: Omit<Registration, 'id' | 'status' | 'regDate'> & { regDate?: string }) => Promise<Registration>;
  addPatient: (p: Omit<Patient, 'id' | 'registeredAt'>) => Promise<Patient>;
  getOrCreateEmr: (regId: string) => EmrDocument;
  updateEmr: (regId: string, doc: EmrDocument) => Promise<void>;
  addInvoice: (inv: Omit<Invoice, 'id'>) => Promise<Invoice>;
  payInvoice: (id: string, method: NonNullable<Invoice['paymentMethod']>, discount: number) => Promise<void>;
  addApotekInvoice: (inv: Omit<ApotekInvoice, 'id'>) => Promise<ApotekInvoice>;
  addBooking: (bk: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  addLetter: (l: Omit<Letter, 'id'>) => Promise<Letter>;
  addReferral: (r: Omit<Referral, 'id'>) => Promise<Referral>;
  updateMedicineStock: (id: string, delta: number) => Promise<void>;
  addPenyesuaian: (adj: Omit<Penyesuaian, 'id'>) => Promise<Penyesuaian>;
  updateRoom: (room: Room) => Promise<void>;
  addRoom: (name: string) => Promise<Room>;
  removeRoom: (id: string) => Promise<void>;
  addStaff: (s: Omit<Staff, 'id'>) => Promise<Staff>;
  toggleStaffActive: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const ClinicStoreContext = createContext<ClinicStoreContextValue | null>(null);

// Dedup janji fetch yang sedang berjalan (hindari dobel request paralel).
const inflight = new Map<string, Promise<unknown>>();

async function loadCore(): Promise<Partial<ClinicState>> {
  const token = getLocalStorage('jwt');
  if (!token) return {};
  const E = STRAPI_ENDPOINTS;
  const [
    rooms,
    patientGroups,
    services,
    staff,
    registrationsRaw,
    patientsRaw,
    patientAllergyRows,
    invoicesRaw,
    medicines,
  ] = await Promise.all([
    fetchAll<Room>(E.rooms, 'createdAt:ASC').catch(() => []),
    fetchAll<PatientGroupItem>(E.patientGroups, 'createdAt:ASC').catch(() => []),
    fetchAll<Service>(E.services, 'createdAt:ASC').catch(() => []),
    fetchAll<Staff>(E.staff, 'createdAt:ASC').catch(() => []),
    fetchAll<Registration & { patient?: unknown }>(E.registrations, 'regDate:DESC', ['patient']).catch(() => []),
    fetchAll<Patient>(E.patients, 'createdAt:DESC').catch(() => []),
    fetchChildren<AllergyRow>(E.patientAllergies, 'patient').catch(() => []),
    fetchAll<Invoice & { patient?: unknown; registration?: unknown }>(E.invoices, 'createdAt:DESC', ['patient', 'registration']).catch(() => []),
    fetchAll<Medicine>(E.medicines, 'createdAt:ASC').catch(() => []),
  ]);
  // Kunci penghubung diutamakan dari relasi DB (populate), fallback ke kolom string lama.
  const registrations: Registration[] = registrationsRaw.map((r) => {
    const { patient, ...rest } = r;
    return { ...rest, patientId: relDocId(patient) ?? r.patientId };
  });
  const invoices: Invoice[] = invoicesRaw.map((r) => {
    const { patient, registration, ...rest } = r;
    return {
      ...rest,
      patientId: relDocId(patient) ?? r.patientId,
      visitId: relDocId(registration) ?? r.visitId,
    };
  });
  // Alergi tersimpan sebagai baris tabel patient-allergies → rakit ke string[].
  const allergiesByPatient = groupKids(patientAllergyRows);
  const patients: Patient[] = patientsRaw.map((p) => ({
    ...p,
    allergies: (allergiesByPatient.get(p.id) ?? []).map((a) => a.alergen),
  }));
  return {
    rooms,
    patientGroups,
    services,
    staff,
    registrations,
    patients,
    invoices,
    medicines,
  };
}

async function loadModuleData(mod: string): Promise<Partial<ClinicState>> {
  const token = getLocalStorage('jwt');
  if (!token) return {};
  const E = STRAPI_ENDPOINTS;
  switch (mod) {
    case 'farmasi': {
      const [suppliers, factories, brands, penerimaanRaw, pengeluaran, penyesuaianRaw, returRaw,
        penerimaanItemRows, penyesuaianItemRows, returItemRows] = await Promise.all([
        fetchAll<Supplier>(E.suppliers, 'createdAt:ASC').catch(() => []),
        fetchAll<Factory>(E.factories, 'createdAt:ASC').catch(() => []),
        fetchAll<Brand>(E.brands, 'createdAt:ASC').catch(() => []),
        fetchAll<Penerimaan>(E.penerimaan, 'createdAt:DESC').catch(() => []),
        fetchAll<Pengeluaran>(E.pengeluaran, 'createdAt:DESC').catch(() => []),
        fetchAll<Penyesuaian>(E.penyesuaian, 'createdAt:DESC').catch(() => []),
        fetchAll<Retur>(E.retur, 'createdAt:DESC').catch(() => []),
        fetchChildren<PenerimaanItemRow>(E.penerimaanItems, 'penerimaan').catch(() => []),
        fetchChildren<PenyesuaianItemRow>(E.penyesuaianItems, 'penyesuaian').catch(() => []),
        fetchChildren<ReturItemRow>(E.returItems, 'retur').catch(() => []),
      ]);
      const penerimaan: Penerimaan[] = penerimaanRaw.map((p) => ({
        ...p,
        items: (groupKids(penerimaanItemRows).get(p.id) ?? []).map((i) => ({
          id: i.id, code: i.code ?? '', name: i.name ?? '', qty: i.qty ?? 0,
          price: i.price ?? 0, batch: i.batch ?? '', expiry: i.expiry ?? '',
        })),
      }));
      const penyesuaian: Penyesuaian[] = penyesuaianRaw.map((p) => ({
        ...p,
        items: (groupKids(penyesuaianItemRows).get(p.id) ?? []).map((i) => ({
          id: i.id, code: i.code ?? '', name: i.name ?? '', stockBefore: i.stockBefore ?? 0,
          stockAfter: i.stockAfter ?? 0, reason: i.reason ?? '',
        })),
      }));
      const retur: Retur[] = returRaw.map((p) => ({
        ...p,
        items: (groupKids(returItemRows).get(p.id) ?? []).map((i) => ({
          id: i.id, code: i.code ?? '', name: i.name ?? '', qty: i.qty ?? 0, reason: i.reason ?? '',
        })),
      }));
      return { suppliers, factories, brands, penerimaan, pengeluaran, penyesuaian, retur };
    }
    case 'surat': {
      const [letters, referrals] = await Promise.all([
        fetchAll<Letter>(E.letters, 'createdAt:DESC').catch(() => []),
        fetchAll<Referral>(E.referrals, 'createdAt:DESC').catch(() => []),
      ]);
      return { letters, referrals };
    }
    case 'billing': {
      const [apotekRaw, claims, apotekItemRows] = await Promise.all([
        fetchAll<ApotekInvoice>(E.apotekInvoices, 'createdAt:DESC').catch(() => []),
        fetchAll<InsuranceClaim>(E.insuranceClaims, 'createdAt:DESC').catch(() => []),
        fetchChildren<ApotekItemRow>(E.apotekInvoiceItems, 'apotek_invoice').catch(() => []),
      ]);
      const apotekInvoices: ApotekInvoice[] = apotekRaw.map((a) => ({
        ...a,
        items: (groupKids(apotekItemRows).get(a.id) ?? []).map((i) => ({
          id: i.id, name: i.name ?? '', qty: i.qty ?? 0, price: i.price ?? 0,
        })),
      }));
      return { apotekInvoices, claims };
    }
    case 'pengaturan': {
      const [packages, discounts, schedules] = await Promise.all([
        fetchAll<ServicePackage>(E.servicePackages, 'createdAt:ASC').catch(() => []),
        fetchAll<ServiceDiscount>(E.serviceDiscounts, 'createdAt:ASC').catch(() => []),
        fetchAll<StaffSchedule>(E.staffSchedules, 'createdAt:ASC').catch(() => []),
      ]);
      return { packages, discounts, schedules };
    }
    case 'emr': {
      const E2 = STRAPI_ENDPOINTS;
      const [emrDocs, kondisi, odonto, diagnosa, tindakan, alkes, reseps, resepItems] =
        await Promise.all([
          fetchAll<EmrDocScalars>(E2.emrDocuments, 'createdAt:DESC').catch(() => []),
          fetchChildren<KondisiRow>(E2.emrKondisi, 'emr_document').catch(() => []),
          fetchChildren<OdontoRow>(E2.emrOdontogram, 'emr_document').catch(() => []),
          fetchChildren<DiagnosaRow>(E2.emrDiagnosa, 'emr_document').catch(() => []),
          fetchChildren<TindakanRow>(E2.emrTindakan, 'emr_document').catch(() => []),
          fetchChildren<AlkesRow>(E2.emrAlkes, 'emr_document').catch(() => []),
          fetchChildren<ResepRow>(E2.emrResep, 'emr_document').catch(() => []),
          fetchChildren<ResepItemRow>(E2.emrResepItem, 'resep').catch(() => []),
        ]);
      return { emr: assembleEmr(emrDocs, { kondisi, odonto, diagnosa, tindakan, alkes, reseps, resepItems }) };
    }
    case 'all': {
      const [farmasi, surat, billing, pengaturan, emr] = await Promise.all([
        loadModuleData('farmasi'),
        loadModuleData('surat'),
        loadModuleData('billing'),
        loadModuleData('pengaturan'),
        loadModuleData('emr'),
      ]);
      return { ...farmasi, ...surat, ...billing, ...pengaturan, ...emr };
    }
    default:
      return {};
  }
}

export function ClinicStoreProvider({ children }: { children: React.ReactNode }) {
  // State murni di memori — selalu dimuat fresh dari API, tanpa cache storage.
  const [state, setState] = useState<ClinicState>(EMPTY_STATE);
  // Modul yang sudah dimuat di sesi memori ini (untuk dimuat ulang saat refresh).
  const [loadedModules, setLoadedModules] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const ensureModule = useCallback(
    async (mod: 'farmasi' | 'billing' | 'surat' | 'pengaturan' | 'emr' | 'all') => {
      const key = currentFaskesIdSafe();
      if (!key) return;

      // Selalu baca fresh dari API (dedup bila ada request paralel yang sama).
      const inflightKey = `${key}_mod_${mod}`;
      let p = inflight.get(inflightKey) as Promise<Partial<ClinicState>> | undefined;
      if (!p) {
        p = loadModuleData(mod).finally(() => inflight.delete(inflightKey));
        inflight.set(inflightKey, p);
      }

      try {
        const modData = await p;
        if (modData && Object.keys(modData).length > 0) {
          setLoadedModules((prev) => ({ ...prev, [mod]: Date.now() }));
          setState((prevSt) => ({ ...prevSt, ...modData }));
        }
      } catch (err) {
        console.warn('ensureModule error:', mod, err);
      }
    },
    [],
  );

  const fetchCore = useCallback(async () => {
    const key = currentFaskesIdSafe();
    const token = getLocalStorage('jwt');
    if (!token || !key) return;

    const inflightKey = `${key}_core`;
    let p = inflight.get(inflightKey) as Promise<Partial<ClinicState>> | undefined;
    if (!p) {
      p = loadCore().finally(() => inflight.delete(inflightKey));
      inflight.set(inflightKey, p);
    }

    const coreData = await p;
    if (coreData) {
      setState((prev) => ({ ...prev, ...coreData }));
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const key = currentFaskesIdSafe();
      if (!key) return;

      const core = await loadCore();
      const loadedKeys = Object.keys(loadedModules);
      const modPromises = loadedKeys.map((k) => loadModuleData(k));
      const modResults = await Promise.all(modPromises);
      const mergedMods = Object.assign({}, ...modResults);

      setState((prev) => ({ ...prev, ...core, ...mergedMods }));
      const now = Date.now();
      const nextLoaded: Record<string, number> = {};
      for (const k of loadedKeys) nextLoaded[k] = now;
      setLoadedModules(nextLoaded);
    } catch {
      if (getSession() && !getLocalStorage('jwt')) {
        logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, [loadedModules]);

  // Muat data inti langsung dari API saat provider mount + setiap sesi berubah
  // (login/logout/ganti faskes). Bersihkan sisa cache era lama bila masih ada.
  useEffect(() => {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith('dpi_cache_')) doomed.push(k);
      }
      doomed.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {
      /* abaikan */
    }

    let cancelled = false;
    const boot = async () => {
      setLoading(true);
      try {
        await fetchCore();
      } catch (err) {
        console.warn('ClinicStore init error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void boot();

    const onSession = () => {
      const key = currentFaskesIdSafe();
      // Reset memori lalu muat ulang fresh (atau kosongkan saat logout).
      setState(EMPTY_STATE);
      setLoadedModules({});
      if (!key || !getLocalStorage('jwt')) {
        setLoading(false);
        return;
      }
      setLoading(true);
      fetchCore()
        .catch((err) => console.warn('ClinicStore reload error:', err))
        .finally(() => setLoading(false));
    };
    window.addEventListener(STRAPI_SESSION_EVENT, onSession);
    return () => {
      cancelled = true;
      window.removeEventListener(STRAPI_SESSION_EVENT, onSession);
    };
  }, [fetchCore]);

  const addPatient = useCallback<ClinicStoreContextValue['addPatient']>(async (p) => {
    // Alergi bukan kolom pasien lagi — disimpan sebagai baris patient-allergies.
    const { allergies, ...rest } = p;
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.patients, {
      data: {
        ...rest,
        name: toUpperCase(p.name),
        registeredAt: new Date().toISOString().slice(0, 10),
        faskes: currentFaskesId(),
      },
    });
    const created = toModel<Patient>(res.data);
    const patientId = String(res.data.documentId ?? '');
    for (const alergen of allergies ?? []) {
      if (!alergen) continue;
      await postRow(STRAPI_ENDPOINTS.patientAllergies, {
        alergen, patient: patientId, faskes: currentFaskesId(),
      }).catch(() => null);
    }
    const withAllergies: Patient = { ...created, allergies: allergies ?? [] };
    setState((s) => ({ ...s, patients: [withAllergies, ...s.patients] }));
    return withAllergies;
  }, []);

  const addRegistration = useCallback<ClinicStoreContextValue['addRegistration']>(async (reg) => {
    const { regDate, ...rest } = reg;
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.registrations, {
      data: {
        ...rest,
        patientName: toUpperCase(rest.patientName),
        doctor: toUpperCase(rest.doctor),
        regDate: regDate ?? new Date().toISOString(),
        status: 'Registrasi',
        // Relasi: registrasi → pasien & faskes (kunci string tetap dipertahankan).
        patient: rest.patientId,
        faskes: currentFaskesId(),
      },
    });
    const created = toModel<Registration>(res.data);
    setState((s) => ({ ...s, registrations: [created, ...s.registrations] }));
    return created;
  }, []);

  const getOrCreateEmr = useCallback(
    (regId: string) => state.emr[regId] ?? blankEmr(regId),
    [state.emr],
  );

  const updateEmr = useCallback<ClinicStoreContextValue['updateEmr']>(
    async (regId, doc) => {
      const faskesId = currentFaskesId();
      const existing = state.emr[regId] as (EmrDocument & { id?: string }) | undefined;
      // Relasi: rekam medis → registrasi & pasien (kunci string tetap dipertahankan).
      const patientDocId = state.registrations.find((r) => r.id === regId)?.patientId;
      const links: Record<string, string> = { registration: regId };
      if (patientDocId) links.patient = patientDocId;
      let docId = existing?.id;
      if (docId) {
        // Kolom skalar: satu PUT ke baris emr-documents.
        await api('PUT', `${STRAPI_ENDPOINTS.emrDocuments}/${docId}`, { data: { ...emrScalars(doc), ...links } });
      } else {
        const res = await api<{ data: StrapiEntity }>(
          'POST', STRAPI_ENDPOINTS.emrDocuments, { data: { ...emrScalars(doc), ...links, faskes: faskesId } },
        );
        docId = res.data.documentId;
      }
      // Baris anak: tulis ulang per tabel (tanpa JSON).
      await saveEmrChildren(docId, faskesId, doc);
      const saved: EmrDocument & { id: string } = { ...doc, id: docId };
      setState((s) => ({
        ...s,
        emr: { ...s.emr, [regId]: saved },
        registrations: s.registrations.map((r) =>
          r.id === regId ? { ...r, status: 'Proses' } : r,
        ),
      }));
      // Tandai registrasi sebagai Proses di server (best-effort).
      try {
        await api('PUT', `${STRAPI_ENDPOINTS.registrations}/${regId}`, {
          data: { status: 'Proses' },
        });
      } catch {
        /* registrasi mungkin sudah berstatus Proses */
      }
    },
    [state.emr, state.registrations],
  );

  const addInvoice = useCallback<ClinicStoreContextValue['addInvoice']>(async (inv) => {
    // Idempoten per kunjungan: 1 registrasi = 1 tagihan. Tanpa ini, klik
    // tombol "Selesai" 2x pada rekam medis yang sama membuat invoice ganda.
    if (inv.visitId) {
      const existing = state.invoices.find((i) => i.visitId === inv.visitId);
      if (existing) {
        // Tagihan yang sudah Lunas jangan pernah diubah — billing sudah tutup.
        if (existing.paymentStatus === 'Lunas') return existing;
        // Masih Belum Dibayar → perbarui dengan nominal terbaru
        // (EMR sempat diedit setelah klik Selesai pertama).
        await api('PUT', `${STRAPI_ENDPOINTS.invoices}/${existing.id}`, {
          data: {
            patientName: toUpperCase(inv.patientName),
            doctor: toUpperCase(inv.doctor),
            consultationFee: inv.consultationFee,
            procedureFee: inv.procedureFee,
            alkesFee: inv.alkesFee,
            medicineFee: inv.medicineFee,
            discount: inv.discount,
            total: inv.total,
            // Relasi: tagihan → pasien & registrasi (kunci string tetap dipertahankan).
            patient: inv.patientId,
            registration: inv.visitId,
          },
        });
        const updated: Invoice = {
          ...existing,
          patientName: toUpperCase(inv.patientName),
          doctor: toUpperCase(inv.doctor),
          consultationFee: inv.consultationFee,
          procedureFee: inv.procedureFee,
          alkesFee: inv.alkesFee,
          medicineFee: inv.medicineFee,
          discount: inv.discount,
          total: inv.total,
        };
        setState((s) => ({ ...s, invoices: s.invoices.map((x) => (x.id === existing.id ? updated : x)) }));
        return updated;
      }
    }
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.invoices, {
      data: {
        ...inv,
        patientName: toUpperCase(inv.patientName),
        doctor: toUpperCase(inv.doctor),
        faskes: currentFaskesId(),
        // Relasi: tagihan → pasien & registrasi (kunci string tetap dipertahankan).
        patient: inv.patientId,
        registration: inv.visitId,
      },
    });
    const created = toModel<Invoice>(res.data);
    setState((s) => ({ ...s, invoices: [created, ...s.invoices] }));
    return created;
  }, [state.invoices]);

  const payInvoice = useCallback<ClinicStoreContextValue['payInvoice']>(
    async (id, method, discount) => {
      const inv = state.invoices.find((i) => i.id === id);
      const total = Math.max(0, (inv?.total ?? 0) - discount);
      await api('PUT', `${STRAPI_ENDPOINTS.invoices}/${id}`, {
        data: {
          paymentStatus: 'Lunas',
          paymentMethod: method,
          discount,
          total,
          paidAt: new Date().toISOString().slice(0, 10),
        },
      });

      // Update registrasi kunjungan terkait menjadi status Selesai
      if (inv?.visitId) {
        try {
          await api('PUT', `${STRAPI_ENDPOINTS.registrations}/${inv.visitId}`, {
            data: { status: 'Selesai' },
          });
          setState((s) => ({
            ...s,
            registrations: s.registrations.map((r) =>
              r.id === inv.visitId ? { ...r, status: 'Selesai' } : r
            ),
          }));
        } catch {
          /* abaikan */
        }
      }
      setState((s) => ({
        ...s,
        invoices: s.invoices.map((x) =>
          x.id === id
            ? { ...x, paymentStatus: 'Lunas', paymentMethod: method, discount, total, paidAt: new Date().toISOString().slice(0, 10) }
            : x,
        ),
      }));
    },
    [state.invoices],
  );

  const addApotekInvoice = useCallback<ClinicStoreContextValue['addApotekInvoice']>(async (inv) => {
    // Item tersimpan sebagai baris apotek-invoice-items (tanpa JSON).
    const { items, patientId, ...rest } = inv;
    const faskesId = currentFaskesId();
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.apotekInvoices, {
      data: {
        ...rest,
        patientName: toUpperCase(inv.patientName),
        faskes: faskesId,
        // Relasi ke pasien bila pembeli cocok dengan pasien terdaftar (obat bebas bisa tanpa relasi).
        ...(patientId ? { patient: patientId } : {}),
      },
    });
    const invoiceId = res.data.documentId;
    const createdItems: ApotekInvoice['items'] = [];
    for (const it of items ?? []) {
      const rowId = await postRow(STRAPI_ENDPOINTS.apotekInvoiceItems, {
        code: (it as { code?: string }).code ?? null,
        name: it.name, qty: it.qty, price: it.price, apotek_invoice: invoiceId, faskes: faskesId,
      });
      createdItems.push({ id: rowId, name: it.name, qty: it.qty, price: it.price });
    }
    const created: ApotekInvoice = {
      ...toModel<ApotekInvoice>(res.data),
      items: createdItems,
      ...(patientId ? { patientId } : {}),
    };
    setState((s) => ({ ...s, apotekInvoices: [created, ...s.apotekInvoices] }));
    return created;
    setState((s) => ({ ...s, apotekInvoices: [created, ...s.apotekInvoices] }));
    return created;
  }, []);

  const addBooking = useCallback<ClinicStoreContextValue['addBooking']>(async (bk) => {
    const { patientId, ...rest } = bk;
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.bookings, {
      data: {
        ...rest,
        patientName: toUpperCase(bk.patientName),
        doctor: toUpperCase(bk.doctor),
        faskes: currentFaskesId(),
        // Relasi ke pasien bila booking terhubung ke pasien terdaftar.
        ...(patientId ? { patient: patientId } : {}),
      },
    });
    const created = { ...toModel<Booking>(res.data), ...(patientId ? { patientId } : {}) };
    setState((s) => ({ ...s, bookings: [created, ...s.bookings] }));
    return created;
  }, []);

  const updateBookingStatus = useCallback<ClinicStoreContextValue['updateBookingStatus']>(
    async (id, status) => {
      await api('PUT', `${STRAPI_ENDPOINTS.bookings}/${id}`, { data: { status } });
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
      }));
    },
    [],
  );

  const addLetter = useCallback<ClinicStoreContextValue['addLetter']>(async (l) => {
    const { patientId, ...rest } = l;
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.letters, {
      data: {
        ...rest,
        patientName: toUpperCase(l.patientName),
        doctor: toUpperCase(l.doctor),
        faskes: currentFaskesId(),
        // Relasi: surat → pasien.
        ...(patientId ? { patient: patientId } : {}),
      },
    });
    const created = { ...toModel<Letter>(res.data), ...(patientId ? { patientId } : {}) };
    setState((s) => ({ ...s, letters: [created, ...s.letters] }));
    return created;
  }, []);

  const addReferral = useCallback<ClinicStoreContextValue['addReferral']>(async (r) => {
    const { patientId, ...rest } = r;
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.referrals, {
      data: {
        ...rest,
        patientName: toUpperCase(r.patientName),
        doctor: toUpperCase(r.doctor),
        faskes: currentFaskesId(),
        // Relasi: rujukan → pasien.
        ...(patientId ? { patient: patientId } : {}),
      },
    });
    const created = { ...toModel<Referral>(res.data), ...(patientId ? { patientId } : {}) };
    setState((s) => ({ ...s, referrals: [created, ...s.referrals] }));
    return created;
  }, []);

  const updateMedicineStock = useCallback<ClinicStoreContextValue['updateMedicineStock']>(
    async (id, delta) => {
      const med = state.medicines.find((m) => m.id === id);
      const stock = Math.max(0, (med?.stock ?? 0) + delta);
      await api('PUT', `${STRAPI_ENDPOINTS.medicines}/${id}`, { data: { stock } });
      setState((s) => ({
        ...s,
        medicines: s.medicines.map((m) => (m.id === id ? { ...m, stock } : m)),
      }));
    },
    [state.medicines],
  );

  const addPenyesuaian = useCallback<ClinicStoreContextValue['addPenyesuaian']>(async (adj) => {
    // Item tersimpan sebagai baris penyesuaian-items (tanpa JSON).
    const { items, ...rest } = adj;
    const faskesId = currentFaskesId();
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.penyesuaian, {
      data: { ...rest, faskes: faskesId },
    });
    const adjId = res.data.documentId;
    const createdItems: Penyesuaian['items'] = [];
    for (const it of items ?? []) {
      const rowId = await postRow(STRAPI_ENDPOINTS.penyesuaianItems, {
        code: it.code, name: it.name, stockBefore: it.stockBefore, stockAfter: it.stockAfter,
        reason: it.reason, penyesuaian: adjId, faskes: faskesId,
      });
      createdItems.push({ ...it, id: rowId });
    }
    const created: Penyesuaian = { ...toModel<Penyesuaian>(res.data), items: createdItems };
    setState((s) => ({ ...s, penyesuaian: [created, ...s.penyesuaian] }));
    return created;
  }, []);

  const updateRoom = useCallback<ClinicStoreContextValue['updateRoom']>(async (room) => {
    await api('PUT', `${STRAPI_ENDPOINTS.rooms}/${room.id}`, {
      data: stripId(room),
    });
    setState((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === room.id ? room : r)) }));
  }, []);

  const addRoom = useCallback<ClinicStoreContextValue['addRoom']>(async (name) => {
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.rooms, {
      data: { name, faskes: currentFaskesId() },
    });
    const created = toModel<Room>(res.data);
    setState((s) => ({ ...s, rooms: [...s.rooms, created] }));
    return created;
  }, []);

  const removeRoom = useCallback<ClinicStoreContextValue['removeRoom']>(async (id) => {
    await api('DELETE', `${STRAPI_ENDPOINTS.rooms}/${id}`);
    setState((s) => ({ ...s, rooms: s.rooms.filter((r) => r.id !== id) }));
  }, []);

  const addStaff = useCallback<ClinicStoreContextValue['addStaff']>(async (st) => {
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.staff, {
      data: { ...st, name: toUpperCase(st.name), faskes: currentFaskesId() },
    });
    const created = toModel<Staff>(res.data);
    setState((s) => ({ ...s, staff: [...s.staff, created] }));
    return created;
  }, []);

  const toggleStaffActive = useCallback<ClinicStoreContextValue['toggleStaffActive']>(
    async (id) => {
      const st = state.staff.find((x) => x.id === id);
      await api('PUT', `${STRAPI_ENDPOINTS.staff}/${id}`, {
        data: { active: !(st?.active ?? true) },
      });
      setState((s) => ({
        ...s,
        staff: s.staff.map((x) => (x.id === id ? { ...x, active: !x.active } : x)),
      }));
    },
    [state.staff],
  );

  const resetAll = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const value = useMemo<ClinicStoreContextValue>(
    () => ({
      state,
      loading,
      refresh,
      ensureModule,
      addRegistration,
      addPatient,
      getOrCreateEmr,
      updateEmr,
      addInvoice,
      payInvoice,
      addApotekInvoice,
      addBooking,
      updateBookingStatus,
      addLetter,
      addReferral,
      updateMedicineStock,
      addPenyesuaian,
      updateRoom,
      addRoom,
      removeRoom,
      addStaff,
      toggleStaffActive,
      resetAll,
    }),
    [
      state, loading, refresh, ensureModule, addRegistration, addPatient, getOrCreateEmr, updateEmr,
      addInvoice, payInvoice, addApotekInvoice, addBooking, updateBookingStatus,
      addLetter, addReferral, updateMedicineStock, addPenyesuaian, updateRoom, addRoom,
      removeRoom, addStaff, toggleStaffActive, resetAll,
    ],
  );

  return <ClinicStoreContext.Provider value={value}>{children}</ClinicStoreContext.Provider>;
}

export function useClinicStore(): ClinicStoreContextValue {
  const ctx = useContext(ClinicStoreContext);
  if (!ctx) throw new Error('useClinicStore harus dipakai di dalam ClinicStoreProvider');
  return ctx;
}

/** Helper umum: format Rupiah */
export const fmtRupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

/** Helper: format tanggal Indonesia singkat */
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Helper: tanggal + jam */
export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
};
