'use client';

import { useMemo } from 'react';
import { useFetch } from './strapi';
import { STRAPI_ENDPOINTS } from './strapi-endpoints';
import type { IcdItem } from '@/types/clinic';

interface StrapiIcdEntity {
  id: number;
  documentId: string;
  code: string;
  desc: string;
  category: 'ICD-10' | 'ICD-9';
}

interface StrapiIcdList {
  data: StrapiIcdEntity[];
}

/**
 * Master ICD dari API Strapi — pengganti `lib/icd.ts` hardcode.
 *
 * - Sumber: GET /api/ms-icds (collection `ms-icd`, global tanpa faskes).
 * - Filter kategori di server; pencarian kode/deskripsi di client
 *   agar tidak request per keystroke.
 */
export function useIcdList(category: 'ICD-10' | 'ICD-9' = 'ICD-10') {
  const { data, error, isLoading, mutate } = useFetch(
    STRAPI_ENDPOINTS.icd,
    {
      sort: ['code:asc'],
      'pagination[pageSize]': 200,
      'filters[category][$eq]': category,
    },
    { revalidateOnFocus: false },
  );

  const items: IcdItem[] = useMemo(() => {
    const rows = (data as StrapiIcdList | undefined)?.data ?? [];
    return rows.map((e) => ({
      id: e.documentId,
      code: e.code,
      desc: e.desc,
      category: e.category,
    }));
  }, [data]);

  return { items, isLoading, error: error as Error | undefined, mutate };
}

/** Saring daftar ICD theo kata kunci kode/deskripsi (case-insensitive). */
export function filterIcd(items: IcdItem[], keyword: string): IcdItem[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (c) => c.code.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q),
  );
}
