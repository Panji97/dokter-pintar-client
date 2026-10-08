'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Registration, Booking, EmrDocument, Invoice, Patient, Letter, Referral, Medicine,
  ApotekInvoice, InsuranceClaim, Room, Service, ServicePackage, ServiceDiscount, Staff,
  StaffSchedule, Supplier, Factory, Brand, Penerimaan, Pengeluaran, Penyesuaian, Retur,
  PatientGroupItem,
} from '@/types/clinic';
import { STRAPI_ENDPOINTS } from './strapi-endpoints';
import { getLocalStorage, getSessionStorage, setSessionStorage, removeSessionStorage } from './storage';
import { logout, getSession } from './auth';
import { STRAPI_SESSION_EVENT } from './strapi';

/**
 * ClinicStore — SELURUH data dari Strapi (tidak ada mock / localStorage data),
 * disekat per faskes: semua baca difilter faskes user, semua tulis dikaitkan
 * ke faskes user (pola tenant HRIS: user.company/client).
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

async function fetchAll<T>(endpoint: string, sort: string): Promise<T[]> {
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
    const res = await api<StrapiList>('GET', `${endpoint}?${params.toString()}`);
    out.push(...res.data.map(toModel<T>));
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page += 1;
  }
  return out;
}

/** Semua nama pasien & dokter selalu huruf kapital (UPPERCASE). */
export const toUpperCase = (s: string) => s.toUpperCase();

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
    cppt: [],
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

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 menit

interface StoredCache {
  at: number;
  state: ClinicState;
  loaded: Record<string, number>;
}

function getStoredCache(key: string | null): StoredCache | null {
  if (!key) return null;
  const raw = getSessionStorage(`dpi_cache_${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCache;
  } catch {
    return null;
  }
}

function saveStoredCache(key: string | null, state: ClinicState, loaded: Record<string, number>) {
  if (!key) return;
  setSessionStorage(`dpi_cache_${key}`, JSON.stringify({ at: Date.now(), state, loaded }));
}

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
    registrations,
    patients,
    invoices,
    medicines,
  ] = await Promise.all([
    fetchAll<Room>(E.rooms, 'createdAt:ASC').catch(() => []),
    fetchAll<PatientGroupItem>(E.patientGroups, 'createdAt:ASC').catch(() => []),
    fetchAll<Service>(E.services, 'createdAt:ASC').catch(() => []),
    fetchAll<Staff>(E.staff, 'createdAt:ASC').catch(() => []),
    fetchAll<Registration>(E.registrations, 'regDate:DESC').catch(() => []),
    fetchAll<Patient>(E.patients, 'createdAt:DESC').catch(() => []),
    fetchAll<Invoice>(E.invoices, 'createdAt:DESC').catch(() => []),
    fetchAll<Medicine>(E.medicines, 'createdAt:ASC').catch(() => []),
  ]);
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
      const [suppliers, factories, brands, penerimaan, pengeluaran, penyesuaian, retur] =
        await Promise.all([
          fetchAll<Supplier>(E.suppliers, 'createdAt:ASC').catch(() => []),
          fetchAll<Factory>(E.factories, 'createdAt:ASC').catch(() => []),
          fetchAll<Brand>(E.brands, 'createdAt:ASC').catch(() => []),
          fetchAll<Penerimaan>(E.penerimaan, 'createdAt:DESC').catch(() => []),
          fetchAll<Pengeluaran>(E.pengeluaran, 'createdAt:DESC').catch(() => []),
          fetchAll<Penyesuaian>(E.penyesuaian, 'createdAt:DESC').catch(() => []),
          fetchAll<Retur>(E.retur, 'createdAt:DESC').catch(() => []),
        ]);
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
      const [apotekInvoices, claims] = await Promise.all([
        fetchAll<ApotekInvoice>(E.apotekInvoices, 'createdAt:DESC').catch(() => []),
        fetchAll<InsuranceClaim>(E.insuranceClaims, 'createdAt:DESC').catch(() => []),
      ]);
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
      const emrDocs = await fetchAll<EmrDocument>(E.emrDocuments, 'createdAt:DESC').catch(() => []);
      const emr: Record<string, EmrDocument> = {};
      for (const d of emrDocs) emr[d.regId] = d;
      return { emr };
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
  const [state, setState] = useState<ClinicState>(() => {
    const key = currentFaskesIdSafe();
    const cached = getStoredCache(key);
    return cached?.state ?? EMPTY_STATE;
  });

  const [loadedModules, setLoadedModules] = useState<Record<string, number>>(() => {
    const key = currentFaskesIdSafe();
    const cached = getStoredCache(key);
    return cached?.loaded ?? {};
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const key = currentFaskesIdSafe();
    const cached = getStoredCache(key);
    if (!cached) return true;
    return Date.now() - cached.at > CACHE_TTL_MS;
  });

  const syncCache = useCallback(
    (newState: ClinicState, newLoaded?: Record<string, number>) => {
      const key = currentFaskesIdSafe();
      if (key) {
        saveStoredCache(key, newState, newLoaded ?? loadedModules);
      }
    },
    [loadedModules],
  );

  const ensureModule = useCallback(
    async (mod: 'farmasi' | 'billing' | 'surat' | 'pengaturan' | 'emr' | 'all') => {
      const key = currentFaskesIdSafe();
      if (!key) return;

      const lastLoaded = loadedModules[mod];
      if (lastLoaded && Date.now() - lastLoaded < CACHE_TTL_MS) {
        return; // Cache module masih segar, skip network call
      }

      const inflightKey = `${key}_mod_${mod}`;
      let p = inflight.get(inflightKey) as Promise<Partial<ClinicState>> | undefined;
      if (!p) {
        p = loadModuleData(mod).finally(() => inflight.delete(inflightKey));
        inflight.set(inflightKey, p);
      }

      try {
        const modData = await p;
        if (modData && Object.keys(modData).length > 0) {
          setLoadedModules((prev) => {
            const nextLoaded = { ...prev, [mod]: Date.now() };
            setState((prevSt) => {
              const nextSt = { ...prevSt, ...modData };
              saveStoredCache(key, nextSt, nextLoaded);
              return nextSt;
            });
            return nextLoaded;
          });
        }
      } catch (err) {
        console.warn('ensureModule error:', mod, err);
      }
    },
    [loadedModules],
  );

  const fetchCore = useCallback(
    async (force = false) => {
      const key = currentFaskesIdSafe();
      const token = getLocalStorage('jwt');
      if (!token || !key) return;

      if (!force) {
        const cached = getStoredCache(key);
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
          return; // Cache core masih segar, skip network call
        }
      }

      const inflightKey = `${key}_core`;
      let p = inflight.get(inflightKey) as Promise<Partial<ClinicState>> | undefined;
      if (!p) {
        p = loadCore().finally(() => inflight.delete(inflightKey));
        inflight.set(inflightKey, p);
      }

      const coreData = await p;
      if (coreData) {
        setState((prev) => {
          const next = { ...prev, ...coreData };
          saveStoredCache(key, next, loadedModules);
          return next;
        });
      }
    },
    [loadedModules],
  );

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

      setState((prev) => {
        const next = { ...prev, ...core, ...mergedMods };
        const now = Date.now();
        const nextLoaded: Record<string, number> = {};
        for (const k of loadedKeys) nextLoaded[k] = now;
        setLoadedModules(nextLoaded);
        saveStoredCache(key, next, nextLoaded);
        return next;
      });
    } catch {
      if (getSession() && !getLocalStorage('jwt')) {
        logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, [loadedModules]);

  useEffect(() => {
    setLoading(false);
  }, []);

  // Simpan state terbaru ke sessionStorage setiap kali state berubah
  useEffect(() => {
    if (!loading) {
      const key = currentFaskesIdSafe();
      if (key) {
        saveStoredCache(key, state, loadedModules);
      }
    }
  }, [state, loading, loadedModules]);

  const addPatient = useCallback<ClinicStoreContextValue['addPatient']>(async (p) => {
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.patients, {
      data: {
        ...p,
        name: toUpperCase(p.name),
        registeredAt: new Date().toISOString().slice(0, 10),
        faskes: currentFaskesId(),
      },
    });
    const created = toModel<Patient>(res.data);
    setState((s) => ({ ...s, patients: [created, ...s.patients] }));
    return created;
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
      const payload = {
        ...stripId(doc as EmrDocument & { id?: string }),
        cppt: doc.cppt.map((c) => ({ ...c, ppa: toUpperCase(c.ppa) })),
      };
      const existing = state.emr[regId] as (EmrDocument & { id?: string }) | undefined;
      let saved: EmrDocument;
      if (existing?.id) {
        const res = await api<{ data: StrapiEntity }>(
          'PUT', `${STRAPI_ENDPOINTS.emrDocuments}/${existing.id}`, { data: payload },
        );
        saved = toModel<EmrDocument>(res.data);
      } else {
        const res = await api<{ data: StrapiEntity }>(
          'POST', STRAPI_ENDPOINTS.emrDocuments, { data: { ...payload, faskes: currentFaskesId() } },
        );
        saved = toModel<EmrDocument>(res.data);
      }
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
    [state.emr],
  );

  const addInvoice = useCallback<ClinicStoreContextValue['addInvoice']>(async (inv) => {
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.invoices, {
      data: {
        ...inv,
        patientName: toUpperCase(inv.patientName),
        doctor: toUpperCase(inv.doctor),
        faskes: currentFaskesId(),
      },
    });
    const created = toModel<Invoice>(res.data);
    setState((s) => ({ ...s, invoices: [created, ...s.invoices] }));
    return created;
  }, []);

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
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.apotekInvoices, {
      data: { ...inv, patientName: toUpperCase(inv.patientName), faskes: currentFaskesId() },
    });
    const created = toModel<ApotekInvoice>(res.data);
    setState((s) => ({ ...s, apotekInvoices: [created, ...s.apotekInvoices] }));
    return created;
  }, []);

  const addBooking = useCallback<ClinicStoreContextValue['addBooking']>(async (bk) => {
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.bookings, {
      data: {
        ...bk,
        patientName: toUpperCase(bk.patientName),
        doctor: toUpperCase(bk.doctor),
        faskes: currentFaskesId(),
      },
    });
    const created = toModel<Booking>(res.data);
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
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.letters, {
      data: {
        ...l,
        patientName: toUpperCase(l.patientName),
        doctor: toUpperCase(l.doctor),
        faskes: currentFaskesId(),
      },
    });
    const created = toModel<Letter>(res.data);
    setState((s) => ({ ...s, letters: [created, ...s.letters] }));
    return created;
  }, []);

  const addReferral = useCallback<ClinicStoreContextValue['addReferral']>(async (r) => {
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.referrals, {
      data: {
        ...r,
        patientName: toUpperCase(r.patientName),
        doctor: toUpperCase(r.doctor),
        faskes: currentFaskesId(),
      },
    });
    const created = toModel<Referral>(res.data);
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
    const res = await api<{ data: StrapiEntity }>('POST', STRAPI_ENDPOINTS.penyesuaian, {
      data: { ...adj, faskes: currentFaskesId() },
    });
    const created = toModel<Penyesuaian>(res.data);
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
