'use client';

import { ClinicStoreProvider } from '@/lib/ClinicStore';

/**
 * Provider global di root layout — ClinicStore mount SEKALI untuk seluruh
 * route group ((main) maupun (full-page)) sehingga pindah halaman tidak
 * memicu muat ulang 23 collection dari Strapi.
 */
export function RootProviders({ children }: { children: React.ReactNode }) {
  return <ClinicStoreProvider>{children}</ClinicStoreProvider>;
}
