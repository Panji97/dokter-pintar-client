import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { RootProviders } from "@/components/layout/RootProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dokter Pintar — SIM & RME FasKes",
  description: "Sistem Informasi Manajemen FasKes & Rekam Medis Elektronik (RME) untuk FasKes Gigi dan Umum.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Pasang class dark sebelum paint agar tidak ada flash terang. */}
        <Script
          id="dokterpintar-theme-init"
          strategy="beforeInteractive"
        >{`(function(){try{var t=localStorage.getItem('dokter-pintar-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`}</Script>
      </head>
      <body className="min-h-full"><RootProviders>{children}</RootProviders></body>
    </html>
  );
}
