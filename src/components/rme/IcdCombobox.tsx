'use client';

import { useEffect, useRef, useState } from 'react';
import qs from 'qs';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';
import { getLocalStorage } from '@/lib/storage';
import { handleUnauthorized } from '@/lib/auth';
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

const PAGE_SIZE = 50;

interface IcdRow {
  documentId: string;
  code: string;
  desc: string;
  category: 'ICD-10' | 'ICD-9';
}

async function fetchIcdPage(
  keyword: string,
  page: number,
  category: 'ICD-10' | 'ICD-9',
): Promise<{ items: IcdItem[]; total: number }> {
  const jwt = getLocalStorage('jwt');
  const query: Record<string, unknown> = {
    sort: ['code:asc'],
    pagination: { page, pageSize: PAGE_SIZE },
    filters: { category: { $eq: category } },
  };
  const q = keyword.trim();
  if (q) {
    // Pola HRIS LazyDropdown: $or containsi per kolom + debounce di pemanggil.
    (query.filters as Record<string, unknown>).$or = [
      { code: { $containsi: q } },
      { desc: { $containsi: q } },
    ];
  }
  const params = qs.stringify(query, { encodeValuesOnly: true });
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ''}${STRAPI_ENDPOINTS.icd}?${params}`,
    { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} },
  );
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi kedaluwarsa. Silakan masuk kembali.');
  }
  const json = (await res.json()) as {
    data?: IcdRow[];
    meta?: { pagination?: { total?: number } };
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json?.error?.message || 'Gagal memuat ICD.');
  return {
    items: (json.data ?? []).map((e) => ({
      id: e.documentId,
      code: e.code,
      desc: e.desc,
      category: e.category,
    })),
    total: json.meta?.pagination?.total ?? 0,
  };
}

/**
 * Dropdown ICD dengan search di dalam + lazy load per halaman —
 * port pola HRIS `LazyDropdown` (PrimeReact Dropdown + virtualScroller lazy)
 * ke Tailwind murni: debounce search server-side, infinite scroll via
 * IntersectionObserver, tanpa batas 200 baris.
 */
export function IcdCombobox({
  value,
  onChange,
  category = 'ICD-10',
  placeholder = '— Pilih kode ICD —',
  disabled = false,
}: IcdComboboxProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<IcdItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<IcdItem | null>(null);
  const [selectedFor, setSelectedFor] = useState<string | null>(null);
  const [cached, setCached] = useState<Record<string, IcdItem>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = items.length < total;

  // Debounce keyword ala HRIS (500ms) — ganti halaman ke 1 di handler.
  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(() => setDebounced(keyword), 400);
    return () => window.clearTimeout(t);
  }, [keyword, open]);

  // Muat halaman berjalan (ganti saat search, tambah saat scroll).
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    fetchIcdPage(debounced, page, category)
      .then((res) => {
        if (cancelled) return;
        setCached((prev) => {
          const next = { ...prev };
          for (const it of res.items) next[it.code] = it;
          return next;
        });
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Gagal memuat ICD.');
      });
    return () => {
      cancelled = true;
    };
  }, [open, debounced, page, category]);

  // Sinkron label pilihan dari kode (cache dulu, exact-fetch bila belum ada).
  if (selectedFor !== value) {
    setSelectedFor(value);
    const hit = value ? cached[value] ?? null : null;
    setSelected(hit);
    if (value && !hit) {
      void fetchIcdPage(value, 1, category)
        .then((res) => {
          const exact = res.items.find((it) => it.code === value) ?? null;
          if (exact) setCached((prev) => ({ ...prev, [exact.code]: exact }));
          setSelected((prev) => (prev?.code === value || !prev ? exact : prev));
        })
        .catch(() => {});
    }
  }

  // Infinite scroll: halaman berikut saat sentinel terlihat.
  useEffect(() => {
    if (!open) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          setLoading(true);
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '120px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  });

  const openPanel = () => {
    if (disabled) return;
    if (items.length === 0) setLoading(true);
    setError(null);
    setOpen(true);
  };

  const pick = (it: IcdItem) => {
    setCached((prev) => ({ ...prev, [it.code]: it }));
    setSelected(it);
    setSelectedFor(it.code);
    onChange(it.code, it);
    setOpen(false);
    setKeyword('');
    setDebounced('');
    setPage(1);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 bg-white flex items-center justify-between gap-2 text-left disabled:opacity-60"
      >
        <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected ? `${selected.code} — ${selected.desc}` : value ? value : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  autoFocus
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setPage(1);
                    setLoading(true);
                  }}
                  placeholder="Cari kode / deskripsi…"
                  aria-label="Cari kode ICD"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-400"
                />
              </div>
            </div>
            <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
              {items.map((it) => {
                const active = it.code === value;
                return (
                  <li key={it.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(it)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 transition ${
                        active ? 'bg-teal-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-teal-700 shrink-0 mt-0.5">{it.code}</span>
                      <span className="flex-1 min-w-0 text-xs text-slate-700">{it.desc}</span>
                      {active && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                    </button>
                  </li>
                );
              })}
              {items.length === 0 && !loading && (
                <li className="px-3 py-6 text-center text-xs text-slate-400">
                  {error ?? (total === 0 && !debounced ? 'Master ICD di API masih kosong.' : 'Tidak ada kode yang cocok dengan pencarian.')}
                </li>
              )}
              {error && items.length > 0 && (
                <li className="px-3 py-2 text-center text-[11px] text-rose-600">{error}</li>
              )}
              <div ref={sentinelRef} aria-hidden />
              {loading && (
                <li className="px-3 py-2.5 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat…
                </li>
              )}
              {!loading && !hasMore && items.length > 0 && (
                <li className="px-3 py-2 text-center text-[10px] text-slate-300">
                  {items.length} dari {total} kode
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
