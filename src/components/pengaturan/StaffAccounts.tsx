'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useFetch, usePost } from '@/lib/strapi';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import { getSession } from '@/lib/auth';

interface StaffUser {
  documentId: string;
  username: string;
  email: string;
  appRole: string;
}

const ADMIN_ROLES = ['Administrator', 'Admin Faskes'];
const STAFF_ROLES = ['Dokter Gigi', 'Dokter Umum', 'Perawat', 'Apoteker', 'Kasir', 'Admin Faskes', 'Pengguna'];

/**
 * Kelola akun login staf dalam satu faskes (undang + daftar).
 * Hanya admin faskes. Pola endpoint custom meniru HRIS approver/register.
 */
export function StaffAccounts() {
  const session = typeof window !== 'undefined' ? getSession() : null;
  const isAdmin = ADMIN_ROLES.includes(session?.role ?? '');

  const { data, mutate, isLoading } = useFetch(STRAPI_ENDPOINTS.faskesStaff);
  const { postData: invite, loading: inviting } = usePost(STRAPI_ENDPOINTS.faskesStaff);

  const [form, setForm] = useState({ name: '', email: '', password: '', appRole: 'Dokter Gigi' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const users = ((data as { data?: StaffUser[] } | undefined)?.data ?? []) as StaffUser[];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    const result = await invite({
      data: { name: form.name.trim(), email: form.email.trim(), password: form.password, appRole: form.appRole },
    });
    if (result?.error) {
      setError(result.error.message ?? 'Gagal mengundang staf.');
      return;
    }
    setOk(`Akun ${form.email.trim()} dibuat — staf bisa masuk dengan email & kata sandi itu.`);
    setForm({ name: '', email: '', password: '', appRole: 'Dokter Gigi' });
    mutate();
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-slate-800 text-sm">Akun Login Staf</h2>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm space-y-1">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Masuk sebagai</span>
          <span className="font-medium text-slate-800 text-right">{session?.name ?? '-'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Faskes</span>
          <span className="font-medium text-slate-800 text-right">{session?.faskes?.name ?? '-'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Peran</span>
          <span className="font-medium text-slate-800 text-right">{session?.role ?? '-'}</span>
        </div>
      </div>

      {!isAdmin ? (
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-3">
          Hanya admin faskes yang bisa mengundang akun staf baru.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Staf</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Email Login</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staf@faskes.id" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Kata Sandi</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Peran</label>
              <select value={form.appRole} onChange={(e) => setForm({ ...form, appRole: e.target.value })} className={inputCls}>
                {STAFF_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
          {ok && <p className="text-xs font-medium text-teal-700">{ok}</p>}
          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition disabled:opacity-60"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {inviting ? 'Mengundang…' : 'Undang Staf'}
          </button>
        </form>
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Terdaftar di faskes ini ({users.length})
        </h3>
        {isLoading && users.length === 0 ? (
          <p className="text-xs text-slate-400">Memuat…</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {users.map((u) => (
              <div key={u.documentId} className="px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{u.username}</div>
                  <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium shrink-0">
                  {u.appRole}
                </span>
              </div>
            ))}
            {users.length === 0 && (
              <p className="px-3 py-4 text-xs text-slate-400 text-center">Belum ada akun.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
