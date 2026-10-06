'use client';

/**
 * API client Strapi — port langsung dari hris-client-sakai/helpers/fetcher.ts
 * (fetch + SWR + qs, tanpa axios).
 *
 * - Base URL: process.env.NEXT_PUBLIC_STRAPI_URL
 * - JWT dari localStorage 'jwt' (cookie 'jwt' untuk SSR guard)
 * - Respons Strapi v5 flat: response.data + response.meta.pagination,
 *   identitas update/delete pakai `documentId`.
 *
 * Satu-satunya perbaikan vs HRIS: useDelete tahan terhadap respons 204
 * body kosong Strapi v5 (HRIS menanganinya manual per halaman).
 */
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import qs from 'qs';
import { getLocalStorage, setCookie, setLocalStorage, clearStrapiSession } from './storage';
import { STRAPI_ENDPOINTS } from './strapi-endpoints';

export const STRAPI_SESSION_EVENT = 'strapi-session-changed';

function notifySessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STRAPI_SESSION_EVENT));
  }
}

/** Status sesi Strapi (JWT di localStorage). Berubah otomatis saat login/logout. */
export function useStrapiSession() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      setJwt(getLocalStorage('jwt'));
      setReady(true);
    };
    read();
    window.addEventListener(STRAPI_SESSION_EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(STRAPI_SESSION_EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, []);

  const refresh = useCallback(() => setJwt(getLocalStorage('jwt')), []);

  return { jwt, connected: !!jwt, ready, refresh };
}

const baseUrl = () => process.env.NEXT_PUBLIC_STRAPI_URL ?? '';

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const jwt = getLocalStorage('jwt');
  return jwt ? { Authorization: `Bearer ${jwt}`, ...extra } : { ...extra };
}

async function parseBodySafe(res: Response) {
  // Strapi v5 DELETE sukses = 204 tanpa body -> jangan panggil .json()
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const useFetch = (
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryParams: any = {},
  options: {
    revalidateOnFocus?: boolean;
    revalidateIfStale?: boolean;
    revalidateOnReconnect?: boolean;
    refreshInterval?: number;
  } = {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  },
) => {
  const fetcher = async (urlWithParams: string) => {
    const res = await fetch(`${baseUrl()}${urlWithParams}`, {
      headers: authHeaders(),
    });
    return res.json();
  };

  const queryString = qs.stringify(queryParams, {
    skipNulls: true,
    encodeValuesOnly: true,
  });

  const fullUrl = queryString ? `${url}?${queryString}` : url;

  const { data, error, isLoading, mutate } = useSWR(fullUrl, fetcher, {
    revalidateOnFocus: options.revalidateOnFocus,
    revalidateIfStale: options.revalidateIfStale,
    revalidateOnReconnect: options.revalidateOnReconnect,
    refreshInterval: options.refreshInterval,
  });

  return { data, error, isLoading, mutate };
};

export const usePost = (url: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postData = async (body: any) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(baseUrl() + url, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      const result = await response.json();

      setMessage(result.message);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { postData, loading, error, message };
};

export const useUpdate = (url: string, method: 'PUT' | 'PATCH' = 'PUT') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData = async (body: any, id?: string | number) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const jwt = getLocalStorage('jwt');
      const apiUrl = id ? `${baseUrl()}${url}/${id}` : baseUrl() + url;

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(body),
      });

      const result = await parseBodySafe(response);

      if (!response.ok) {
        throw new Error(
          (result as { message?: string })?.message || 'Failed to update data',
        );
      }

      setMessage((result as { message?: string })?.message ?? null);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateData, loading, error, message };
};

export const useDelete = (url: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const deleteData = async (id?: string | number) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const jwt = getLocalStorage('jwt');
      const apiUrl = id ? `${baseUrl()}${url}/${id}` : baseUrl() + url;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });

      const result = await parseBodySafe(response);

      if (!response.ok) {
        throw new Error(
          (result as { message?: string })?.message || 'Failed to delete data',
        );
      }

      setMessage((result as { message?: string })?.message ?? null);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteData, loading, error, message };
};

/* ============ AUTH (mirror hris-client-sakai login/page.tsx) ============ */

export interface StrapiLoginResponse {
  jwt: string;
  user: { id: number; username: string; email: string };
}

/** POST /api/auth/local -> simpan ganda cookie jwt + localStorage jwt/user */
export async function loginStrapi(identifier: string, password: string) {
  const loginResponse = await fetch(`${baseUrl()}${STRAPI_ENDPOINTS.authLocal}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const loginData = (await loginResponse.json()) as StrapiLoginResponse & {
    error?: { message?: string };
  };
  if (!loginResponse.ok || (loginData as { error?: unknown }).error) {
    throw new Error(
      (loginData as { error?: { message?: string } }).error?.message || 'Login gagal.',
    );
  }

  const meQuery = qs.stringify(
    { populate: { role: { fields: ['name'] } } },
    { skipNulls: true, encodeValuesOnly: true },
  );
  const meResponse = await fetch(`${baseUrl()}${STRAPI_ENDPOINTS.usersMe}?${meQuery}`, {
    headers: { Authorization: `Bearer ${loginData.jwt}` },
  });
  const meData = await meResponse.json();

  setCookie('jwt', loginData.jwt, 7);
  setLocalStorage('jwt', loginData.jwt);
  setLocalStorage('user', JSON.stringify(meData));
  notifySessionChanged();

  return { jwt: loginData.jwt, user: meData };
}

export function logoutStrapi() {
  clearStrapiSession();
  notifySessionChanged();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

/** Upload file ke Strapi POST /api/upload (FormData, tanpa Content-Type manual). */
export async function uploadToStrapi(files: File | File[]): Promise<number[]> {
  const jwt = getLocalStorage('jwt');
  const formData = new FormData();
  (Array.isArray(files) ? files : [files]).forEach((f) => formData.append('files', f));

  const headers: Record<string, string> = {};
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

  const res = await fetch(`${baseUrl()}${STRAPI_ENDPOINTS.upload}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const media = await res.json();
  if (!res.ok) throw new Error(media?.error?.message || 'Upload gagal.');
  return (Array.isArray(media) ? media : [media]).map((m: { id: number }) => m.id);
}
