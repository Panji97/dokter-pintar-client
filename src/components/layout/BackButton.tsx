import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href: string;
  label?: string;
}

/** Tombol kembali reusable — dipakai di area konten agar Topbar tetap identik. */
export function BackButton({ href, label = 'Kembali' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50 border border-slate-200 px-3 py-2 rounded-lg transition"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}
