/**
 * Auth mock — berjalan penuh di client (localStorage).
 *
 * Mendukung login & registrasi via Email atau Nomor HP, login Google (mock),
 * serta lupa/reset kata sandi via kode OTP (ditampilkan di layar untuk demo,
 * karena belum ada backend SMS/email).
 *
 * Ketika backend Strapi 5 siap, cukup ganti implementasi fungsi-fungsi di file
 * ini tanpa mengubah pemanggil di halaman.
 */

export interface Session {
  name: string;
  email: string;
  role: string;
  loginAt: string;
}

export type AuthProvider = 'email' | 'phone' | 'google';

export interface AuthUser {
  name: string;
  email: string;
  phone: string;
  /** Hash kata sandi (mock). Kosong untuk akun Google murni. */
  passwordHash: string;
  provider: AuthProvider;
  role: string;
  createdAt: string;
}

const SESSION_KEY = 'dokter-pintar-session';
const USERS_KEY = 'dokter-pintar-users';
const OTP_KEY = 'dokter-pintar-reset-otps';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 menit

interface ResetOtp {
  key: string;
  code: string;
  expiresAt: number;
}

/** Hash sederhana untuk mock — BUKAN keamanan nyata, hanya agar tidak plain-text. */
function hashPassword(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) >>> 0;
  return `mock$${h.toString(36)}$${pw.length}`;
}

/** Normalisasi nomor HP Indonesia ke format 62xxxxxxxxxx. '' bila tidak valid. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return /^62\d{9,13}$/.test(normalized) ? normalized : '';
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function seedUsers(): AuthUser[] {
  const at = new Date().toISOString();
  return [
    {
      name: 'Admin FasKes',
      email: 'admin@dokterpintar.id',
      phone: '6281234567890',
      passwordHash: hashPassword('dokter123'),
      provider: 'email',
      role: 'Administrator',
      createdAt: at,
    },
    {
      name: 'Drg. Putri Andini',
      email: 'dokter@dokterpintar.id',
      phone: '6281298765432',
      passwordHash: hashPassword('dokter123'),
      provider: 'email',
      role: 'Dokter Gigi',
      createdAt: at,
    },
  ];
}

function loadUsers(): AuthUser[] {
  if (typeof window === 'undefined') return seedUsers();
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) {
      const seed = seedUsers();
      window.localStorage.setItem(USERS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as AuthUser[];
  } catch {
    return seedUsers();
  }
}

function saveUsers(users: AuthUser[]): void {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* abaikan */
  }
}

/** Cari user berdasarkan email ATAU nomor HP. */
export function findUser(identifier: string): AuthUser | null {
  const id = identifier.trim();
  if (!id) return null;
  const users = loadUsers();
  const phone = normalizePhone(id);
  return (
    users.find((u) => u.email.toLowerCase() === id.toLowerCase()) ??
    (phone ? (users.find((u) => u.phone === phone) ?? null) : null)
  );
}

/** Ambil sesi aktif. null jika belum login (atau di server, karena localStorage). */
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

function startSession(user: AuthUser): Session {
  const session: Session = {
    name: user.name,
    email: user.email,
    role: user.role,
    loginAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* kuota penuh — sesi tetap berlaku di memori halaman ini */
  }
  return session;
}

export function logout(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
}

/** Hasil operasi auth yang bisa gagal dengan pesan ramah. */
export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

/** Login dengan Email atau Nomor HP + kata sandi. */
export function login(identifier: string, password: string): Session | null {
  const res = loginDetailed(identifier, password);
  return res.ok ? res.session : null;
}

export function loginDetailed(identifier: string, password: string): AuthResult {
  if (!identifier.trim() || !password) {
    return { ok: false, error: 'Email/nomor HP dan kata sandi wajib diisi.' };
  }
  const user = findUser(identifier);
  if (!user) {
    return { ok: false, error: 'Akun tidak ditemukan. Periksa kembali atau daftar dulu.' };
  }
  if (!user.passwordHash) {
    return { ok: false, error: 'Akun ini terdaftar via Google — masuk dengan tombol Google.' };
  }
  if (user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Kata sandi salah. Coba lagi.' };
  }
  return { ok: true, session: startSession(user) };
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

/** Registrasi akun baru via Email dan/atau Nomor HP. */
export function register(input: RegisterInput): AuthResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  if (name.length < 3) {
    return { ok: false, error: 'Nama lengkap minimal 3 karakter.' };
  }
  if (!email && !phone) {
    return { ok: false, error: 'Isi email atau nomor HP (salah satu wajib ada).' };
  }
  if (email && !isEmail(email)) {
    return { ok: false, error: 'Format email tidak valid.' };
  }
  if (input.phone.trim() && !phone) {
    return { ok: false, error: 'Nomor HP tidak valid (contoh: 0812xxxxxxx).' };
  }
  if (input.password.length < 6) {
    return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
  }
  const users = loadUsers();
  if (email && users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'Email sudah terdaftar. Masuk atau reset kata sandi.' };
  }
  if (phone && users.some((u) => u.phone === phone)) {
    return { ok: false, error: 'Nomor HP sudah terdaftar. Masuk atau reset kata sandi.' };
  }
  const user: AuthUser = {
    name,
    email,
    phone,
    passwordHash: hashPassword(input.password),
    provider: email ? 'email' : 'phone',
    role: 'Pengguna',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, session: startSession(user) };
}

/**
 * Login Google (MOCK untuk demo — tanpa OAuth sungguhan).
 * Membuat/memakai akun demo Google lalu memulai sesi.
 * Ganti dengan Google Identity Services + Strapi saat backend siap.
 */
export function loginWithGoogle(): Session {
  const users = loadUsers();
  const email = 'pengguna.google@gmail.com';
  let user = users.find((u) => u.email === email);
  if (!user) {
    user = {
      name: 'Pengguna Google',
      email,
      phone: '',
      passwordHash: '',
      provider: 'google',
      role: 'Pengguna',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
  }
  return startSession(user);
}

/** Minta kode OTP reset ke Email atau Nomor HP terdaftar. Mengembalikan kode (demo). */
export function requestPasswordReset(
  identifier: string
): { ok: true; code: string; channel: 'email' | 'sms' } | { ok: false; error: string } {
  const user = findUser(identifier);
  if (!user) {
    return { ok: false, error: 'Akun tidak ditemukan untuk email/nomor tersebut.' };
  }
  if (!user.passwordHash) {
    return { ok: false, error: 'Akun ini memakai login Google — tidak perlu kata sandi.' };
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const key = user.email || user.phone;
  let otps: ResetOtp[] = [];
  try {
    otps = JSON.parse(window.localStorage.getItem(OTP_KEY) ?? '[]') as ResetOtp[];
  } catch {
    otps = [];
  }
  otps = otps.filter((o) => o.key !== key);
  otps.push({ key, code, expiresAt: Date.now() + OTP_TTL_MS });
  try {
    window.localStorage.setItem(OTP_KEY, JSON.stringify(otps));
  } catch {
    /* abaikan */
  }
  return { ok: true, code, channel: user.email ? 'email' : 'sms' };
}

/** Verifikasi OTP lalu ganti kata sandi. */
export function resetPassword(identifier: string, code: string, newPassword: string): AuthResult {
  if (newPassword.length < 6) {
    return { ok: false, error: 'Kata sandi baru minimal 6 karakter.' };
  }
  const user = findUser(identifier);
  if (!user || !user.passwordHash) {
    return { ok: false, error: 'Akun tidak valid untuk reset kata sandi.' };
  }
  const key = user.email || user.phone;
  let otps: ResetOtp[] = [];
  try {
    otps = JSON.parse(window.localStorage.getItem(OTP_KEY) ?? '[]') as ResetOtp[];
  } catch {
    otps = [];
  }
  const otp = otps.find((o) => o.key === key);
  if (!otp || otp.code !== code.trim()) {
    return { ok: false, error: 'Kode verifikasi salah.' };
  }
  if (Date.now() > otp.expiresAt) {
    return { ok: false, error: 'Kode kedaluwarsa. Minta kode baru.' };
  }
  const users = loadUsers().map((u) =>
    u.email === user.email && u.phone === user.phone
      ? { ...u, passwordHash: hashPassword(newPassword) }
      : u
  );
  saveUsers(users);
  try {
    window.localStorage.setItem(OTP_KEY, JSON.stringify(otps.filter((o) => o.key !== key)));
  } catch {
    /* abaikan */
  }
  return { ok: true, session: startSession({ ...user, passwordHash: hashPassword(newPassword) }) };
}
