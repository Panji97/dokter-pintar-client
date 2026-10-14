'use client';

import { useMemo } from 'react';
import { useFetch } from './strapi';
import { STRAPI_ENDPOINTS } from './strapi-endpoints';
import type { OptionItem } from '@/types/clinic';

interface StrapiOptionEntity {
  id: number;
  documentId: string;
  group: string;
  value: string;
  label: string;
  urutan: number | null;
}

interface StrapiOptionList {
  data: StrapiOptionEntity[];
}

/**
 * Opsi dropdown dari API Strapi — SEMUA opsi dropdown wajib dari sini,
 * tidak boleh hardcode di komponen.
 *
 * Sumber: GET /api/ms-options?filters[group]=<group>, urut `urutan`.
 */
export function useOptionGroup(group: string) {
  // Seed data memakai camelCase ("paymentMethod") sedangkan pemanggil memakai
  // kebab-case ("payment-method") — cari kedua varian agar dropdown terisi
  // apa pun konvensi seed-nya.
  const camel = group.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
  const variants = [...new Set([group, camel])];
  const { data, error, isLoading, mutate } = useFetch(
    STRAPI_ENDPOINTS.options,
    {
      sort: ['urutan:asc'],
      'pagination[pageSize]': 200,
      filters: { $or: variants.map((v) => ({ group: { $eq: v } })) },
    },
    { revalidateOnFocus: false },
  );

  const items: OptionItem[] = useMemo(() => {
    const rows = (data as StrapiOptionList | undefined)?.data ?? [];
    return rows.map((e) => ({
      id: e.documentId,
      group: e.group,
      value: e.value,
      label: e.label,
      urutan: e.urutan ?? 0,
    }));
  }, [data]);

  return { items, isLoading, error: error as Error | undefined, mutate };
}
