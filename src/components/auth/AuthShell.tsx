'use client';

import { ClipboardPlus, FileHeart, Pill } from 'lucide-react';
import { LogoLink } from '@/components/layout/LogoLink';

/** Logo Google resmi (SVG) untuk tombol login Google. */
export function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

/** Tombol "Lanjutkan dengan Google". */
export function GoogleButton({
  onClick,
  label = 'Lanjutkan dengan Google',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-sm font-semibold text-slate-700 shadow-sm transition"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}

/** Pembatas "atau" di antara tombol Google dan form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
      <span className="flex-1 h-px bg-slate-200" />
      atau
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

/**
 * Kerangka halaman auth: panel brand (desktop) + kolom form (mobile logo otomatis).
 * Dipakai login, registrasi, dan lupa kata sandi agar konsisten.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      {/* ============ Panel brand (lg+) ============ */}
      <div className="hidden lg:flex w-[44%] xl:w-[42%] bg-slate-950 text-slate-300 flex-col justify-between relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="px-10 pt-10 relative">
          <LogoLink className="flex items-center gap-3 rounded-lg outline-none w-fit">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-[0_0_18px_rgba(45,212,191,0.45)]">
              <span className="text-slate-950 font-black text-lg">D</span>
            </div>
            <div>
              <div className="font-bold text-white text-lg leading-tight tracking-tight">Dokter Pintar</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-[0.18em]">SIM &amp; RME FasKes</div>
            </div>
          </LogoLink>
        </div>

        <div className="px-10 relative">
          <h2 className="text-3xl font-bold text-white leading-snug tracking-tight">
            Satu aplikasi untuk seluruh<br />
            <span className="text-teal-300">alur layanan FasKes</span> Anda.
          </h2>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
            Registrasi, rekam medis elektronik, farmasi, billing, hingga laporan —
            terintegrasi dalam satu platform yang dirancang untuk faskes gigi dan umum.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              { icon: ClipboardPlus, text: 'Registrasi & antrean tanpa ribet' },
              { icon: FileHeart, text: 'RME lengkap dengan odontogram digital' },
              { icon: Pill, text: 'Farmasi & stok obat terpantau real-time' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-10 pb-10 text-[11px] text-slate-500 relative">
          © {new Date().getFullYear()} Dokter Pintar · SIM &amp; RME FasKes
        </div>
      </div>

      {/* ============ Kolom form ============ */}
      {/* m-auto (bukan items-center) agar form yang lebih tinggi dari layar
          tetap bisa di-scroll ke atas di HP. */}
      <div className="flex-1 flex min-w-0 px-4 py-8 sm:py-10 bg-slate-50">
        <div className="w-full max-w-sm m-auto">
          {/* Logo kecil untuk mobile */}
          <LogoLink className="lg:hidden flex items-center gap-3 mb-8 rounded-lg outline-none w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-[0_0_18px_rgba(45,212,191,0.45)]">
              <span className="text-slate-950 font-black text-lg">D</span>
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight tracking-tight">Dokter Pintar</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.18em]">SIM &amp; RME FasKes</div>
            </div>
          </LogoLink>
          {children}
        </div>
      </div>
    </div>
  );
}
