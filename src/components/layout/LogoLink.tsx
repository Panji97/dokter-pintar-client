'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

interface LogoLinkProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Dipanggil saat logo diklik — mis. menutup sheet di mobile. */
  onNavigate?: () => void;
}

/**
 * Logo yang mengarah cerdas: ke /dashboard bila sudah login (ada sesi/token),
 * ke landing (/) bila belum. Href awal '/' agar SSR & hidrasi pertama identik,
 * lalu disesuaikan setelah mount (localStorage hanya ada di klien).
 */
export function LogoLink({ children, className, ariaLabel = 'Dokter Pintar', onNavigate }: LogoLinkProps) {
  const [href, setHref] = useState('/');

  useEffect(() => {
    setHref(getSession() ? '/dashboard' : '/');
  }, []);

  return (
    <Link href={href} onClick={onNavigate} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}
