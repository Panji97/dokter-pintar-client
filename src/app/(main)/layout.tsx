import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';

/**
 * Route group (main) — halaman dengan leftbar + rightbar antrean.
 * URL tidak berubah (route group tidak memengaruhi path).
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
