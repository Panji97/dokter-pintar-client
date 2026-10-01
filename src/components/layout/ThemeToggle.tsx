'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'dokter-pintar-theme';

/** Tombol mode gelap/terang — dipakai di Topbar. Status awal dibaca
 *  dari class <html> yang sudah dipasang skrip anti-flash di layout. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      /* abaikan — mode tetap berlaku untuk sesi ini */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-600 outline-none"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
