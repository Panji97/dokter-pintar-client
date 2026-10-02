import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth/ForgotForm';

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi — Dokter Pintar',
  description: 'Atur ulang kata sandi akun Dokter Pintar Anda.',
};

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
