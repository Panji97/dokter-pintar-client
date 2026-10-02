'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Phone, UserRound, UserPlus } from 'lucide-react';
import { register, loginWithGoogle, getSession } from '@/lib/auth';
import { AuthShell, GoogleButton, AuthDivider } from './AuthShell';

/** Form registrasi akun — Nama + Email dan/atau Nomor HP + kata sandi, atau Google. */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sudah login? Langsung ke dashboard.
  useEffect(() => {
    if (getSession()) router.replace('/dashboard');
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      const res = register({ name, email, phone, password });
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      router.replace('/dashboard');
    }, 350);
  };

  const handleGoogle = () => {
    setError('');
    loginWithGoogle();
    router.replace('/dashboard');
  };

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 rounded-xl border border-transparent focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition placeholder:text-slate-400';

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buat akun baru</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Daftar dengan email atau nomor HP — gratis dan siap dipakai.
      </p>

      <div className="mt-6 space-y-4">
        <GoogleButton onClick={handleGoogle} label="Daftar dengan Google" />
        <AuthDivider />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <div>
          <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama sesuai KTP"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@faskes.id"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor HP
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxx"
                className={inputCls}
              />
            </div>
          </div>
        </div>
        <p className="-mt-2 text-[11px] text-slate-400">Isi salah satu: email atau nomor HP.</p>

        <div>
          <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Kata Sandi <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="reg-password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
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

        <div>
          <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="reg-confirm"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi kata sandi"
              className={inputCls}
            />
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
              <UserPlus className="w-4 h-4" />
              Daftar
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
