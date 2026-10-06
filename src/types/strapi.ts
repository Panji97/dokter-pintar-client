/**
 * Tipe respons Strapi v5 (flat, tanpa wrapper `attributes`).
 * Sama seperti yang dikonsumsi hris-client-sakai:
 * - `data` berisi entitas flat (punya `id` numerik + `documentId`)
 * - `meta.pagination` untuk list
 */
export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiEntity<T> {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  [key: string]: unknown;
  // allow spreading into domain type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}

export interface StrapiSingleResponse<T> {
  data: (StrapiEntity<T> & T) | null;
  meta: Record<string, unknown>;
}

export interface StrapiListResponse<T> {
  data: Array<StrapiEntity<T> & T>;
  meta: {
    pagination: StrapiPagination;
  };
}

export interface StrapiErrorResponse {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details?: unknown;
  };
}

/** Query params generik untuk useFetch (filters/populate/pagination/sort). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StrapiQueryParams = Record<string, any>;
