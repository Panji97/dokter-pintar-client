'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Calendar, Menu, ReceiptText, AlertTriangle, Pill, PanelRight } from 'lucide-react';
import { useShell } from './AppShell';
import { BrandLogo } from './BrandLogo';
import { LogoLink } from './LogoLink';
import { ThemeToggle } from './ThemeToggle';
import { useClinicStore, fmtRupiah } from '@/lib/ClinicStore';
import { useFetch } from '@/lib/strapi';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Tanggal lokal YYYY-MM-DD (hindari bug UTC: toISOString bisa mundur 1 hari di WIB). */
function getLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ambil tanggal lokal YYYY-MM-DD dari ISO datetime (regDate disimpan tengah malam lokal). */
function toLocalDateStr(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return getLocalDateStr(d);
}

interface TopbarProps {
  title: string;
  subtitle?: string;
  /**
   * Tampilkan brand "Dokter Pintar" di kiri Topbar. Dipakai di route group
   * (full-page) yang tidak punya leftbar — di halaman lain brand sudah
   * ada di sidebar.
   */
  showBrand?: boolean;
}

/** Header konten — design awal: bar putih sticky dengan search & dropdown notifikasi fungsional. */
export function Topbar({ title, subtitle, showBrand = false }: TopbarProps) {
  const { openSidebar, queueOpen, toggleQueue, setQueueSheetOpen, desktopSidebarOpen, toggleDesktopSidebar } = useShell();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useClinicStore();

  const { data: regsRes } = useFetch(STRAPI_ENDPOINTS.registrations, {
    pagination: { pageSize: 100 },
    sort: 'regDate:DESC',
  });
  const { data: invsRes } = useFetch(STRAPI_ENDPOINTS.invoices, {
    pagination: { pageSize: 100 },
    sort: 'createdAt:DESC',
  });

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return state.patients
      .filter((p) => p.name.toLowerCase().includes(s) || p.nik.includes(s))
      .slice(0, 6);
  }, [q, state.patients]);

  const pendingInvoices = useMemo(
    () => state.invoices.filter((i) => i.paymentStatus === 'Belum Dibayar'),
    [state.invoices]
  );
  const lowStock = useMemo(() => state.medicines.filter((m) => m.stock <= m.minStock), [state.medicines]);
  const pendingResep = useMemo(
    () => state.registrations.filter((r) => state.emr[r.id] && state.emr[r.id].resepApotek.length > 0),
    [state.registrations, state.emr]
  );
  const notifCount = pendingInvoices.length + lowStock.length + pendingResep.length;

  // Antrean hari ini (tanggal lokal) — diisi setelah mount agar SSR & hidrasi identik,
  // badge tampil persis seperti badge notifikasi (hanya bila count > 0).
  const [todayStr, setTodayStr] = useState('');
  useEffect(() => {
    setTodayStr(getLocalDateStr());
  }, []);
  const queueCountToday = useMemo(() => {
    if (!todayStr) return 0;
    const list = ((regsRes?.data ?? []) as Array<{ regDate?: string }>);
    return list.filter((r) => toLocalDateStr(r.regDate || '') === todayStr).length;
  }, [regsRes, todayStr]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    router.push(href);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Brand — hanya di full-page (tanpa leftbar). */}
        {showBrand && (
          <LogoLink className="shrink-0 rounded-lg outline-none hidden min-[480px]:block">
            <BrandLogo theme="light" className="shrink-0" />
          </LogoLink>
        )}
        {/* Hamburger mobile: buka sheet leftbar (< md) */}
        <button
          onClick={openSidebar}
          aria-label="Buka menu"
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition text-slate-600"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Hamburger desktop: HANYA di full-page (showBrand) untuk membuka drawer menu utama.
            Di halaman (main) tidak ditampilkan. */}
        {showBrand && (
          <button
            onClick={toggleDesktopSidebar}
            aria-label={desktopSidebarOpen ? 'Sembunyikan menu utama' : 'Tampilkan menu utama'}
            aria-expanded={desktopSidebarOpen}
            title="Menu utama"
            className="hidden md:inline-flex p-2 rounded-lg hover:bg-slate-100 transition text-slate-600 outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* Pembatas — hanya di full-page, setelah hamburger. */}
        {showBrand && (
          <div aria-hidden className="w-px h-8 bg-slate-200 shrink-0 hidden sm:block" />
        )}
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="hidden sm:block text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search pasien (fungsional) */}
        <div className="relative hidden md:block" ref={boxRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Cari pasien atau NIK..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-100 rounded-lg border border-transparent focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none w-56 lg:w-64 xl:w-72 transition"
          />
          {open && q.trim().length >= 2 && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[80vw] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-40">
              {results.length === 0 ? (
                <div className="px-4 py-5 text-xs text-slate-400 text-center">Tidak ada pasien ditemukan.</div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => go('/rekam-medis')}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition"
                      >
                        <div className="text-sm font-medium text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-400">NIK {p.nik}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {results.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                  <button onClick={() => go('/rekam-medis')} className="text-[11px] font-medium text-teal-700 hover:underline">
                    Buka daftar rekam medis →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600" suppressHydrationWarning>{today}</span>
        </div>

        {/* Mode gelap / terang */}
        <ThemeToggle />

        {/* Buka rightbar antrean (mobile/tablet): panel tampil sebagai drawer kanan */}
        <button
          onClick={() => setQueueSheetOpen(true)}
          aria-label="Tampilkan antrean pasien"
          title="Antrean pasien"
          className="xl:hidden relative p-2 rounded-lg hover:bg-slate-100 transition outline-none text-slate-600"
        >
          <PanelRight className="w-5 h-5" />
          {queueCountToday > 0 && (
            <span suppressHydrationWarning className="absolute top-1 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {queueCountToday > 9 ? '9+' : queueCountToday}
            </span>
          )}
        </button>

        {/* Buka/tutup rightbar antrean pasien (desktop xl+) */}
        <button
          onClick={toggleQueue}
          aria-label={queueOpen ? 'Sembunyikan antrean pasien' : 'Tampilkan antrean pasien'}
          aria-expanded={queueOpen}
          aria-pressed={queueOpen}
          title="Antrean pasien"
          className={`hidden xl:inline-flex relative p-2 rounded-lg transition outline-none ${
            queueOpen
              ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700 animate-heartbeat'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PanelRight className="w-5 h-5" />
          {queueCountToday > 0 && (
            <span suppressHydrationWarning className="absolute top-1 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {queueCountToday > 9 ? '9+' : queueCountToday}
            </span>
          )}
        </button>

        {/* Notifikasi (dropdown, pengganti rightbar) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition outline-none" aria-label="Notifikasi">
                <Bell className="w-5 h-5 text-slate-600" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-80 max-w-[86vw] max-h-96 overflow-y-auto">
            <div className="px-2 py-1.5 flex items-center justify-between" data-slot="dropdown-menu-label">
              <span className="text-sm font-semibold">Notifikasi</span>
              <span className="text-[10px] font-bold bg-teal-600 text-white rounded-full px-2 py-0.5">{notifCount}</span>
            </div>
            {pendingInvoices.slice(0, 3).map((i) => (
              <DropdownMenuItem
                key={i.id}
                onClick={() => router.push('/billing')}
                className="flex items-start gap-2.5 py-2 cursor-pointer"
              >
                <ReceiptText className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">{i.patientName} — {fmtRupiah(i.total)}</span>
                  <span className="block text-[11px] text-slate-400">Belum dibayar · {i.date}</span>
                </span>
              </DropdownMenuItem>
            ))}
            {pendingResep.slice(0, 2).map((r) => (
              <DropdownMenuItem
                key={r.id}
                onClick={() => router.push('/farmasi')}
                className="flex items-start gap-2.5 py-2 cursor-pointer"
              >
                <Pill className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">Resep {r.patientName}</span>
                  <span className="block text-[11px] text-slate-400">Menunggu kajian farmasi</span>
                </span>
              </DropdownMenuItem>
            ))}
            {lowStock.slice(0, 2).map((m) => (
              <DropdownMenuItem
                key={m.id}
                onClick={() => router.push('/farmasi')}
                className="flex items-start gap-2.5 py-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">{m.name}</span>
                  <span className="block text-[11px] text-slate-400">Stok menipis: {m.stock} {m.unit}</span>
                </span>
              </DropdownMenuItem>
            ))}
            {notifCount === 0 && (
              <div className="px-4 py-8 text-center text-xs text-slate-400">Tidak ada notifikasi.</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
