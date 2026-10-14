'use client';

/**
 * Dropdown siap pakai untuk entitas bervolume besar — semuanya memakai
 * `LazyDropdown` (search server-side + lazy load per halaman, pola HRIS).
 *
 * - PatientDropdown  : pasien (cari nama / NIK / telepon)
 * - MedicineDropdown : obat & alkes (cari kode / nama)
 * - ServiceDropdown  : master pelayanan/tindakan (cari kode / nama)
 * - PatientGroupDropdown : grup pasien (cari nama)
 * - RoomDropdown     : poli (cari nama)
 * - DoctorDropdown   : dokter (Gigi & Umum) — value = nama (kompatibel state lama)
 * - StaffDropdown    : seluruh staf, opsional filter role & hanya aktif
 */
import { LazyDropdown, type RawEntity } from './lazy-dropdown';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import { fmtRupiah } from '@/lib/ClinicStore';

const str = (v: unknown): string =>
  typeof v === 'string' ? v : v == null ? '' : String(v);

const num = (v: unknown): number =>
  typeof v === 'number' ? v : Number(str(v)) || 0;

interface BaseProps {
  value: string;
  onChange: (value: string, raw: RawEntity | null) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

/* ================= Pasien ================= */

export function PatientDropdown({ value, onChange, placeholder = '— Pilih pasien —', ...rest }: BaseProps) {
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.patients}
      searchFields={['name', 'nik', 'phone']}
      sort={['name:asc']}
      value={value}
      onChange={onChange}
      getLabel={(r) => str(r.name)}
      getSub={(r) => `NIK ${str(r.nik) || '-'} · ${str(r.phone) || '-'}`}
      placeholder={placeholder}
      searchPlaceholder="Cari nama / NIK / telepon…"
      emptyText="Tidak ada pasien yang cocok dengan pencarian."
      ariaLabel="Pasien"
      {...rest}
    />
  );
}

/* ================= Obat & alkes ================= */

export function MedicineDropdown({
  value,
  onChange,
  valueField = 'documentId',
  placeholder = '— Pilih obat —',
  ...rest
}: BaseProps & {
  /** Kolom yang menjadi value: 'documentId' (default) | 'code' | 'name'. */
  valueField?: 'documentId' | 'code' | 'name';
}) {
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.medicines}
      searchFields={['code', 'name']}
      sort={['name:asc']}
      value={value}
      onChange={onChange}
      getValue={(r) => (valueField === 'documentId' ? str(r.documentId) : str(r[valueField]))}
      valueField={valueField}
      getLabel={(r) => str(r.name)}
      getSub={(r) =>
        `${str(r.code)} · ${fmtRupiah(num(r.price))} · stok ${num(r.stock)} ${str(r.unit)}`
      }
      placeholder={placeholder}
      searchPlaceholder="Cari kode / nama obat…"
      emptyText="Tidak ada obat yang cocok dengan pencarian."
      ariaLabel="Obat"
      {...rest}
    />
  );
}

/* ================= Pelayanan / tindakan ================= */

export function ServiceDropdown({
  value,
  onChange,
  valueField = 'code',
  hideCode = false,
  placeholder = '— Pilih tindakan —',
  ...rest
}: BaseProps & {
  valueField?: 'documentId' | 'code' | 'name';
  /** True = label hanya nama (untuk pemilih Pelayanan di registrasi). */
  hideCode?: boolean;
}) {
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.services}
      searchFields={['code', 'name']}
      sort={['code:asc']}
      value={value}
      onChange={onChange}
      getValue={(r) => (valueField === 'documentId' ? str(r.documentId) : str(r[valueField]))}
      valueField={valueField}
      getLabel={(r) => (hideCode ? str(r.name) : `${str(r.code)} — ${str(r.name)}`)}
      getSub={(r) => `${fmtRupiah(num(r.price))}${str(r.room) ? ` · ${str(r.room)}` : ''}`}
      placeholder={placeholder}
      searchPlaceholder="Cari kode / nama tindakan…"
      emptyText="Tidak ada tindakan yang cocok dengan pencarian."
      ariaLabel="Tindakan"
      {...rest}
    />
  );
}

/* ================= Grup pasien & Poli ================= */

/**
 * Nama grup di master menyertakan frasa "Kelompok Pasien" (mis.
 * "KELOMPOK PASIEN UMUM") — tidak ditampilkan di dropdown, hanya
 * nama intinya. Value yang dikirim ke API tetap nama penuh.
 */
const stripKelompok = (s: string): string => {
  const cleaned = s.replace(/kelompok\s+pasien/gi, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || s;
};

export function PatientGroupDropdown({
  value,
  onChange,
  placeholder = 'Pilih Grup Pasien',
  ...rest
}: BaseProps) {
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.patientGroups}
      searchFields={['name']}
      sort={['createdAt:asc']}
      value={value}
      onChange={onChange}
      getValue={(r) => str(r.name)}
      valueField="name"
      getLabel={(r) => stripKelompok(str(r.name))}
      // Sub (deskripsi) yang isinya hanya frasa tersebut dikosongkan total,
      // bukan fallback ke teks asli.
      getSub={(r) =>
        str(r.description || r.code || '')
          .replace(/kelompok\s+pasien/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }
      placeholder={placeholder}
      searchPlaceholder="Cari grup pasien…"
      emptyText="Tidak ada grup yang cocok dengan pencarian."
      ariaLabel="Grup Pasien"
      {...rest}
    />
  );
}

export function RoomDropdown({
  value,
  onChange,
  placeholder = 'Pilih Poli',
  ...rest
}: BaseProps) {
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.rooms}
      searchFields={['name']}
      sort={['createdAt:asc']}
      value={value}
      onChange={onChange}
      getValue={(r) => str(r.name)}
      valueField="name"
      getLabel={(r) => str(r.name)}
      placeholder={placeholder}
      searchPlaceholder="Cari poli…"
      emptyText="Tidak ada poli yang cocok dengan pencarian."
      ariaLabel="Poli"
      {...rest}
    />
  );
}

/* ================= Dokter ================= */

const DOCTOR_ROLES = ['Dokter Gigi', 'Dokter Umum'];

export function DoctorDropdown({
  value,
  onChange,
  placeholder = '— Pilih dokter —',
  ...rest
}: BaseProps) {
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.staff}
      searchFields={['name']}
      staticFilters={{ role: { $in: DOCTOR_ROLES } }}
      sort={['name:asc']}
      value={value}
      onChange={onChange}
      // Value = nama dokter (kompatibel dengan state registrasi/surat yang ada).
      getValue={(r) => str(r.name)}
      getKey={(r) => str(r.documentId)}
      valueField="name"
      getLabel={(r) => str(r.name)}
      getSub={(r) => `${str(r.role)}${str(r.room) ? ` · ${str(r.room)}` : ''}`}
      placeholder={placeholder}
      searchPlaceholder="Cari nama dokter…"
      emptyText="Tidak ada dokter yang cocok dengan pencarian."
      ariaLabel="Dokter"
      {...rest}
    />
  );
}

/* ================= Staf umum ================= */

export function StaffDropdown({
  value,
  onChange,
  roles,
  activeOnly = true,
  placeholder = '— Pilih staf —',
  ...rest
}: BaseProps & {
  /** Batasi role, mis. ['Apoteker']. Kosong = semua role. */
  roles?: string[];
  /** Hanya staf aktif (default true). */
  activeOnly?: boolean;
}) {
  const staticFilters: Record<string, unknown> = {};
  if (roles && roles.length > 0) staticFilters.role = { $in: roles };
  if (activeOnly) staticFilters.active = { $eq: true };
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.staff}
      searchFields={['name']}
      staticFilters={staticFilters}
      sort={['name:asc']}
      value={value}
      onChange={onChange}
      getValue={(r) => str(r.name)}
      getKey={(r) => str(r.documentId)}
      valueField="name"
      getLabel={(r) => str(r.name)}
      getSub={(r) => `${str(r.role)}${str(r.room) ? ` · ${str(r.room)}` : ''}`}
      placeholder={placeholder}
      searchPlaceholder="Cari nama staf…"
      emptyText="Tidak ada staf yang cocok dengan pencarian."
      ariaLabel="Staf"
      {...rest}
    />
  );
}
