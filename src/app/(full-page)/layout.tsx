import { FullPageShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';

/**
 * Route group (full-page) — halaman full-width tanpa kolom leftbar.
 * Memakai ShellProvider yang sama dengan (main) sehingga Topbar yang
 * SAMA persis tetap berfungsi (drawer sidebar & panel antrean tersedia
 * via tombol Topbar; default tertutup agar halaman fokus full).
 * URL tidak berubah (route group tidak memengaruhi path).
 */
export default function FullPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <FullPageShell>{children}</FullPageShell>
    </AuthGuard>
  );
}
