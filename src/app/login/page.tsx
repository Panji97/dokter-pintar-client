import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Masuk — Dokter Pintar',
  description: 'Masuk ke aplikasi SIM & RME Dokter Pintar.',
};

export default function LoginPage() {
  return <LoginForm />;
}
