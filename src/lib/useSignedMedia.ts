'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSignedMediaUrls } from './strapi';

interface CacheEntry {
  url: string;
  /** Epoch ms saat entri dianggap kedaluwarsa (sudah dikurangi buffer). */
  exp: number;
}

/** Refresh 5 menit sebelum URL tercepat mati agar <img> tak sempat 403. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

function wantedIds(key: string): string[] {
  return key ? key.split(',') : [];
}

/**
 * Batch presigned URL untuk file private MinIO, dengan cache + refresh otomatis.
 * @returns peta id-file → signedUrl (id yang ditolak server tak ada di peta).
 */
export function useSignedMediaUrls(ids: (number | string)[]): Record<string, string> {
  const key = useMemo(() => [...new Set(ids.map(String))].sort().join(','), [ids]);
  const [tick, setTick] = useState(0);
  const [store, setStore] = useState<Record<string, CacheEntry>>({});

  useEffect(() => {
    const wanted = wantedIds(key);
    if (wanted.length === 0) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) setTick((t) => t + 1);
    };
    document.addEventListener('visibilitychange', onVisible);

    const now = Date.now();
    const missing = wanted.filter((id) => {
      const e = store[id];
      return !e || e.exp <= now;
    });

    if (missing.length === 0) {
      // Semua masih segar — cukup jadwalkan refresh sebelum tercepat mati.
      const exps = wanted
        .map((id) => store[id]?.exp)
        .filter((e): e is number => typeof e === 'number');
      if (exps.length > 0) {
        const delay = Math.min(...exps) - Date.now();
        if (delay > 0 && delay < 2 ** 31) {
          timer = setTimeout(() => {
            if (!cancelled) setTick((t) => t + 1);
          }, delay);
        }
      }
      return () => {
        cancelled = true;
        document.removeEventListener('visibilitychange', onVisible);
        if (timer) clearTimeout(timer);
      };
    }

    getSignedMediaUrls(missing)
      .then((res) => {
        if (cancelled) return;
        const at = Date.now();
        setStore((prev) => {
          const next = { ...prev };
          for (const r of res) {
            next[String(r.id)] = {
              url: r.signedUrl,
              exp: at + Math.max(60, r.expiresIn) * 1000 - REFRESH_BUFFER_MS,
            };
          }
          return next;
        });
      })
      .catch(() => {
        /* offline/ditolak — tampilkan skeleton, coba lagi saat key berubah */
      });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (timer) clearTimeout(timer);
    };
  }, [key, tick, store]);

  // Murni: hanya proyeksikan store ke id yang diminta (tanpa cek waktu di render).
  // Entri kedaluwarsa diganti via effect (refresh terjadwal + saat tab terlihat).
  return useMemo(() => {
    const out: Record<string, string> = {};
    for (const id of wantedIds(key)) {
      const url = store[id]?.url;
      if (url) out[id] = url;
    }
    return out;
  }, [key, store]);
}
