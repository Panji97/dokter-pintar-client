'use client';

import { useFetch } from '@/lib/strapi';
import { getSession } from '@/lib/auth';

/** Profil faskes milik user yang login — dibaca live dari Strapi. */
export function FaskesInfo() {
  const session = typeof window !== 'undefined' ? getSession() : null;
  const docId = session?.faskes?.documentId;
  const { data, isLoading } = useFetch(docId ? `/api/faskes-list/${docId}` : null as unknown as string);

  if (!docId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400 shadow-sm">
        Akun belum terikat ke faskes.
      </div>
    );
  }

  const f = (data as { data?: { name?: string; address?: string; phone?: string } } | undefined)?.data;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-slate-800 text-sm">Profil Faskes</h2>
      {isLoading && !f ? (
        <p className="text-sm text-slate-400">Memuat…</p>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Nama</span>
            <span className="font-medium text-slate-800 text-right">{f?.name ?? session?.faskes?.name ?? '-'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Alamat</span>
            <span className="font-medium text-slate-800 text-right">{f?.address || '-'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Telepon</span>
            <span className="font-medium text-slate-800 text-right">{f?.phone || '-'}</span>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Profil faskes dibuat saat pendaftaran. Hubungi tim Dokter Pintar untuk mengubahnya.
      </p>
    </div>
  );
}
