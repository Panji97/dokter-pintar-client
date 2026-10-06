/**
 * Referensi kode ICD-10 & ICD-9 — daftar statis (bukan data mock).
 * Belum ada modul Strapi untuk ini; dipindah dari mockData yang dihapus.
 */
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
