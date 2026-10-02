'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Lock, Send, UserRound } from 'lucide-react';
import { requestPasswordReset, resetPassword, getSession } from '@/lib/auth';
import { AuthShell } from './AuthShell';

/** Lupa kata sandi — 2 langkah: minta kode OTP, lalu atur kata sandi baru. */
export function ForgotForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sudah login? Langsung ke dashboard.
  useEffect(() => {
    if (getSession()) router.replace('/dashboard');
  }, [router]);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    window.setTimeout(() => {
      const res = requestPasswordReset(identifier);
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDemoCode(res.code);
      setChannel(res.channel);
      setStep(2);
    }, 350);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      const res = resetPassword(identifier, code, password);
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      router.replace('/dashboard');
    }, 350);
  };

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 rounded-xl border border-transparent focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition placeholder:text-slate-400';

  return (
    <AuthShell>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali masuk
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lupa kata sandi</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        {step === 1
          ? 'Masukkan email atau nomor HP terdaftar untuk menerima kode verifikasi.'
          : 'Masukkan kode verifikasi lalu buat kata sandi baru.'}
      </p>

      {step === 1 ? (
        <form onSubmit={handleRequest} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="fp-identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email atau Nomor HP
            </label>
            <div className="relative">
              <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fp-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nama@faskes.id atau 0812xxxxxxx"
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
                Mengirim…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Kirim kode verifikasi
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="mt-6 space-y-4" noValidate>
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-800">
            Kode dikirim ke {channel === 'email' ? 'email' : 'SMS'} Anda.
            {demoCode && (
              <span className="block mt-1 font-semibold">
                Demo — kode Anda: <span className="font-mono text-sm tracking-widest">{demoCode}</span>
              </span>
            )}
          </div>

          <div>
            <label htmlFor="fp-code" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kode Verifikasi (6 digit)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className={`${inputCls} font-mono tracking-widest`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="fp-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fp-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="fp-confirm" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi kata sandi baru"
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
                Menyimpan…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Simpan kata sandi baru
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setError('');
              setCode('');
            }}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
          >
            Kirim ulang ke email/nomor berbeda
          </button>
        </form>
      )}
    </AuthShell>
  );
}
