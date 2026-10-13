/**
 * Daftar endpoint Strapi dokter-pintar-server.
 * Mayoritas modul memakai CRUD bawaan Strapi (default factories) — sama
 * seperti kebanyakan modul di hris-server-strapi. Custom API:
 * - /api/faskes/* (multi-tenant, pola HRIS approver/register)
 * - /api/media/signed-urls (baca file private MinIO via presigned URL batch)
 *
 * Pola URL: GET/POST /api/<plural> , GET/PUT/DELETE /api/<plural>/:documentId
 */
export const STRAPI_ENDPOINTS = {
  patients: '/api/patients',
  patientAllergies: '/api/patient-allergies',
  registrations: '/api/registrations',
  bookings: '/api/bookings',
  emrDocuments: '/api/emr-documents',
  emrKondisi: '/api/emr-kondisis',
  emrOdontogram: '/api/emr-odontogram-gigis',
  emrDiagnosa: '/api/emr-diagnosas',
  emrTindakan: '/api/emr-tindakans',
  emrAlkes: '/api/emr-alkes-list',
  emrResep: '/api/emr-reseps',
  emrResepItem: '/api/emr-resep-items',
  penerimaanItems: '/api/penerimaan-items',
  penyesuaianItems: '/api/penyesuaian-items',
  returItems: '/api/retur-items',
  apotekInvoiceItems: '/api/apotek-invoice-items',
  invoices: '/api/invoices',
  apotekInvoices: '/api/apotek-invoices',
  insuranceClaims: '/api/insurance-claims',
  letters: '/api/letters',
  referrals: '/api/referrals',
  medicines: '/api/medicines',
  suppliers: '/api/suppliers',
  factories: '/api/factories',
  brands: '/api/brands',
  penerimaan: '/api/penerimaans',
  pengeluaran: '/api/pengeluarans',
  penyesuaian: '/api/penyesuaians',
  retur: '/api/returs',
  rooms: '/api/rooms',
  patientGroups: '/api/patient-groups',
  /** DisplayName "Service" — api dir `clinic-service` agar tidak bentrok istilah. */
  services: '/api/clinic-services',
  servicePackages: '/api/service-packages',
  serviceDiscounts: '/api/service-discounts',
  staff: '/api/staffs',
  staffSchedules: '/api/staff-schedules',
  // master ICD (global, tanpa faskes) — pengganti lib/icd.ts hardcode
  icd: '/api/ms-icds',
  // master opsi dropdown generik (group/value/label/urutan) — semua opsi
  // dropdown wajib dari API, tidak boleh hardcode
  options: '/api/ms-options',
  // bawaan users-permissions
  authLocal: '/api/auth/local',
  usersMe: '/api/users/me',
  upload: '/api/upload',
  // baca file private MinIO (batch presigned URL, wajib login)
  mediaSignedUrls: '/api/media/signed-urls',
  // multi-tenant faskes (custom, pola HRIS approver/register)
  faskesRegister: '/api/faskes/register',
  faskesStaff: '/api/faskes/staff',
  faskesRoles: '/api/faskes/roles',
  faskesMe: '/api/faskes/me',
  faskesList: '/api/faskes-list',
} as const;

export type StrapiEndpointKey = keyof typeof STRAPI_ENDPOINTS;
