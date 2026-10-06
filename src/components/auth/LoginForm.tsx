'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, LogIn, UserRound } from 'lucide-react';
import { loginDetailed, getSession } from '@/lib/auth';
import { AuthShell } from './AuthShell';

/** Form login — Email atau Nomor HP + kata sandi, atau Google. */
export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sudah login? Langsung ke dashboard.
  useEffect(() => {
    if (getSession()) router.replace('/dashboard');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await loginDetailed(identifier, password);
    if (!res.ok) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    router.replace('/dashboard');
  };

  // text-base di HP agar iOS tidak auto-zoom saat fokus input.
  const inputCls =
    'w-full pl-10 pr-4 py-2.5 text-base sm:text-sm bg-slate-100 rounded-xl border border-transparent focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition placeholder:text-slate-400';

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Masuk ke akun Anda</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Gunakan email beserta kata sandi yang terdaftar di faskes Anda.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="identifier"
              type="email"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="nama@dokterpintar.id"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
              Kata Sandi
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline">
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition disabled:opacity-60 disabled:pointer-events-none"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Memproses…
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Masuk
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  );
}
