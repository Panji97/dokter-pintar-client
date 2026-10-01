'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Registration, Booking, EmrDocument, Invoice, Patient, Letter, Referral, Medicine,
  ApotekInvoice, InsuranceClaim, Room, Service, ServicePackage, ServiceDiscount, Staff,
  StaffSchedule, Supplier, Factory, Brand, Penerimaan, Pengeluaran, Penyesuaian, Retur,
} from '@/types/clinic';
import {
  INITIAL_REGISTRATIONS, INITIAL_BOOKINGS, SAMPLE_EMR, INITIAL_INVOICES, INITIAL_PATIENTS,
  INITIAL_LETTERS, INITIAL_REFERRALS, INITIAL_MEDICINES, INITIAL_APOTEK_INVOICES,
  INITIAL_CLAIMS, INITIAL_ROOMS, INITIAL_SERVICES, INITIAL_PACKAGES, INITIAL_DISCOUNTS,
  INITIAL_STAFF, INITIAL_SCHEDULES, INITIAL_SUPPLIERS, INITIAL_FACTORIES, INITIAL_BRANDS,
  INITIAL_PENERIMAAN, INITIAL_PENGELUARAN, INITIAL_PENYESUAIAN, INITIAL_RETUR,
} from './mockData';

/**
 * CATATAN ID:
 * Tidak ada lagi generasi nomor custom (No. RM, No. Registrasi, No. Invoice, dll).
 * Identitas dokumen akan diberikan oleh backend (Strapi 5) sebagai field default.
 * Key v2 agar localStorage lama (yang masih membawa nomor custom) tidak terpakai.
 */
const STORAGE_KEY = 'dokterpintar-state-v3';

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
  services: Service[];
  packages: ServicePackage[];
  discounts: ServiceDiscount[];
  staff: Staff[];
  schedules: StaffSchedule[];
}

/** Semua nama pasien & dokter selalu huruf kapital (UPPERCASE). */
export const toUpperCase = (s: string) => s.toUpperCase();

/** Normalisasi semua field nama orang di state (pasien, dokter, PPA). */
function normalizeNames(s: ClinicState): ClinicState {
  return {
    ...s,
    patients: s.patients.map((p) => ({ ...p, name: toUpperCase(p.name) })),
    registrations: s.registrations.map((r) => ({
      ...r,
      patientName: toUpperCase(r.patientName),
      doctor: toUpperCase(r.doctor),
    })),
    bookings: s.bookings.map((b) => ({
      ...b,
      patientName: toUpperCase(b.patientName),
      doctor: toUpperCase(b.doctor),
    })),
    invoices: s.invoices.map((i) => ({
      ...i,
      patientName: toUpperCase(i.patientName),
      doctor: toUpperCase(i.doctor),
    })),
    apotekInvoices: s.apotekInvoices.map((a) => ({
      ...a,
      patientName: toUpperCase(a.patientName),
    })),
    claims: s.claims.map((c) => ({ ...c, patientName: toUpperCase(c.patientName) })),
    letters: s.letters.map((l) => ({
      ...l,
      patientName: toUpperCase(l.patientName),
      doctor: toUpperCase(l.doctor),
    })),
    referrals: s.referrals.map((r) => ({
      ...r,
      patientName: toUpperCase(r.patientName),
      doctor: toUpperCase(r.doctor),
    })),
    packages: s.packages.map((p) => ({ ...p, patientName: toUpperCase(p.patientName) })),
    staff: s.staff.map((x) => ({ ...x, name: toUpperCase(x.name) })),
    schedules: s.schedules.map((x) => ({ ...x, staffName: toUpperCase(x.staffName) })),
    emr: Object.fromEntries(
      Object.entries(s.emr).map(([k, doc]) => [
        k,
        { ...doc, cppt: doc.cppt.map((c) => ({ ...c, ppa: toUpperCase(c.ppa) })) },
      ]),
    ) as ClinicState['emr'],
  };
}

const INITIAL_STATE: ClinicState = normalizeNames({
  patients: INITIAL_PATIENTS,
  registrations: INITIAL_REGISTRATIONS,
  bookings: INITIAL_BOOKINGS,
  emr: SAMPLE_EMR,
  invoices: INITIAL_INVOICES,
  apotekInvoices: INITIAL_APOTEK_INVOICES,
  claims: INITIAL_CLAIMS,
  letters: INITIAL_LETTERS,
  referrals: INITIAL_REFERRALS,
  medicines: INITIAL_MEDICINES,
  suppliers: INITIAL_SUPPLIERS,
  factories: INITIAL_FACTORIES,
  brands: INITIAL_BRANDS,
  penerimaan: INITIAL_PENERIMAAN,
  pengeluaran: INITIAL_PENGELUARAN,
  penyesuaian: INITIAL_PENYESUAIAN,
  retur: INITIAL_RETUR,
  rooms: INITIAL_ROOMS,
  services: INITIAL_SERVICES,
  packages: INITIAL_PACKAGES,
  discounts: INITIAL_DISCOUNTS,
  staff: INITIAL_STAFF,
  schedules: INITIAL_SCHEDULES,
});

function loadState(): ClinicState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<ClinicState>;
    // Normalisasi juga data lama yang masih menyimpan nama huruf kecil.
    return normalizeNames({ ...INITIAL_STATE, ...parsed });
  } catch {
    return INITIAL_STATE;
  }
}

interface ClinicStoreContextValue {
  state: ClinicState;
  /** Tambah registrasi baru (Pasien Baru atau Pasien Lama) */
  addRegistration: (reg: Omit<Registration, 'id' | 'status' | 'regDate'> & { regDate?: string }) => Registration;
  addPatient: (p: Omit<Patient, 'id' | 'registeredAt'>) => Patient;
  getOrCreateEmr: (regId: string) => EmrDocument;
  updateEmr: (regId: string, doc: EmrDocument) => void;
  addInvoice: (inv: Omit<Invoice, 'id'>) => Invoice;
  payInvoice: (id: string, method: NonNullable<Invoice['paymentMethod']>, discount: number) => void;
  addApotekInvoice: (inv: Omit<ApotekInvoice, 'id'>) => void;
  addBooking: (bk: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  addLetter: (l: Omit<Letter, 'id'>) => void;
  addReferral: (r: Omit<Referral, 'id'>) => void;
  updateMedicineStock: (id: string, delta: number) => void;
  addPenyesuaian: (adj: Omit<Penyesuaian, 'id'>) => void;
  updateRoom: (room: Room) => void;
  addRoom: (name: string) => void;
  removeRoom: (id: string) => void;
  addStaff: (s: Omit<Staff, 'id'>) => void;
  toggleStaffActive: (id: string) => void;
  resetAll: () => void;
}

const ClinicStoreContext = createContext<ClinicStoreContextValue | null>(null);

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

export function ClinicStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ClinicState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota penuh — abaikan */
    }
  }, [state, hydrated]);

  const addRegistration = useCallback<ClinicStoreContextValue['addRegistration']>((reg) => {
    const { regDate, ...rest } = reg;
    const created: Registration = {
      ...rest,
      patientName: toUpperCase(rest.patientName),
      doctor: toUpperCase(rest.doctor),
      id: uid('reg'),
      regDate: regDate ?? new Date().toISOString(),
      status: 'Registrasi',
    };
    setState((s) => ({ ...s, registrations: [created, ...s.registrations] }));
    return created;
  }, []);

  const addPatient = useCallback<ClinicStoreContextValue['addPatient']>((p) => {
    const patient: Patient = {
      ...p,
      name: toUpperCase(p.name),
      id: uid('p'),
      registeredAt: new Date().toISOString().slice(0, 10),
    };
    setState((s) => ({ ...s, patients: [patient, ...s.patients] }));
    return patient;
  }, []);

  const getOrCreateEmr = useCallback<ClinicStoreContextValue['getOrCreateEmr']>((regId) => {
    const existing = state.emr[regId];
    if (existing) return existing;
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
  }, [state.emr]);

  const updateEmr = useCallback<ClinicStoreContextValue['updateEmr']>((regId, doc) => {
    setState((s) => ({
      ...s,
      emr: {
        ...s.emr,
        [regId]: {
          ...doc,
          cppt: doc.cppt.map((c) => ({ ...c, ppa: toUpperCase(c.ppa) })),
        },
      },
      registrations: s.registrations.map((r) => (r.id === regId ? { ...r, status: 'Proses' } : r)),
    }));
  }, []);

  const addInvoice = useCallback<ClinicStoreContextValue['addInvoice']>((inv) => {
    const created: Invoice = { ...inv, patientName: toUpperCase(inv.patientName), doctor: toUpperCase(inv.doctor), id: uid('inv') };
    setState((s) => ({ ...s, invoices: [created, ...s.invoices] }));
    return created;
  }, []);

  const payInvoice = useCallback<ClinicStoreContextValue['payInvoice']>((id, method, discount) => {
    setState((s) => ({
      ...s,
      invoices: s.invoices.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              paymentStatus: 'Lunas',
              paymentMethod: method,
              discount,
              total: Math.max(0, inv.total - discount),
              paidAt: new Date().toISOString().slice(0, 10),
            }
          : inv
      ),
    }));
  }, []);

  const addApotekInvoice = useCallback<ClinicStoreContextValue['addApotekInvoice']>((inv) => {
    setState((s) => ({ ...s, apotekInvoices: [{ ...inv, patientName: toUpperCase(inv.patientName), id: uid('ap') }, ...s.apotekInvoices] }));
  }, []);

  const addBooking = useCallback<ClinicStoreContextValue['addBooking']>((bk) => {
    setState((s) => ({ ...s, bookings: [{ ...bk, patientName: toUpperCase(bk.patientName), doctor: toUpperCase(bk.doctor), id: uid('bk'), createdAt: new Date().toISOString() }, ...s.bookings] }));
  }, []);

  const updateBookingStatus = useCallback<ClinicStoreContextValue['updateBookingStatus']>((id, status) => {
    setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }));
  }, []);

  const addLetter = useCallback<ClinicStoreContextValue['addLetter']>((l) => {
    setState((s) => ({ ...s, letters: [{ ...l, patientName: toUpperCase(l.patientName), doctor: toUpperCase(l.doctor), id: uid('ltr') }, ...s.letters] }));
  }, []);

  const addReferral = useCallback<ClinicStoreContextValue['addReferral']>((r) => {
    setState((s) => ({ ...s, referrals: [{ ...r, patientName: toUpperCase(r.patientName), doctor: toUpperCase(r.doctor), id: uid('ref') }, ...s.referrals] }));
  }, []);

  const updateMedicineStock = useCallback<ClinicStoreContextValue['updateMedicineStock']>((id, delta) => {
    setState((s) => ({
      ...s,
      medicines: s.medicines.map((m) => (m.id === id ? { ...m, stock: Math.max(0, m.stock + delta) } : m)),
    }));
  }, []);

  const addPenyesuaian = useCallback<ClinicStoreContextValue['addPenyesuaian']>((adj) => {
    setState((s) => ({ ...s, penyesuaian: [{ ...adj, id: uid('adj') }, ...s.penyesuaian] }));
  }, []);

  const updateRoom = useCallback<ClinicStoreContextValue['updateRoom']>((room) => {
    setState((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === room.id ? room : r)) }));
  }, []);

  const addRoom = useCallback<ClinicStoreContextValue['addRoom']>((name) => {
    setState((s) => ({ ...s, rooms: [...s.rooms, { id: uid('rm'), name }] }));
  }, []);

  const removeRoom = useCallback<ClinicStoreContextValue['removeRoom']>((id) => {
    setState((s) => ({ ...s, rooms: s.rooms.filter((r) => r.id !== id) }));
  }, []);

  const addStaff = useCallback<ClinicStoreContextValue['addStaff']>((st) => {
    setState((s) => ({ ...s, staff: [...s.staff, { ...st, name: toUpperCase(st.name), id: uid('stf') }] }));
  }, []);

  const toggleStaffActive = useCallback<ClinicStoreContextValue['toggleStaffActive']>((id) => {
    setState((s) => ({ ...s, staff: s.staff.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) }));
  }, []);

  const resetAll = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setState(INITIAL_STATE);
  }, []);

  const value = useMemo<ClinicStoreContextValue>(
    () => ({
      state,
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
      state, addRegistration, addPatient, getOrCreateEmr, updateEmr, addInvoice, payInvoice,
      addApotekInvoice, addBooking, updateBookingStatus, addLetter, addReferral,
      updateMedicineStock, addPenyesuaian, updateRoom, addRoom, removeRoom, addStaff,
      toggleStaffActive, resetAll,
    ]
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
