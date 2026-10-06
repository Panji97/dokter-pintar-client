/**
 * Auth via Strapi (users-permissions) — menggantikan mock localStorage.
 *
 * - Login: POST /api/auth/local, JWT disimpan ganda (localStorage + cookie)
 *   seperti hris-client-sakai, sesi app di localStorage 'dokter-pintar-session'.
 * - Role aplikasi dibaca dari field `appRole` user Strapi.
 * - Lupa kata sandi: POST /api/auth/forgot-password lalu
 *   POST /api/auth/reset-password (kode dari email).
 * - Login Google tidak tersedia — memakai email + kata sandi.
 */

import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  setCookie,
  eraseCookie,
} from './storage';
import { STRAPI_SESSION_EVENT } from './strapi';

export interface SessionFaskes {
  documentId: string;
  name: string;
}

export interface Session {
  name: string;
  email: string;
  role: string;
  faskes: SessionFaskes | null;
  loginAt: string;
}

const SESSION_KEY = 'dokter-pintar-session';
const baseUrl = () => process.env.NEXT_PUBLIC_STRAPI_URL ?? '';

/** Normalisasi nomor HP Indonesia ke format 62xxxxxxxxxx. '' bila tidak valid. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return /^62\d{9,13}$/.test(normalized) ? normalized : '';
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Ambil sesi aktif. null jika belum login. */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function startSession(
  name: string,
  email: string,
  role: string,
  faskes: SessionFaskes | null,
): Session {
  const session: Session = {
    name,
    email,
    role,
    faskes,
    loginAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* kuota penuh — sesi tetap berlaku di memori halaman ini */
  }
  notifySessionChanged();
  return session;
}

function notifySessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STRAPI_SESSION_EVENT));
  }
}

export function logout(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
  try {
    removeLocalStorage('jwt');
    removeLocalStorage('user');
    eraseCookie('jwt');
  } catch {
    /* abaikan */
  }
  notifySessionChanged();
}

/** Hasil operasi auth yang bisa gagal dengan pesan ramah. */
export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

interface StrapiAuthPayload {
  jwt?: string;
  user?: { username?: string; email?: string; appRole?: string };
  error?: { message?: string };
}

async function strapiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as StrapiAuthPayload;
    return body?.error?.message || fallback;
  } catch {
    return fallback;
  }
}

interface StrapiMe {
  username?: string;
  email?: string;
  appRole?: string;
  faskes?: { documentId?: string; name?: string } | null;
}

/** Login dengan Email + kata sandi ke Strapi. */
export async function loginDetailed(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  if (!identifier.trim() || !password) {
    return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
  }
  if (!isEmail(identifier)) {
    return { ok: false, error: 'Masuk memakai email terdaftar.' };
  }
  try {
    const res = await fetch(`${baseUrl()}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });
    const body = (await res.json()) as StrapiAuthPayload;
    if (!res.ok || !body.jwt || !body.user) {
      return { ok: false, error: body?.error?.message || 'Email atau kata sandi salah.' };
    }

    // Ambil profil lengkap (termasuk appRole + faskes).
    const meRes = await fetch(`${baseUrl()}/api/users/me?populate=faskes`, {
      headers: { Authorization: `Bearer ${body.jwt}` },
    });
    const me = (await meRes.json()) as StrapiMe;
    if (!meRes.ok || !me.faskes?.documentId) {
      return { ok: false, error: 'Akun belum terikat ke faskes. Hubungi admin faskes.' };
    }

    setCookie('jwt', body.jwt, 7);
    setLocalStorage('jwt', body.jwt);
    setLocalStorage('user', JSON.stringify(me));

    const name = me.username || body.user.username || identifier.trim();
    const email = me.email || body.user.email || identifier.trim();
    const role = me.appRole || 'Pengguna';
    const faskes = { documentId: me.faskes.documentId, name: me.faskes.name ?? '' };
    return { ok: true, session: startSession(name, email, role, faskes) };
  } catch {
    return { ok: false, error: 'Tidak dapat terhubung. Periksa koneksi internet.' };
  }
}

export interface RegisterInput {
  faskesName: string;
  address: string;
  phone: string;
  name: string;
  email: string;
  password: string;
}

/**
 * Daftar faskes baru + akun Admin Faskes (satu panggilan ke POST /api/faskes/register).
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const faskesName = input.faskesName.trim();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (faskesName.length < 3) {
    return { ok: false, error: 'Nama faskes minimal 3 karakter.' };
  }
  if (name.length < 3) {
    return { ok: false, error: 'Nama admin minimal 3 karakter.' };
  }
  if (!email || !isEmail(email)) {
    return { ok: false, error: 'Email valid wajib diisi untuk pendaftaran.' };
  }
  if (input.password.length < 6) {
    return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
  }
  try {
    const res = await fetch(`${baseUrl()}/api/faskes/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faskes: { name: faskesName, address: input.address.trim(), phone: input.phone.trim() },
        admin: { name, email, password: input.password },
      }),
    });
    const body = (await res.json()) as {
      data?: {
        jwt?: string;
        faskes?: { documentId?: string; name?: string };
        user?: { username?: string; email?: string; appRole?: string };
      };
      error?: { message?: string };
    };
    if (!res.ok || !body.data?.jwt || !body.data?.user || !body.data?.faskes?.documentId) {
      return { ok: false, error: body?.error?.message || 'Pendaftaran gagal.' };
    }
    const { jwt, user } = body.data;
    const faskesId = body.data.faskes.documentId as string;
    const faskesNameOut = body.data.faskes.name ?? faskesName;
    setCookie('jwt', jwt, 7);
    setLocalStorage('jwt', jwt);
    setLocalStorage('user', JSON.stringify(user));
    return {
      ok: true,
      session: startSession(
        user.username || name,
        user.email || email,
        user.appRole || 'Admin Faskes',
        { documentId: faskesId, name: faskesNameOut },
      ),
    };
  } catch {
    return { ok: false, error: 'Tidak dapat terhubung. Periksa koneksi internet.' };
  }
}

/** Minta tautan reset via email Strapi. */
export async function requestPasswordReset(
  identifier: string,
): Promise<{ ok: true; channel: 'email' } | { ok: false; error: string }> {
  const email = identifier.trim();
  if (!isEmail(email)) {
    return { ok: false, error: 'Masukkan email terdaftar untuk reset kata sandi.' };
  }
  try {
    const res = await fetch(`${baseUrl()}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      return { ok: false, error: await strapiError(res, 'Gagal mengirim tautan reset.') };
    }
    return { ok: true, channel: 'email' };
  } catch {
    return { ok: false, error: 'Tidak dapat terhubung. Periksa koneksi internet.' };
  }
}

/** Reset kata sandi dengan kode dari email + kata sandi baru. */
export async function resetPassword(
  code: string,
  newPassword: string,
  confirmPassword: string,
): Promise<AuthResult> {
  if (!code.trim()) {
    return { ok: false, error: 'Kode verifikasi dari email wajib diisi.' };
  }
  if (newPassword.length < 6) {
    return { ok: false, error: 'Kata sandi baru minimal 6 karakter.' };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'Konfirmasi kata sandi tidak sama.' };
  }
  try {
    const res = await fetch(`${baseUrl()}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.trim(),
        password: newPassword,
        passwordConfirmation: confirmPassword,
      }),
    });
    const body = (await res.json()) as StrapiAuthPayload;
    if (!res.ok || !body.jwt || !body.user) {
      return { ok: false, error: body?.error?.message || 'Kode salah atau kedaluwarsa.' };
    }
    setCookie('jwt', body.jwt, 7);
    setLocalStorage('jwt', body.jwt);
    setLocalStorage('user', JSON.stringify(body.user));
    notifySessionChanged();
    let faskes: SessionFaskes | null = null;
    try {
      const meRes = await fetch(`${baseUrl()}/api/users/me?populate=faskes`, {
        headers: { Authorization: `Bearer ${body.jwt}` },
      });
      const me = (await meRes.json()) as StrapiMe;
      if (me.faskes?.documentId) {
        faskes = { documentId: me.faskes.documentId, name: me.faskes.name ?? '' };
      }
    } catch {
      /* abaikan — sesi tanpa faskes */
    }
    return {
      ok: true,
      session: startSession(
        body.user.username || '',
        body.user.email || '',
        body.user.appRole || 'Pengguna',
        faskes,
      ),
    };
  } catch {
    return { ok: false, error: 'Tidak dapat terhubung. Periksa koneksi internet.' };
  }
}

/** Baca JWT Strapi tersimpan (untuk fetcher non-hook). */
export function getStrapiJwt(): string | null {
  return getLocalStorage('jwt');
}
