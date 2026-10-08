"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardPlus,
  FileHeart,
  ReceiptText,
  FileOutput,
  Pill,
  BarChart3,
  Settings,
  Activity,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import { LogoLink } from "./LogoLink";
import { getSession, logout, type Session } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Registrasi", href: "/registrasi", icon: ClipboardPlus },
  { label: "Rekam Medis", href: "/rekam-medis", icon: FileHeart },
  { label: "Billing", href: "/billing", icon: ReceiptText },
  { label: "Surat & Rujukan", href: "/surat-rujukan", icon: FileOutput },
  { label: "Farmasi", href: "/farmasi", icon: Pill },
  { label: "Laporan", href: "/laporan", icon: BarChart3 },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
];

interface SidebarProps {
  /** Dipanggil saat link diklik — untuk menutup sheet di mobile/tablet. */
  onNavigate?: () => void;
}

/**
 * Leftbar (col-3) — identitas Dokter Pintar: dark theme slate-950 + aksen teal glow.
 * Nav item bergaya ikon-dalam-kotak dengan indicator bar saat aktif.
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleLogout = () => {
    onNavigate?.();
    logout();
    router.replace("/login");
  };

  // Inisial nama untuk avatar (maks. 2 huruf).
  const initials = (session?.name ?? "DP")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="w-full h-full bg-slate-950 text-slate-300 flex flex-col relative overflow-hidden">
      {/* Dekorasi glow latar (halus) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -left-10 w-40 h-40 rounded-full bg-teal-500/10 blur-3xl"
      />

      {/* Logo / Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10 relative">
        <LogoLink
          onNavigate={onNavigate}
          className="block rounded-lg outline-none"
        >
          <BrandLogo />
        </LogoLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 relative">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          const content = (
            <>
              {/* Indicator bar aktif */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                />
              )}
              <span
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive
                    ? "bg-teal-400 text-slate-950 shadow-[0_0_14px_rgba(45,212,191,0.5)] animate-heartbeat"
                    : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-teal-300",
                )}
              >
                <Icon className="w-[17px] h-[17px]" />
              </span>
              <span
                className={cn(
                  "flex-1 truncate text-sm",
                  isActive
                    ? "font-semibold text-white"
                    : "font-medium text-slate-400 group-hover:text-white",
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
              )}
            </>
          );
          const cls = cn(
            "group relative flex items-center gap-3 pl-2.5 pr-3 py-2 rounded-xl transition-all",
            isActive ? "bg-white/[0.07]" : "hover:bg-white/5",
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cls}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Footer: info sesi + logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 relative">
        <button
          onClick={handleLogout}
          title="Keluar dari akun"
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-rose-500/10 transition text-left group/user"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-slate-950 text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {session?.name ?? "Pengguna"}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {session?.role ?? "Belum masuk"}
            </div>
          </div>
          <LogOut className="w-4 h-4 text-rose-400/80 shrink-0 group-hover/user:text-rose-300 transition" />
        </button>
      </div>
    </aside>
  );
}
