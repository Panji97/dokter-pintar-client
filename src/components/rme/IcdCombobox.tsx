'use client';

import { Check } from 'lucide-react';
import { LazyDropdown, type RawEntity } from '@/components/ui/lazy-dropdown';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import type { IcdItem } from '@/types/clinic';

interface IcdComboboxProps {
  /** Kode ICD terpilih ('' = belum pilih). */
  value: string;
  onChange: (code: string, item: IcdItem | null) => void;
  category?: 'ICD-10' | 'ICD-9';
  placeholder?: string;
  disabled?: boolean;
}

const str = (v: unknown): string =>
  typeof v === 'string' ? v : v == null ? '' : String(v);

function toIcd(raw: RawEntity): IcdItem {
  return {
    id: str(raw.documentId),
    code: str(raw.code),
    desc: str(raw.desc),
    category: str(raw.category) === 'ICD-9' ? 'ICD-9' : 'ICD-10',
  };
}

/**
 * Dropdown ICD dengan search di dalam + lazy load per halaman
 * (pola HRIS `LazyDropdown`). Tipis di atas `LazyDropdown` generik —
 * API props tidak berubah.
 */
export function IcdCombobox({
  value,
  onChange,
  category = 'ICD-10',
  placeholder = '— Pilih kode ICD —',
  disabled = false,
}: IcdComboboxProps) {
  return (
    <LazyDropdown
      endpoint={STRAPI_ENDPOINTS.icd}
      searchFields={['code', 'desc']}
      staticFilters={{ category: { $eq: category } }}
      sort={['code:asc']}
      pageSize={50}
      faskesScoped={false}
      value={value}
      onChange={(code, raw) => onChange(code, raw ? toIcd(raw) : null)}
      getValue={(r) => str(r.code)}
      valueField="code"
      getLabel={(r) => `${str(r.code)} — ${str(r.desc)}`}
      placeholder={placeholder}
      searchPlaceholder="Cari kode / deskripsi…"
      emptyText="Tidak ada kode yang cocok dengan pencarian."
      disabled={disabled}
      ariaLabel="Kode ICD"
      renderOption={(r, active) => (
        <>
          <span className="font-mono text-xs font-bold text-teal-700 shrink-0 mt-0.5">
            {str(r.code)}
          </span>
          <span className="flex-1 min-w-0 text-xs text-slate-700">{str(r.desc)}</span>
          {active && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
        </>
      )}
    />
  );
}
