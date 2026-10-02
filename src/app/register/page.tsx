import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Daftar — Dokter Pintar',
  description: 'Buat akun Dokter Pintar dengan email atau nomor HP.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
