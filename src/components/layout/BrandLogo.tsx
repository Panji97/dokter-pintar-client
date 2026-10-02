import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /** 'dark' untuk di atas sidebar gelap, 'light' untuk di atas Topbar putih. */
  theme?: 'dark' | 'light';
  className?: string;
}

/** Identitas Dokter Pintar — dipakai Sidebar dan Topbar (mode full-page). */
export function BrandLogo({ theme = 'dark', className }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-[0_0_18px_rgba(45,212,191,0.45)] shrink-0">
        <span className="text-slate-950 font-black text-lg">D</span>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2',
            theme === 'dark' ? 'border-slate-950' : 'border-white'
          )}
        />
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            'font-bold text-base leading-tight tracking-tight whitespace-nowrap',
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          )}
        >
          Dokter Pintar
        </div>
        <div
          className={cn(
            'text-[10px] uppercase tracking-[0.18em] whitespace-nowrap hidden sm:block',
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          SIM &amp; RME FasKes
        </div>
      </div>
    </div>
  );
}
