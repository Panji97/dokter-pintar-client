'use client';

import { useEffect, useRef, useState } from 'react';
import qs from 'qs';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';
import { getLocalStorage } from '@/lib/storage';
import { getSession, handleUnauthorized } from '@/lib/auth';

/**
 * Entitas mentah Strapi v5 (flat): `documentId` + kolom dinamis.
 * Preset di `entity-dropdowns.tsx` memetakan kolom ke label/value.
 */
export type RawEntity = {
  documentId: string;
  [key: string]: unknown;
};

const str = (v: unknown): string =>
  typeof v === 'string' ? v : v == null ? '' : String(v);

interface FetchOpts {
  endpoint: string;
  keyword: string;
  /** Filter exact untuk resolve label pilihan (mis. { code: { $eq: 'A00.0' } }). */
  match?: Record<string, unknown>;
  page: number;
  pageSize: number;
  searchFields: string[];
  staticFilters?: Record<string, unknown>;
  sort: string[];
  faskesScoped: boolean;
}

async function fetchEntities(o: FetchOpts): Promise<{ items: RawEntity[]; total: number }> {
  const jwt = getLocalStorage('jwt');
  const filters: Record<string, unknown> = { ...(o.staticFilters ?? {}), ...(o.match ?? {}) };
  if (o.faskesScoped) {
    const faskesId = getSession()?.faskes?.documentId ?? '';
    if (faskesId) filters.faskes = { documentId: { $eq: faskesId } };
  }
  const q = o.keyword.trim();
  if (q) {
    // Pola HRIS LazyDropdown: $or containsi per kolom pencarian.
    filters.$or = o.searchFields.map((f) => ({ [f]: { $containsi: q } }));
  }
  const params = qs.stringify(
    { sort: o.sort, pagination: { page: o.page, pageSize: o.pageSize }, filters },
    { encodeValuesOnly: true },
  );
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ''}${o.endpoint}?${params}`,
    { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} },
  );
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi kedaluwarsa. Silakan masuk kembali.');
  }
  const json = (await res.json()) as {
    data?: RawEntity[];
    meta?: { pagination?: { total?: number } };
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json?.error?.message || 'Gagal memuat data.');
  return { items: json.data ?? [], total: json.meta?.pagination?.total ?? 0 };
}

export interface LazyDropdownProps {
  /** Endpoint Strapi, mis. '/api/patients'. */
  endpoint: string;
  /** Kolom yang dicari server-side, mis. ['name', 'nik']. */
  searchFields: string[];
  /** Nilai terpilih — dibandingkan dengan `getValue(raw)`. */
  value: string;
  /** Dipanggil saat user memilih (null saat dibersihkan — tak dipakai di sini). */
  onChange: (value: string, raw: RawEntity | null) => void;
  getValue?: (raw: RawEntity) => string;
  getLabel: (raw: RawEntity) => string;
  /** Kunci unik baris (default = getValue). Isi documentId bila value tak unik. */
  getKey?: (raw: RawEntity) => string;
  /** Baris kecil di bawah label (NIK, harga, stok, ...). */
  getSub?: (raw: RawEntity) => string;
  /** Kolom untuk resolve label pilihan via exact-fetch. Default = kolom getValue. */
  valueField?: string;
  /** Filter statis tambahan, mis. { role: { $in: [...] } }. */
  staticFilters?: Record<string, unknown>;
  sort?: string[];
  pageSize?: number;
  /** True = sekat `filters[faskes][documentId]` milik user login (default true). */
  faskesScoped?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Render baris opsi kustom (mis. gaya kode ICD mono). */
  renderOption?: (raw: RawEntity, active: boolean) => React.ReactNode;
}

/**
 * Dropdown generik dengan search di dalam + lazy load per halaman —
 * port pola HRIS `LazyDropdown` (PrimeReact Dropdown + virtualScroller lazy)
 * ke Tailwind murni: debounce search server-side, infinite scroll via
 * IntersectionObserver, tanpa batas 200 baris. Aman untuk ribuan data.
 */
export function LazyDropdown({
  endpoint,
  searchFields,
  value,
  onChange,
  getValue,
  getLabel,
  getSub,
  getKey,
  valueField,
  staticFilters,
  sort = ['createdAt:desc'],
  pageSize = 30,
  faskesScoped = true,
  placeholder = '— Pilih —',
  searchPlaceholder = 'Ketik untuk mencari…',
  emptyText = 'Tidak ada data yang cocok dengan pencarian.',
  disabled = false,
  ariaLabel,
  className = '',
  renderOption,
}: LazyDropdownProps) {
  const getVal = getValue ?? ((raw: RawEntity) => str(raw.documentId));
  const getRowKey = getKey ?? getVal;
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<RawEntity[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<Record<string, RawEntity>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Kunci fetch berjalan agar respons basi (search cepat) tidak menimpa baru.
  const seqRef = useRef(0);
  const staticKey = JSON.stringify(staticFilters ?? null);

  const hasMore = items.length < total;
  // Label pilihan diturunkan langsung dari cache (tanpa state sinkron) —
  // exact-fetch di bawah mengisi cache bila value belum dikenal.
  const selected = value ? (cached[value] ?? null) : null;

  // Debounce keyword ala HRIS — ganti halaman ke 1 di handler input.
  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(() => setDebounced(keyword), 400);
    return () => window.clearTimeout(t);
  }, [keyword, open]);

  // Muat halaman berjalan (ganti saat search, tambah saat scroll).
  // `loading=true` dipasang dari event handler (buka/ketik/scroll),
  // bukan di sini, agar lolos aturan react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open) return undefined;
    const seq = (seqRef.current += 1);
    void fetchEntities({
      endpoint, keyword: debounced, page, pageSize,
      searchFields, staticFilters, sort, faskesScoped,
    })
      .then((res) => {
        if (seqRef.current !== seq) return;
        setCached((prev) => {
          const next = { ...prev };
          for (const it of res.items) next[getVal(it)] = it;
          return next;
        });
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => {
        if (seqRef.current !== seq) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data.');
      })
      .finally(() => {
        if (seqRef.current === seq) setLoading(false);
      });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debounced, page, endpoint, pageSize, faskesScoped, staticKey]);

  // Resolve label pilihan: exact-fetch bila value belum ada di cache.
  // Hasilnya masuk cache (async) — `selected` diturunkan saat render.
  useEffect(() => {
    if (!value || cached[value]) return undefined;
    const field = valueField ?? 'documentId';
    void fetchEntities({
      endpoint, keyword: '', match: { [field]: { $eq: value } },
      page: 1, pageSize: 1, searchFields: [],
      staticFilters, sort, faskesScoped,
    })
      .then((res) => {
        const exact = res.items.find((it) => getVal(it) === value) ?? res.items[0] ?? null;
        if (exact) setCached((prev) => ({ ...prev, [getVal(exact)]: exact }));
      })
      .catch(() => {});
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, endpoint, faskesScoped, staticKey]);

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

  const pick = (it: RawEntity) => {
    const v = getVal(it);
    setCached((prev) => ({ ...prev, [v]: it }));
    onChange(v, it);
    setOpen(false);
    setKeyword('');
    setDebounced('');
    setPage(1);
  };

  const selectedLabel = selected ? getLabel(selected) : value ? value : '';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 bg-white flex items-center justify-between gap-2 text-left disabled:opacity-60"
      >
        <span className={`truncate ${selected || value ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedLabel || placeholder}
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
                  placeholder={searchPlaceholder}
                  aria-label={ariaLabel ? `Cari ${ariaLabel}` : 'Cari data'}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-400"
                />
              </div>
            </div>
            <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
              {items.map((it) => {
                const active = getVal(it) === value;
                const sub = getSub?.(it) ?? '';
                return (
                  <li key={getRowKey(it)}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(it)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 transition ${
                        active ? 'bg-teal-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {renderOption ? (
                        renderOption(it, active)
                      ) : (
                        <>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-slate-800 truncate">
                              {getLabel(it)}
                            </span>
                            {sub ? (
                              <span className="block text-[11px] text-slate-400 truncate">
                                {sub}
                              </span>
                            ) : null}
                          </span>
                          {active && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
              {items.length === 0 && !loading && (
                <li className="px-3 py-6 text-center text-xs text-slate-400">
                  {error ?? emptyText}
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
                  {items.length} dari {total} data
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
