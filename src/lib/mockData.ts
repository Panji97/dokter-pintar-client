import {
  Medicine, Patient, Invoice, Registration, Booking, EmrDocument,
  ApotekInvoice, InsuranceClaim, Letter, Referral, Supplier, Factory, Brand, Penerimaan,
  Pengeluaran, Penyesuaian, Retur, Room, Service, ServicePackage, ServiceDiscount, Staff,
  StaffSchedule,
} from '@/types/clinic';

/* CATATAN: Seed tidak lagi membawa nomor custom (No. RM, No. Registrasi, No. Invoice,
   booking code, nomor surat/rujukan/resep/PO). ID & numbering akan diberikan Strapi 5. */

/* ==================== MASTER PASIEN ==================== */
export const INITIAL_PATIENTS: Patient[] = [
  { id: 'p-1', nik: '2889102920999109', name: 'Alwi Nadhif Arasyid', birthDate: '1996-04-12', gender: 'L', phone: '081234567890', address: 'Jl. Merdeka No. 45, Jakarta Selatan', bloodType: 'O', allergies: ['Amoxicillin'], registeredAt: '2025-02-24' },
  { id: 'p-2', nik: '3823801029482838', name: 'Indra Brugman Santoso', birthDate: '1988-10-19', gender: 'L', phone: '081399887766', address: 'Jl. Cempaka No. 8, Depok', bloodType: 'A', allergies: [], registeredAt: '2025-03-15' },
  { id: 'p-3', nik: '4531866269156288', name: 'Indah Wulandari', birthDate: '1995-02-14', gender: 'P', phone: '085712349876', address: 'Jl. Sudirman Gg. Melati No. 12, Jakarta', bloodType: 'B', allergies: [], registeredAt: '2025-03-20' },
  { id: 'p-4', nik: '8281987362777289', name: 'Arie Andreana', birthDate: '2002-05-21', gender: 'P', phone: '087811223344', address: 'Jl. Fatmawati Kav. 8, Jakarta Selatan', bloodType: 'AB', allergies: ['Iodine'], registeredAt: '2025-04-27' },
  { id: 'p-5', nik: '0000000000000001', name: 'M Hassan Basari', birthDate: '1979-01-30', gender: 'L', phone: '081976543210', address: 'Jl. Kenanga Raya No. 88, Jakarta Selatan', bloodType: 'O', allergies: [], registeredAt: '2025-05-01' },
  { id: 'p-6', nik: '-', name: 'Deliana Azizah', birthDate: '1990-07-07', gender: 'P', phone: '082211334455', address: 'Jl. Anggrek No. 3, Bekasi', bloodType: '-', allergies: [], registeredAt: '2025-06-11' },
  { id: 'p-7', nik: '1235212212324212', name: 'Jessica Milla', birthDate: '1999-03-03', gender: 'P', phone: '085611229988', address: 'Jl. Melati Indah No. 21, Tangerang', bloodType: 'A', allergies: [], registeredAt: '2025-06-30' },
  { id: 'p-8', nik: '3823932103129327', name: 'Aura Maharani', birthDate: '2004-11-25', gender: 'P', phone: '081377665544', address: 'Jl. Kenari No. 10, Jakarta Pusat', bloodType: 'O', allergies: ['Debu'], registeredAt: '2025-08-05' },
  { id: 'p-9', nik: '0090976890000000', name: 'Sarah Wati', birthDate: '1985-09-09', gender: 'P', phone: '085812345678', address: 'Jl. Dahlia No. 77, Bogor', bloodType: 'B', allergies: [], registeredAt: '2025-09-01' },
];

/* ==================== REGISTRASI ==================== */
export const INITIAL_REGISTRATIONS: Registration[] = [
  { id: 'reg-1', regDate: '2026-09-29T09:15:00', patientId: 'p-1', patientName: 'Alwi Nadhif Arasyid', group: 'Umum', serviceType: 'Pelayanan Dokter Gigi Umum', room: 'Poli Gigi 1', doctor: 'dr. Zaela', status: 'Registrasi' },
  { id: 'reg-2', regDate: '2026-09-28T10:00:00', patientId: 'p-7', patientName: 'Jessica Milla', group: 'BPJS Kesehatan', serviceType: 'Pelayanan Dokter Gigi Umum', room: 'Poli Gigi 2', doctor: 'Drg. Ayu Rosalia', status: 'Registrasi' },
  { id: 'reg-3', regDate: '2026-09-27T08:40:00', patientId: 'p-2', patientName: 'Indra Brugman Santoso', group: 'Umum', serviceType: 'Pelayanan Dokter Gigi Umum', room: 'Poli Konsultasi', doctor: 'dimas', status: 'Proses' },
];

/* ==================== BOOKING ==================== */
export const INITIAL_BOOKINGS: Booking[] = [
  { id: 'bk-1', patientName: 'Aura Maharani', phone: '081377665544', serviceType: 'Scaling', doctor: 'Drg. Ayu Rosalia', date: '2026-10-02', time: '10:00', status: 'Terjadwal', source: 'HelloDokterPintar', createdAt: '2026-09-28T14:20:00' },
  { id: 'bk-2', patientName: 'Sarah Wati', phone: '085812345678', serviceType: 'Konsultasi Gigi', doctor: 'dr. Zaela', date: '2026-10-05', time: '13:30', status: 'Menunggu Konfirmasi', source: 'BPJS', createdAt: '2026-09-29T08:00:00' },
  { id: 'bk-3', patientName: 'Indah Wulandari', phone: '085712349876', serviceType: 'Tambal Gigi', doctor: 'dr. Zaela', date: '2026-09-25', time: '09:00', status: 'Selesai', source: 'HelloDokterPintar', createdAt: '2026-09-20T11:00:00' },
  { id: 'bk-4', patientName: 'M Hassan Basari', phone: '081976543210', serviceType: 'Kontrol Behel', doctor: 'dimas', date: '2026-09-27', time: '15:00', status: 'Dibatalkan', source: 'Manual', createdAt: '2026-09-24T09:30:00' },
];

/* ==================== FARMASI ==================== */
export const INITIAL_MEDICINES: Medicine[] = [
  { id: 'med-1', code: 'OBT-001', name: 'Amoxicillin 500mg', category: 'Antibiotik', form: 'Kapsul', unit: 'Kapsul', stock: 120, minStock: 30, price: 3500, batchNumber: 'AMX-2026-09', expiryDate: '2027-08-30', supplier: 'PT. Indah Kasih' },
  { id: 'med-2', code: 'OBT-002', name: 'Asam Mefenamat 500mg', category: 'Analgesik', form: 'Tablet', unit: 'Tablet', stock: 85, minStock: 25, price: 4000, batchNumber: 'MEF-2026-02', expiryDate: '2027-05-15', supplier: 'PT. Indah Kasih' },
  { id: 'med-3', code: '001', name: 'Paracetamol 2', category: 'Analgesik', form: 'Tablet', unit: 'Botol', stock: 240, minStock: 50, price: 7200, batchNumber: 'PCT-2026-11', expiryDate: '2028-01-20', supplier: 'nadif' },
  { id: 'med-4', code: 'LDC-01', name: 'Lidocaine HCl 2% Injeksi', category: 'Anastesi', form: 'Injeksi', unit: 'Ampul', stock: 15, minStock: 20, price: 18000, batchNumber: 'LDC-2025-88', expiryDate: '2026-11-10', supplier: 'Supp' },
  { id: 'med-5', code: 'BHP5', name: 'ALKES 5', category: 'Alkes', form: 'Set', unit: 'Buah', stock: 12, minStock: 5, price: 95000, batchNumber: 'RES-2026-01', expiryDate: '2028-06-30', supplier: 'PT. Indah Kasih' },
  { id: 'med-6', code: 'GRT01', name: 'Grantusif', category: 'Lainnya', form: 'Sirup', unit: 'Botol', stock: 60, minStock: 20, price: 1100, batchNumber: 'CTF-2026-04', expiryDate: '2027-12-01', supplier: 'Supplier Z' },
  { id: 'med-7', code: 'OBT-007', name: 'Clindamycin 300mg', category: 'Antibiotik', form: 'Kapsul', unit: 'Kapsul', stock: 45, minStock: 15, price: 8500, batchNumber: 'CLN-2026-07', expiryDate: '2027-10-15', supplier: 'Tes10' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', code: 'PTIK', name: 'PT. Indah Kasih' },
  { id: 'sup-2', code: 'S01', name: 'Supp' },
  { id: 'sup-3', code: 'Z01', name: 'Supplier Z' },
  { id: 'sup-4', code: 'nadif001', name: 'nadif' },
  { id: 'sup-5', code: 'Tes10', name: 'Tes10' },
];

export const INITIAL_FACTORIES: Factory[] = [
  { id: 'fct-1', code: 'KFG', name: 'Kalbe Farma' },
  { id: 'fct-2', code: 'SNF', name: 'Sanbe Farma' },
  { id: 'fct-3', code: 'DXL', name: 'Dexa Medica' },
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'brd-1', code: 'CTM', name: 'Cetirizine' },
  { id: 'brd-2', code: 'CTF', name: 'Cataflam' },
  { id: 'brd-3', code: 'AMX', name: 'Amoxsan' },
];

export const INITIAL_PENERIMAAN: Penerimaan[] = [
  { id: 'rc-1', date: '2026-08-26', supplier: 'PT. Indah Kasih', faktur: 'F-88192', items: [{ id: 'it-1', code: 'OBT-001', name: 'Amoxicillin 500mg', qty: 50, price: 2500, batch: 'AMX-2026-09', expiry: '2027-08-30' }, { id: 'it-2', code: 'BHP5', name: 'ALKES 5', qty: 10, price: 80000, batch: 'RES-2026-01', expiry: '2028-06-30' }] },
  { id: 'rc-2', date: '2026-05-29', supplier: 'dd', faktur: '-', items: [{ id: 'it-3', code: 'GRT01', name: 'Grantusif', qty: 24, price: 900, batch: 'CTF-2026-04', expiry: '2027-12-01' }] },
  { id: 'rc-3', date: '2026-05-26', supplier: 'nadif', faktur: 'ep-0001', items: [{ id: 'it-4', code: '001', name: 'Paracetamol 2', qty: 40, price: 5500, batch: 'PCT-2026-11', expiry: '2028-01-20' }] },
  { id: 'rc-4', date: '2026-03-06', supplier: 'Supp', faktur: '-', items: [{ id: 'it-5', code: 'LDC-01', name: 'Lidocaine HCl 2% Injeksi', qty: 20, price: 15000, batch: 'LDC-2025-88', expiry: '2026-11-10' }] },
  { id: 'rc-5', date: '2025-12-30', supplier: 'dd', faktur: '-', items: [{ id: 'it-6', code: 'OBT-007', name: 'Clindamycin 300mg', qty: 30, price: 7000, batch: 'CLN-2026-07', expiry: '2027-10-15' }] },
  { id: 'rc-6', date: '2025-08-22', supplier: 'PT. Indah Kasih', faktur: '655464645', items: [{ id: 'it-7', code: 'OBT-002', name: 'Asam Mefenamat 500mg', qty: 60, price: 3200, batch: 'MEF-2026-02', expiry: '2027-05-15' }] },
];

export const INITIAL_PENGELUARAN: Pengeluaran[] = [
  { id: 'out-1', date: '2026-09-23', room: 'Poli Gigi 1', code: 'BHP5', name: 'ALKES 5', unit: 'Buah', qty: 5 },
  { id: 'out-2', date: '2026-08-31', room: 'Poli Gigi 2', code: 'BHP5', name: 'ALKES 5', unit: 'Buah', qty: 7 },
  { id: 'out-3', date: '2026-08-28', room: 'Poli Konsultasi', code: '102', name: 'Paracetamol XX', unit: 'Strip', qty: 1 },
  { id: 'out-4', date: '2026-08-28', room: 'Poli Konsultasi', code: '00290', name: 'Barang Baru', unit: 'Botol', qty: 1 },
  { id: 'out-5', date: '2026-08-26', room: 'Poli Gigi 1', code: '001', name: 'Paracetamol 2', unit: 'Botol', qty: 5 },
  { id: 'out-6', date: '2026-08-06', room: 'Apotek', code: 'GRT01', name: 'Grantusif', unit: 'pcs', qty: 10 },
];

export const INITIAL_PENYESUAIAN: Penyesuaian[] = [
  { id: 'adj-1', nota: '001', date: '2026-05-29', pic: 'dimas', items: [{ id: 'ai-1', code: 'LDC-01', name: 'Lidocaine HCl 2% Injeksi', stockBefore: 18, stockAfter: 15, reason: 'Rusak saat sterilisasi' }] },
  { id: 'adj-2', nota: 'Tes', date: '2025-12-30', pic: 'dimas', items: [{ id: 'ai-2', code: 'BHP5', name: 'ALKES 5', stockBefore: 14, stockAfter: 12, reason: 'Opname tahunan' }] },
  { id: 'adj-3', nota: '7s37373', date: '2025-10-09', pic: 'dr. Zaela', items: [{ id: 'ai-3', code: 'GRT01', name: 'Grantusif', stockBefore: 65, stockAfter: 60, reason: 'Expired 3 botol' }] },
];

export const INITIAL_RETUR: Retur[] = [
  { id: 'rt-1', date: '2026-07-15', type: 'Retur Penerimaan', items: [{ id: 'ri-1', code: 'OBT-002', name: 'Asam Mefenamat 500mg', qty: 5, reason: 'Kemasan rusak' }] },
  { id: 'rt-2', date: '2026-06-20', type: 'Retur Pengeluaran', items: [{ id: 'ri-2', code: 'BHP5', name: 'ALKES 5', qty: 2, reason: 'Batal dipakai' }] },
];

/* ==================== EMR (contoh isi rekam medis) ==================== */
export const SAMPLE_EMR: Record<string, EmrDocument> = {
  'reg-3': {
    regId: 'reg-3',
    anamnesaUmum: {
      riwayatPenyakit: 'Hipertensi terkontrol',
      keluhanUtama: 'Gigi geraham bawah kanan ngilu saat minum dingin',
      keluhanTambahan: 'Sering sakit kepala',
      penyakitSaatIni: 'Nyeri bertambah saat mengunyah sejak 3 hari',
      gravida: '-',
      alergi: { gatal: '', debu: '', obat: '', makanan: '', lainnya: '', udara: '' },
    },
    anamnesaOdontogram: {
      occlusi: 'Angle Class I',
      torusPlatinus: 'Tidak ada',
      torusMandibularis: 'Tidak ada',
      palatum: 'Normal',
      diastema: 'Diastema median superior 2mm',
      gigiAnomali: 'Gigi 12 rotated',
      lainLain: '-',
    },
    pemeriksaanUmum: {
      deskripsi: 'Kesadaran baik, komposisi normal',
      nadi: '80',
      tensiSistolik: '125',
      tensiDiastolik: '82',
      suhu: '36.7',
      beratBadan: '74',
      tinggiBadan: '170',
      pernapasan: '18',
      mata: 'Ikterik (-), anemia (-)',
      gigiMulut: 'Higiene oral sedang, karang gigi derajat 2',
      kulit: 'Warna normal, tidak ada lesi',
    },
    kondisi: [{ id: 'kd-1', toothNumber: 46, deskripsi: 'Kavitas oklusal dalam, dentin terbuka' }],
    odontogram: {
      46: { toothNumber: 46, condition: 'caries', surfaces: { center: 'caries' }, notes: 'Karies dentin oklusal' },
      16: { toothNumber: 16, condition: 'filling_amalgam', surfaces: { center: 'filling_amalgam' } },
    },
    diagnosa: [{ id: 'dg-1', type: 'Diagnosa dokter', icd10Code: 'K02.1', icd10Desc: 'Karies dentis' }],
    tindakan: [{ id: 'tn-1', code: 'PK0053', name: 'JPKM', tooth: '46', qty: 1, price: 350000, discount: 0 }],
    alkes: [{ id: 'al-1', code: 'BHP5', name: 'ALKES 5', qty: 1, price: 95000 }],
    resepApotek: [
      { date: '2026-09-28', items: [
        { id: 'rx-1', code: 'GRT01', name: 'Grantusif', qty: 4, price: 1100 },
        { id: 'rx-2', code: '001', name: 'Paracetamol 2', qty: 5, price: 7200 },
      ] },
    ],
    resepRujukan: [],
    cppt: [
      { id: 'cp-1', datetime: '2026-09-27T09:30:00', ppa: 'dimas', profesi: 'Dokter Gigi', subjektif: 'Pasien keluhan ngilu gigi 46', objektif: 'Kavitas oklusal 46 dentin terbuka, perkusi (-)', asesmen: 'K02.1 Karies dentis 46', plan: 'Restorasi komposit, edukasi higiene oral' },
      { id: 'cp-2', datetime: '2026-09-27T11:16:00', ppa: 'dimas', profesi: 'Dokter', subjektif: 'Kontrol pasca tindakan', objektif: 'Restorasi baik, oklusi pas', asesmen: 'Post restorasi 46', plan: 'Kontrol 6 bulan' },
    ],
    dokumen: { generalConsent: true, asesmenAwal: true, informedConsent: true, asesmenPraTindakan: false, surgicalSafety: false },
    photoCount: 2,
  },
};

/* ==================== BILLING ==================== */
export const INITIAL_INVOICES: Invoice[] = [
  { id: 'inv-1', visitId: 'reg-1', patientId: 'p-1', patientName: 'Alwi Nadhif Arasyid', date: '2026-09-29', group: 'Umum', doctor: 'dr. Zaela', consultationFee: 100000, procedureFee: 350000, alkesFee: 95000, medicineFee: 40400, discount: 0, total: 585400, paymentStatus: 'Belum Dibayar' },
  { id: 'inv-2', visitId: 'reg-3', patientId: 'p-2', patientName: 'Indra Brugman Santoso', date: '2026-09-28', group: 'Umum', doctor: 'dimas', consultationFee: 100000, procedureFee: 350000, alkesFee: 95000, medicineFee: 40400, discount: 50000, total: 545400, paymentStatus: 'Lunas', paymentMethod: 'QRIS', paidAt: '2026-09-28' },
];

export const INITIAL_APOTEK_INVOICES: ApotekInvoice[] = [
  { id: 'ap-1', date: '2026-09-29', type: 'Obat Resep', patientName: 'Alwi Nadhif Arasyid', items: [{ id: 'apx-1', name: 'Grantusif', qty: 4, price: 1100 }, { id: 'apx-2', name: 'Paracetamol 2', qty: 5, price: 7200 }], total: 40400, paymentStatus: 'Lunas' },
  { id: 'ap-2', date: '2026-09-29', type: 'Obat Bebas', patientName: 'Nida', items: [{ id: 'apx-3', name: 'Paracetamol 2', qty: 2, price: 7200 }], total: 14400, paymentStatus: 'Belum Dibayar' },
];

export const INITIAL_CLAIMS: InsuranceClaim[] = [
  { id: 'cl-1', patientName: 'Jessica Milla', penjamin: 'BPJS Kesehatan', amount: 425000, status: 'Diajukan', date: '2026-09-28' },
  { id: 'cl-2', patientName: 'Aura Maharani', penjamin: 'BPJS Kesehatan', amount: 310000, status: 'Dibayar', date: '2026-09-20' },
  { id: 'cl-3', patientName: 'Sarah Wati', penjamin: 'Asuransi Swasta', amount: 650000, status: 'Diproses', date: '2026-09-15' },
];

/* ==================== SURAT & RUJUKAN ==================== */
export const INITIAL_LETTERS: Letter[] = [
  { id: 'ltr-1', kind: 'Surat Sakit', patientName: 'Alwi Nadhif Arasyid', doctor: 'dr. Zaela', date: '2026-09-28', notes: 'Istirahat 2 hari setelah pencabutan gigi 38' },
  { id: 'ltr-2', kind: 'Surat Sehat', patientName: 'Jessica Milla', doctor: 'dimas', date: '2026-09-20', notes: 'Sehat untuk melamar pekerjaan' },
];

export const INITIAL_REFERRALS: Referral[] = [
  { id: 'ref-1', kind: 'Rujukan ke Fasilitas Lain', patientName: 'Indra Brugman Santoso', doctor: 'dimas', destination: 'RSUD Pasar Minggu', diagnosis: 'K04.0 Pulpitis irreversible gigi 36', date: '2026-09-27' },
];

/* ==================== PENGATURAN ==================== */
export const INITIAL_ROOMS: Room[] = [
  { id: 'rm-1', name: 'Poli Konsultasi' },
  { id: 'rm-2', name: 'Poli drg. Dian' },
  { id: 'rm-3', name: 'Poli 123' },
  { id: 'rm-4', name: 'Poli Administratif', satusehat: true },
  { id: 'rm-5', name: 'Poli Gigi 1' },
  { id: 'rm-6', name: 'Poli Konsultasi 2' },
  { id: 'rm-7', name: 'Poli Konsultasi 3' },
  { id: 'rm-8', name: 'Poli Konsultasi 5' },
];

export const INITIAL_SERVICES: Service[] = [
  { id: 'svc-1', code: 'PK0001', name: 'Konsultasi Dokter Gigi', price: 100000, room: 'Poli Gigi 1' },
  { id: 'svc-2', code: 'PK0053', name: 'JPKM (Jasa Pelayanan Kedokteran Gigi)', price: 350000, room: 'Poli Gigi 1' },
  { id: 'svc-3', code: 'PK0022', name: 'Pencabutan Gigi', price: 250000, room: 'Poli Gigi 2' },
  { id: 'svc-4', code: 'PK0040', name: 'Scaling & Polishing', price: 300000, room: 'Poli Gigi 2' },
  { id: 'svc-5', code: 'PK0012', name: 'Konsultasi Dokter Umum', price: 75000, room: 'Poli Konsultasi' },
];

export const INITIAL_PACKAGES: ServicePackage[] = [
  { id: 'pkg-1', name: 'Paket Hemat', totalSessions: 5, usedSessions: 1, price: 750000, patientName: 'Alwi Nadhif Arasyid' },
  { id: 'pkg-2', name: 'Paket Scaling Keluarga', totalSessions: 4, usedSessions: 4, price: 1100000, patientName: 'Keluarga Santoso' },
];

export const INITIAL_DISCOUNTS: ServiceDiscount[] = [
  { id: 'dsc-1', name: 'Diskon Member 10%', percent: 10, appliesTo: 'Semua Pelayanan', active: true },
  { id: 'dsc-2', name: 'Promo Ulang Tahun 15%', percent: 15, appliesTo: 'Paket Pelayanan', active: true },
  { id: 'dsc-3', name: 'Diskon BPJS (khusus tindakan)', percent: 0, appliesTo: 'Pelayanan', active: false },
];

export const INITIAL_STAFF: Staff[] = [
  { id: 'stf-1', name: 'dr. Zaela', role: 'Dokter Gigi', room: 'Poli Gigi 1', sip: 'SIP.445.1/DS/2025', active: true },
  { id: 'stf-2', name: 'Drg. Ayu Rosalia', role: 'Dokter Gigi', room: 'Poli Gigi 2', sip: 'SIP.445.2/DS/2025', active: true },
  { id: 'stf-3', name: 'dimas', role: 'Dokter Umum', room: 'Poli Konsultasi', sip: 'SIP.445.3/DS/2025', active: true },
  { id: 'stf-4', name: 'dokter made', role: 'Dokter Gigi', room: 'Poli Gigi 1', sip: 'SIP.445.4/DS/2025', active: true },
  { id: 'stf-5', name: 'Ns. Ratna Sari', role: 'Perawat', room: 'Poli Administratif', active: true },
  { id: 'stf-6', name: 'Sinta Dewi', role: 'Apoteker', room: 'Apotek', active: false },
];

export const INITIAL_SCHEDULES: StaffSchedule[] = [
  { id: 'sch-1', staffName: 'dr. Zaela', day: 'Senin', startTime: '08:00', endTime: '14:00', room: 'Poli Gigi 1' },
  { id: 'sch-2', staffName: 'dr. Zaela', day: 'Rabu', startTime: '13:00', endTime: '20:00', room: 'Poli Gigi 1' },
  { id: 'sch-3', staffName: 'Drg. Ayu Rosalia', day: 'Selasa', startTime: '08:00', endTime: '14:00', room: 'Poli Gigi 2' },
  { id: 'sch-4', staffName: 'dimas', day: 'Senin', startTime: '16:00', endTime: '21:00', room: 'Poli Konsultasi' },
  { id: 'sch-5', staffName: 'dimas', day: 'Kamis', startTime: '08:00', endTime: '14:00', room: 'Poli Konsultasi' },
];

/* ==================== REFERENSI ICD ==================== */
export const ICD10_LIST = [
  { code: 'K02.1', desc: 'Caries of dentine (Karies Dentin)' },
  { code: 'K04.0', desc: 'Pulpitis (Radang Pulpa Gigi)' },
  { code: 'K05.1', desc: 'Chronic gingivitis (Radang Gusi Kronis)' },
  { code: 'K05.3', desc: 'Chronic periodontitis (Periodontitis Kronis)' },
  { code: 'K01.1', desc: 'Impacted teeth (Gigi Impaksi)' },
  { code: 'K08.1', desc: 'Loss of teeth due to accident/extraction (Kehilangan Gigi)' },
  { code: 'J00', desc: 'Acute nasopharyngitis [common cold]' },
  { code: 'J02.9', desc: 'Acute pharyngitis, unspecified' },
  { code: 'I10', desc: 'Essential (primary) hypertension' },
  { code: 'E11', desc: 'Non-insulin-dependent diabetes mellitus' },
  { code: 'K29.7', desc: 'Gastritis, unspecified' },
  { code: 'R50.9', desc: 'Fever, unspecified' },
];

export const ICD9_LIST = [
  { code: '23.2', desc: 'Restoration of tooth by filling (Tambal Komposit)' },
  { code: '23.70', desc: 'Root canal therapy, not otherwise specified (Perawatan Saluran Akar)' },
  { code: '23.09', desc: 'Extraction of other tooth (Pencabutan Gigi)' },
  { code: '96.54', desc: 'Dental scaling and polishing (Pembersihan Karang Gigi)' },
  { code: '89.07', desc: 'General physical examination' },
  { code: '89.38', desc: 'Dental examination and consultation' },
];
