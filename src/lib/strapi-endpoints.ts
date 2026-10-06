/**
 * Daftar endpoint Strapi dokter-pintar-server.
 * Semua modul memakai CRUD bawaan Strapi (default factories, tanpa
 * controller/service/route custom) — sama seperti kebanyakan modul di
 * hris-server-strapi.
 *
 * Pola URL: GET/POST /api/<plural> , GET/PUT/DELETE /api/<plural>/:documentId
 */
export const STRAPI_ENDPOINTS = {
  patients: '/api/patients',
  registrations: '/api/registrations',
  bookings: '/api/bookings',
  emrDocuments: '/api/emr-documents',
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
  // bawaan users-permissions
  authLocal: '/api/auth/local',
  usersMe: '/api/users/me',
  upload: '/api/upload',
  // multi-tenant faskes (custom, pola HRIS approver/register)
  faskesRegister: '/api/faskes/register',
  faskesStaff: '/api/faskes/staff',
} as const;

export type StrapiEndpointKey = keyof typeof STRAPI_ENDPOINTS;
