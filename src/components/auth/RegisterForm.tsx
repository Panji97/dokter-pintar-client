'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, UserRound, UserPlus } from 'lucide-react';
import { register, getSession } from '@/lib/auth';
import { AuthShell } from './AuthShell';

/** Form pendaftaran faskes baru — data faskes + akun adminnya. */
export function RegisterForm() {
  const router = useRouter();
  const [faskesName, setFaskesName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setSubmitting(true);
    const res = await register({ faskesName, address, phone, name, email, password });
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
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftarkan faskes Anda</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Buat faskes baru beserta akun adminnya — gratis dan siap dipakai.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Data Faskes
          </div>
          <label htmlFor="reg-faskes" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Nama Faskes <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="reg-faskes"
              type="text"
              value={faskesName}
              onChange={(e) => setFaskesName(e.target.value)}
              placeholder="cth: Faskes Sehat Bersama"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-address" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat
            </label>
            <input
              id="reg-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Contoh No. 1"
              className="w-full px-4 py-2.5 text-base sm:text-sm bg-slate-100 rounded-xl border border-transparent focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition placeholder:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Telepon
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812xxxxxxx"
              className="w-full px-4 py-2.5 text-base sm:text-sm bg-slate-100 rounded-xl border border-transparent focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Akun Admin Faskes
          </div>
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
              placeholder="Nama penanggung jawab"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email <span className="text-rose-500">*</span>
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
