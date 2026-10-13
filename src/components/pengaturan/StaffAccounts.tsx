'use client';

import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useFetch, usePost } from '@/lib/strapi';
import { STRAPI_ENDPOINTS } from '@/lib/strapi-endpoints';
import { getSession } from '@/lib/auth';

interface StaffRole {
  id: number;
  documentId: string;
  name: string;
  type: string;
}

interface StaffUser {
  documentId: string;
  username: string;
  email: string;
  role: StaffRole | null;
}

const ADMIN_ROLES = ['Administrator', 'Admin Faskes'];

export function StaffAccounts() {
  const session = typeof window !== 'undefined' ? getSession() : null;
  const isAdmin = ADMIN_ROLES.includes(session?.role ?? '');

  const { data, mutate, isLoading } = useFetch(STRAPI_ENDPOINTS.faskesStaff);
  const { postData: invite, loading: inviting } = usePost(STRAPI_ENDPOINTS.faskesStaff);
  // Peran dari role bawaan Strapi (bisa diatur permission per-modul via Admin Panel > Roles).
  const { data: rolesRes, isLoading: loadingRoles } = useFetch(STRAPI_ENDPOINTS.faskesRoles);

  const roles: StaffRole[] = useMemo(() => {
    const rows = (rolesRes as { data?: StaffRole[] } | undefined)?.data ?? [];
    return rows;
  }, [rolesRes]);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const roleValue = form.role || roles[0]?.name || '';

  const users = ((data as { data?: StaffUser[] } | undefined)?.data ?? []) as StaffUser[];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (!roleValue) {
      setError('Peran wajib dipilih (menunggu daftar peran dari API).');
      return;
    }
    const result = await invite({
      data: { name: form.name.trim().toUpperCase(), email: form.email.trim(), password: form.password, role: roleValue },
    });
    if (result?.error) {
      setError(result.error.message ?? 'Gagal mengundang staf.');
      return;
    }
    setOk(`Akun ${form.email.trim()} dibuat — staf bisa masuk dengan email & kata sandi itu.`);
    setForm({ name: '', email: '', password: '', role: roles[0]?.name ?? '' });
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
              <label className="text-xs font-medium text-slate-600 block mb-1">Peran (role Strapi)</label>
              <select
                value={roleValue}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={loadingRoles && roles.length === 0}
                className={inputCls}
              >
                <option value="">
                  {loadingRoles && roles.length === 0 ? 'Memuat...' : '— Pilih peran —'}
                </option>
                {roles.map((r) => (
                  <option key={r.documentId || r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Permission tiap peran diatur via Strapi Admin Panel &gt; Roles.</p>
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
                  {u.role?.name ?? '-'}
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
