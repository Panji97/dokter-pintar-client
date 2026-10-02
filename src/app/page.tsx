import Link from 'next/link';
import { LogoLink } from '@/components/layout/LogoLink';
import {
  ScanLine, Smile, FileText, Pill, ReceiptText, BarChart3, FileDigit, FileOutput,
  BadgeCheck, Monitor, Heart,
  HeartPulse, ShieldCheck, Activity, Zap, Smartphone, Check, Quote, ChevronDown,
  ArrowRight, MessageCircle, Mail, Phone, MapPin, Camera, Briefcase, Globe,
  Sparkles, Stethoscope, ClipboardPlus,
} from 'lucide-react';

/* ============================================================
 * DATA KONTEN
 * ============================================================ */

const whyItems = [
  {
    icon: Stethoscope,
    title: 'Praktik Mandiri',
    desc: 'Semua dikerjakan sendiri? Pendaftaran, catatan SOAP, dan kwitansi beres dari satu layar.',
  },
  {
    icon: Smile,
    title: 'Klinik Gigi & Mulut',
    desc: 'Odontogram visual, rencana perawatan bertahap, dan jadwal kontrol yang terpantau.',
  },
  {
    icon: Activity,
    title: 'Klinik Umum & Pratama',
    desc: 'Antrean harian, alur pasien BPJS maupun umum, dan laporan kunjungan otomatis.',
  },
  {
    icon: Sparkles,
    title: 'Klinik Kecantikan',
    desc: 'Paket treatment, dokumentasi before-after, dan pengingat jadwal treatment pasien.',
  },
];

const integrations = [
  { icon: HeartPulse, label: 'SATUSEHAT' },
  { icon: ShieldCheck, label: 'BPJS Kesehatan' },
  { icon: Activity, label: 'PCare' },
  { icon: Zap, label: 'iCare' },
  { icon: Smartphone, label: 'Mobile JKN' },
  { icon: FileDigit, label: 'ICD-10 & ICD-9-CM' },
];

/* Alur kerja harian yang diringkas aplikasi — tampil sebagai strip bernomor di hero. */
const workSteps = [
  {
    icon: ClipboardPlus,
    no: '01',
    title: 'Daftarkan Kunjungan',
    desc: 'Pasien baru & lama tercatat dalam hitungan detik — lengkap dengan poli, dokter, dan penjamin.',
  },
  {
    icon: Stethoscope,
    no: '02',
    title: 'Periksa & Dokumentasikan',
    desc: 'SOAP, odontogram, diagnosa ICD, tindakan, hingga resep terdokumentasi dalam satu layar.',
  },
  {
    icon: ReceiptText,
    no: '03',
    title: 'Selesaikan di Kasir',
    desc: 'Tagihan tersusun otomatis. Terima tunai, QRIS, atau catat sebagai klaim penjamin.',
  },
  {
    icon: BarChart3,
    no: '04',
    title: 'Pantau Lewat Laporan',
    desc: 'Kunjungan, pendapatan, dan stok terpantau real-time kapan pun dibutuhkan.',
  },
];

const supportFeatures = [
  {
    icon: FileDigit,
    title: 'Kode ICD-10 & ICD-9-CM',
    desc: 'Standarisasi kode diagnosa dan tindakan medis agar pencatatan dan klaim lebih akurat.',
  },
  {
    icon: FileOutput,
    title: 'Surat & Rujukan Digital',
    desc: 'Surat sakit, surat sehat, dan rujukan terdokumentasi rapi dalam satu sistem.',
  },
  {
    icon: BadgeCheck,
    title: 'General & Informed Consent',
    desc: 'Formulir persetujuan tindakan medis diisi dan ditandatangani secara digital.',
  },
  {
    icon: Monitor,
    title: 'Dashboard Antrean',
    desc: 'Display antrean pasien real-time untuk ruang tunggu — pasien tahu gilirannya.',
  },
];

interface Tier {
  name: string;
  icon: string;
  badge: string | null;
  check: (feature: string) => boolean;
}

const tiers: Tier[] = [
  {
    name: 'Starter',
    icon: 'bg-gradient-to-r from-teal-200 to-teal-300',
    badge: null,
    check: (f) => ['Rekam Medis', 'Laporan Rekam Medis, Pendapatan dan SKP', 'Surat Sakit, Surat Sehat dan Rujukan', 'Billing (Tagihan Pasien)'].includes(f),
  },
  {
    name: 'Growth',
    icon: 'bg-gradient-to-r from-teal-300 to-teal-400',
    badge: 'Best offer',
    check: (f) => [
      'Rekam Medis', 'Laporan Rekam Medis, Pendapatan dan SKP', 'Surat Sakit, Surat Sehat dan Rujukan',
      'Billing (Tagihan Pasien)', 'Riwayat CPPT', 'Dashboard', 'Booking Online & Notifikasi', 'Registrasi Cepat (Scan)',
      'Farmasi',
    ].includes(f),
  },
  {
    name: 'Pro',
    icon: 'bg-gradient-to-r from-teal-500 to-teal-600',
    badge: 'Best offer',
    check: () => true,
  },
];

const tierFeatureList = [
  'Rekam Medis',
  'Laporan Rekam Medis, Pendapatan dan SKP',
  'Surat Sakit, Surat Sehat dan Rujukan',
  'Billing (Tagihan Pasien)',
  'Riwayat CPPT',
  'Dashboard',
  'Booking Online & Notifikasi',
  'Registrasi Cepat (Scan)',
  'Farmasi',
  'Odontogram Interaktif',
  'Kajian Resep',
  'Klaim Asuransi',
];

const testimonials = [
  {
    quote:
      'Pencatatan gigi yang tadinya menumpuk di kertas sekarang rapi dan cepat dicari. Waktu kontrol tiap pasien jadi jauh lebih singkat.',
    name: 'drg. Sinta Maharani',
    role: 'Klinik Gigi Senyum Ceria, Surabaya',
    initials: 'SM',
  },
  {
    quote:
      'Kasir dan laporan beres otomatis setiap hari. Stok obat terpantau sehingga tidak ada lagi pembelian dobel yang tidak perlu.',
    name: 'dr. Hendra Gunawan',
    role: 'Klinik Pratama Sehat Bersama, Semarang',
    initials: 'HG',
  },
  {
    quote:
      'Saya praktik sendiri dan semuanya saya kerjakan dari satu aplikasi — dari pendaftaran sampai kwitansi. Praktis sekali.',
    name: 'dr. Maya Kusuma',
    role: 'Praktik Mandiri, Yogyakarta',
    initials: 'MK',
  },
];

const faqs = [
  {
    q: 'Berapa lama proses implementasi di tempat kami?',
    a: 'Umumnya 1–3 hari kerja. Anda cukup mendaftarkan akun, mengatur daftar poli, dokter, dan tarif layanan — setelah itu FasKes sudah bisa menerima pasien. Tim kami mendampingi lewat WhatsApp selama masa onboarding.',
  },
  {
    q: 'Apakah perlu membeli server atau instalasi khusus?',
    a: 'Tidak perlu. Dokter Pintar 100% berjalan di cloud — cukup buka lewat browser di HP, tablet, atau komputer yang sudah Anda miliki. Tidak ada biaya perangkat tambahan.',
  },
  {
    q: 'Apakah data pasien kami aman?',
    a: 'Keamanan berlapis: koneksi terenkripsi, pencadangan otomatis, hak akses berbeda untuk tiap peran (dokter, perawat, apoteker, kasir), serta catatan audit setiap perubahan data penting.',
  },
  {
    q: 'Bisakah dipakai untuk banyak cabang sekaligus?',
    a: 'Bisa. Kelola banyak cabang dalam satu akun dengan data terpusat — laporan tiap cabang maupun gabungan dapat dilihat dari satu dasbor.',
  },
  {
    q: 'Apakah ada masa percobaan gratis?',
    a: 'Ada. Anda dapat mencoba semua fitur paket Growth selama 14 hari tanpa kartu kredit. Jika cocok, lanjutkan ke paket berbayar; jika tidak, data uji coba dapat dihapus permanen.',
  },
];

/* ============================================================
 * KOMPONEN KECIL
 * ============================================================ */

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
        <Sparkles className="w-3.5 h-3.5" />
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
      {sub && <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{sub}</p>}
    </div>
  );
}

function CheckItem({ label, included }: { label: string; included: boolean }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm ${included ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${included ? 'text-teal-600 dark:text-teal-400' : 'text-slate-300 dark:text-slate-600'}`} />
      <span className={included ? 'font-semibold' : ''}>{label}</span>
    </li>
  );
}

/* ============================================================
 * LANDING PAGE
 * ============================================================ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ============ Navbar ============ */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 dark:bg-slate-950/90 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <LogoLink className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-600/30">
              <span className="text-white font-black text-base">D</span>
            </div>
            <div className="leading-tight">
              <div className="font-black text-teal-800 dark:text-teal-300 tracking-tight">Dokter Pintar</div>
              <div className="text-[9px] text-teal-600 dark:text-teal-400 uppercase tracking-[0.18em] font-bold">Pendamping Digital FasKes</div>
            </div>
          </LogoLink>

          <nav className="hidden md:flex items-center gap-7 text-sm font-bold text-slate-600 dark:text-slate-300">
            <a href="#fitur" className="hover:text-teal-700 dark:hover:text-teal-300 transition">Fitur</a>
            <a href="#paket" className="hover:text-teal-700 dark:hover:text-teal-300 transition">Paket</a>
            <a href="#testimoni" className="hover:text-teal-700 dark:hover:text-teal-300 transition">Testimoni</a>
            <a href="#faq" className="hover:text-teal-700 dark:hover:text-teal-300 transition">FAQ</a>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-6 py-2 shadow-md shadow-teal-600/25 transition"
          >
            Masuk
          </Link>
        </div>
      </header>

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-white to-white dark:from-teal-950/20 dark:via-slate-950 dark:to-slate-950">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-200/50 blur-3xl dark:bg-teal-500/10" />
        <div aria-hidden className="pointer-events-none absolute top-64 -left-32 w-96 h-96 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 mx-auto max-w-3xl h-40 bg-dots text-teal-600/25 dark:text-teal-400/10" />

        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 pb-12 lg:pt-24 lg:pb-14 text-center relative">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-teal-600/40 dark:border-teal-400/30 bg-white dark:bg-teal-500/10 text-teal-800 dark:text-teal-300 text-xs font-black">
              <Stethoscope className="w-3.5 h-3.5" />
              SIM &amp; RME Cloud untuk FasKes Indonesia
            </span>

            <h1 className="mt-6 text-4xl md:text-5xl lg:text-[3.4rem] font-black text-teal-800 dark:text-teal-300 tracking-tight leading-[1.08]">
              Urus Pasien &amp; Operasional Klinik{' '}
              <span className="bg-gradient-to-r from-teal-600 to-teal-400 dark:from-teal-400 dark:to-teal-300 bg-clip-text text-transparent">
                dalam Satu Aplikasi
              </span>
            </h1>

            <p className="mt-5 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Dari pendaftaran hingga laporan keuangan — Dokter Pintar merapikan alur kerja harian
              praktik mandiri, klinik gigi, klinik umum, dan klinik kecantikan tanpa ribet dan tanpa
              aplikasi terpisah.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-7 py-3.5 shadow-lg shadow-teal-600/30 transition"
              >
                Demo Gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#kontak"
                className="inline-flex items-center gap-2 rounded-full border-2 border-teal-600/50 dark:border-teal-400/40 text-teal-800 dark:text-teal-300 text-sm font-bold px-7 py-3 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi Kami
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {['Coba gratis 14 hari', 'Tanpa install server', 'Siap SATUSEHAT & BPJS'].map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Strip alur kerja harian di FasKes */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-20 lg:pb-28 relative">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workSteps.map(({ icon: Icon, no, title, desc }) => (
              <div key={no} className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm overflow-hidden">
                <span aria-hidden className="absolute -top-4 right-2 text-7xl font-black text-slate-100 dark:text-white/5 select-none">{no}</span>
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Integrasi & Ekosistem ============ */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 text-center">
          <p className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
            Mengikuti standar nasional —
            <span className="text-teal-700 dark:text-teal-400"> terhubung ke ekosistem yang Anda pakai setiap hari.</span>
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {integrations.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-300"
              >
                <Icon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Mobile-first: FasKes dalam genggaman ============ */}
      <section className="bg-white dark:bg-slate-950 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
              <Smartphone className="w-3.5 h-3.5" />
              Mobile-First
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              FasKes dalam Genggaman
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Semua modul — pendaftaran, RME, farmasi, kasir — dirancang mobile-first dan terbuka
              penuh dari browser HP. Tidak perlu install aplikasi, tidak makan memori.
            </p>
            <ul className="mt-6 space-y-3.5">
              {[
                ['Responsif penuh', 'Tampilan menyesuaikan otomatis: HP, tablet, maupun komputer.'],
                ['Tanpa install aplikasi', 'Cukup buka lewat browser — hemat memori dan selalu versi terbaru.'],
                ['Tetap produktif di lapangan', 'Dokter visit atau home care bisa input pemeriksaan langsung dari HP.'],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-900 dark:text-white">{t}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-7 py-3 shadow-lg shadow-teal-600/30 transition"
            >
              Coba Buka dari HP Anda
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mockup HP */}
          <div className="relative flex justify-center">
            <div aria-hidden className="pointer-events-none absolute inset-0 m-auto w-72 h-72 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="relative w-[270px] rounded-[2.5rem] border-[10px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-teal-900/20 overflow-hidden">
              <div className="mx-auto mt-2 w-24 h-5 rounded-full bg-slate-900 dark:bg-slate-700" />
              <div className="px-4 pt-3 pb-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black text-slate-800 dark:text-white">Antrean Hari Ini</div>
                    <div className="text-[9px] font-bold text-slate-400">3 pasien menunggu</div>
                  </div>
                  <span className="relative w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
                  </span>
                </div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 h-9 flex items-center px-3">
                  <span className="text-[10px] font-bold text-slate-400">Cari pasien…</span>
                </div>
                {[
                  ['AN', 'ALWI NADHIF A…', 'Poli Gigi 1'],
                  ['JM', 'JESSICA MILLA', 'Poli Gigi 2'],
                ].map(([ini, nm, poli]) => (
                  <div key={nm} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {ini}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[10px] font-black text-slate-800 dark:text-white truncate">{nm}</span>
                      <span className="block text-[9px] font-bold text-slate-400">{poli}</span>
                    </span>
                    <span className="text-[8px] font-black text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/20 rounded-full px-2 py-0.5 shrink-0">
                      Proses
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {[FileText, Pill, ReceiptText, BarChart3].map((Icon, i) => (
                    <span
                      key={i}
                      className={`mx-auto w-9 h-9 rounded-xl flex items-center justify-center ${
                        i === 0 ? 'bg-teal-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-1 sm:right-6 top-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl px-3 py-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">0 Install</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Mengapa Memilih ============ */}
      <section className="bg-gradient-to-b from-white to-teal-50/60 dark:from-slate-950 dark:to-teal-950/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
          <SectionHeading
            eyebrow="Untuk Siapa"
            title="Dirancang Mengikuti Cara Kerja Anda"
            sub="Empat jenis praktik, satu alur yang menyesuaikan — tanpa mengubah kebiasaan tim Anda."
          />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyItems.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 p-6 flex gap-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-600/10 transition"
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Fitur Unggulan (bento) ============ */}
      <section id="fitur" className="bg-white dark:bg-slate-950 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-20 -right-32 w-96 h-96 rounded-full bg-teal-100/60 blur-3xl dark:bg-teal-500/10" />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20 relative">
          <SectionHeading
            eyebrow="Kemampuan"
            title="Satu Aplikasi, Semua Urusan Klinik Beres"
            sub="Modul-modul inti yang saling terhubung — data mengalir otomatis dari meja pendaftaran sampai laporan."
          />

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Odontogram */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-teal-50/70 dark:bg-teal-500/10 p-6 flex flex-col">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">Odontogram Interaktif</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                Catat kondisi dan tindakan setiap gigi secara visual — dirancang khusus untuk FasKes gigi &amp; mulut.
              </p>
              <div className="mt-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
                <div className="flex justify-between gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-teal-400' : i === 5 ? 'bg-rose-400' : 'bg-transparent'}`} />
                      <span className={`w-4 h-5 rounded-[45%] border-2 ${i === 2 ? 'border-teal-400 bg-teal-100 dark:bg-teal-500/20' : i === 5 ? 'border-rose-400 bg-rose-100 dark:bg-rose-500/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between gap-1 mt-2">
                  {[...Array(8)].map((_, i) => (
                    <span key={i} className={`w-4 h-5 rounded-[45%] border-2 ${i === 1 ? 'border-teal-500 bg-teal-100 dark:bg-teal-500/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`} />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400" /> Karies</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Tindakan</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Selesai</span>
                </div>
              </div>
            </div>

            {/* Registrasi / Scan */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col shadow-sm">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <ScanLine className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">Registrasi Cepat</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                Pendaftaran pasien baru/lama dengan data identitas yang terisi otomatis — cepat dan akurat.
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3">
                <div className="w-32 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white p-3 shrink-0">
                  <div className="text-[9px] font-black tracking-widest flex items-center justify-between">
                    ID CARD <span className="w-3 h-3 rounded-sm bg-teal-300" />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-teal-200/80 shrink-0" />
                    <span className="flex-1 space-y-1">
                      <span className="block h-1.5 rounded bg-teal-100/90" />
                      <span className="block h-1.5 w-3/4 rounded bg-teal-100/70" />
                    </span>
                  </div>
                  <div className="mt-2 h-4 w-14 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.9)_0_1.5px,transparent_1.5px_4px)] rounded-sm" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/20 rounded-full px-2.5 py-1">
                  <Check className="w-3 h-3" /> Terisi otomatis
                </span>
              </div>
            </div>

            {/* CPPT */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col shadow-sm">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">CPPT Terstruktur</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                Catatan perkembangan pasien terdokumentasi sistematis oleh seluruh PPA — sesuai standar RME.
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 space-y-2.5">
                {['Anamnesa & pemeriksaan', 'Diagnosa ICD-10', 'Tindakan tercatat', 'Disposisi & resep'].map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Farmasi */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col shadow-sm">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">Farmasi &amp; Kajian Resep</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                Kajian resep, stok obat, penerimaan, hingga retur — semuanya terpantau real-time.
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="relative w-10 h-4 rounded-full bg-teal-500 overflow-hidden">
                      <span className="absolute right-0 w-1/2 h-full bg-teal-700 dark:bg-teal-600" />
                    </span>
                  ))}
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 ml-1">Amoxicillin 500mg</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 w-10">Stok</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full w-4/5 rounded-full bg-teal-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 w-10">Min.</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full w-1/4 rounded-full bg-teal-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col shadow-sm">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <ReceiptText className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">Billing &amp; Kasir</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                Invoice otomatis dari tindakan &amp; resep, pembayaran multi-metode, hingga klaim penjaminan.
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Scaling + Polishing</span><span>Rp 350.000</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Obat 2 item</span><span>Rp 235.400</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">Total</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-teal-700 dark:text-teal-400">
                    Rp 585.400
                    <span className="bg-teal-100 dark:bg-teal-500/20 rounded-full px-2 py-0.5 text-[9px]">LUNAS</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Laporan */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col shadow-sm">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">Laporan &amp; Klaim</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                Laporan kunjungan, pendapatan, dan obat — siap mendukung pengajuan klaim penjaminan.
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4">
                <div className="flex items-end gap-1.5 h-16">
                  {[40, 65, 35, 78, 58, 90, 70].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t-md ${i === 5 ? 'bg-teal-600' : 'bg-teal-200 dark:bg-teal-500/30'}`} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-400">
                  <span>Pendapatan 7 hari</span>
                  <span className="text-teal-700 dark:text-teal-400 font-black">+18%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Fitur Pendukung ============ */}
      <section className="bg-teal-50/70 dark:bg-teal-950/10 border-y border-teal-100 dark:border-teal-500/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
          <SectionHeading
            eyebrow="Pelengkap"
            title="Fitur Pelengkap untuk Operasional Harian"
            sub="Hal-hal kecil yang sering merepotkan — sudah kami bereskan agar tim Anda fokus melayani."
          />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {supportFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-sm font-black text-teal-800 dark:text-teal-300">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Paket ============ */}
      <section id="paket" className="bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
          <SectionHeading
            eyebrow="Paket"
            title="Harga Jujur Sesuai Skala Praktik Anda"
            sub="Mulai dari praktik mandiri hingga jaringan klinik — semua paket sudah termasuk rekam medis elektronik."
          />

          <div className="mt-12 grid md:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-teal-900/5 transition"
              >
                <div className={`px-6 py-5 flex items-center gap-3 bg-gradient-to-r ${tier.icon}`}>
                  <span className="w-10 h-10 rounded-xl bg-white/85 flex items-center justify-center text-teal-700">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{tier.name}</h3>
                  {tier.badge && (
                    <span className="ml-auto rounded-full bg-teal-200 text-teal-800 text-[10px] font-black px-2.5 py-1 uppercase tracking-wide">
                      {tier.badge}
                    </span>
                  )}
                </div>
                <ul className="px-6 py-5 space-y-3 flex-1">
                  {tierFeatureList.map((f) => (
                    <CheckItem key={f} label={f} included={tier.check(f)} />
                  ))}
                </ul>
                <div className="px-6 pb-6">
                  <Link
                    href="/login"
                    className="block text-center rounded-full border-2 border-teal-600 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 text-sm font-black py-2.5 hover:bg-teal-600 hover:text-white transition"
                  >
                    Demo Gratis
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            Mengelola jaringan multi-cabang? Tanyakan paket <span className="text-teal-700 dark:text-teal-400">B2B Enterprise</span> pada tim kami.
          </p>
        </div>
      </section>

      {/* ============ Jejak operasional (kartu statistik terpusat) ============ */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white px-6 py-12 md:p-14 text-center relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots text-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[36rem] h-72 rounded-full bg-teal-400/20 blur-3xl" />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]">
            Jejak Operasional
          </span>
          <h3 className="relative mt-4 text-2xl md:text-3xl font-black tracking-tight max-w-2xl mx-auto leading-snug">
            Ratusan FasKes Menjalankan Operasional Harian di Sini
          </h3>
          <p className="relative mt-3 text-sm text-teal-50/90 max-w-xl mx-auto">
            Pendaftaran pagi, antrean siang, kasir sore — semuanya tercatat rapi dalam satu sistem.
          </p>
          <div className="relative mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              ['350+', 'FasKes Aktif'],
              ['2.400+', 'Pengguna Harian'],
              ['1,2 jt+', 'Data Pasien Aman'],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="text-2xl md:text-4xl font-black tracking-tight">{v}</div>
                <div className="mt-1.5 text-[10px] md:text-xs text-teal-100 font-bold">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Testimoni ============ */}
      <section id="testimoni" className="bg-gradient-to-b from-white to-teal-50/60 dark:from-slate-950 dark:to-teal-950/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
          <SectionHeading
            eyebrow="Testimoni"
            title="Cerita dari Ruang Praktik"
            sub="Mereka yang setiap hari memakai Dokter Pintar — dari meja pendaftaran sampai ruang tindakan."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col relative">
                <Quote className="w-8 h-8 text-teal-600/70 dark:text-teal-400/70 absolute -top-3 right-6" />
                <blockquote className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center text-xs font-black text-teal-700 dark:text-teal-400 shrink-0">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-teal-800 dark:text-teal-300">{t.name}</span>
                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-14 md:p-16 text-center relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots text-white/10" />
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl" />
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight relative">
            Mulai Digitalisasi FasKes Anda Hari Ini
          </h2>
          <p className="mt-3 text-sm md:text-base text-teal-50 max-w-xl mx-auto relative">
            Coba gratis 14 hari dan rasakan bedanya — tanpa kartu kredit, tanpa komitmen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white text-teal-700 text-sm font-black px-7 py-3.5 shadow-lg hover:bg-teal-50 transition"
            >
              Demo Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border-2 border-white/60 text-white text-sm font-black px-7 py-3.5 hover:bg-white/10 transition"
            >
              Masuk ke Aplikasi
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-20">
          <SectionHeading eyebrow="FAQ" title="Pertanyaan yang Sering Diajukan" />
          <div className="mt-10 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 py-4 open:bg-white dark:open:bg-slate-900 open:shadow-sm open:border-teal-200 dark:open:border-teal-500/30 transition"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-black text-slate-900 dark:text-white">
                  {f.q}
                  <span className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center shrink-0 group-open:bg-teal-600 transition">
                    <ChevronDown className="w-4 h-4 text-teal-700 dark:text-teal-400 group-open:text-white transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer id="kontak" className="relative bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots text-white/10" />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 relative">
          {/* Kartu putih tagline */}
          <div className="rounded-3xl bg-white dark:bg-slate-950 px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-teal-800 dark:text-teal-300 tracking-tight">
                Pendamping Digital FasKes Indonesia
              </h3>
              <p className="mt-1.5 text-sm md:text-base text-slate-500 dark:text-slate-400 font-bold">
                Memudahkan akses layanan kesehatan dengan teknologi terjangkau.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-600/30">
                <span className="text-white font-black text-xl">D</span>
              </div>
              <div className="leading-tight">
                <div className="font-black text-teal-800 dark:text-teal-300 text-lg">Dokter Pintar</div>
                <div className="text-[9px] text-teal-600 dark:text-teal-400 uppercase tracking-[0.18em] font-bold">SIM &amp; RME FasKes</div>
              </div>
            </div>
          </div>

          {/* Kolom footer */}
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            <div>
              <div className="flex items-start gap-2 text-teal-50 font-bold">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Gedung Inovasi Digital Lt. 8,<br />Jl. Kesehatan Raya No. 12,<br />Jakarta Selatan</span>
              </div>
              <div className="mt-5 flex items-center gap-2.5">
                {[Camera, Globe, Briefcase, MessageCircle].map((Icon, i) => (
                  <span key={i} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer transition">
                    <Icon className="w-4 h-4 text-white" />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-black text-white">Jelajahi</h4>
              <ul className="mt-4 space-y-2.5 text-teal-50/90 font-bold">
                <li><a href="#fitur" className="hover:text-white hover:underline transition">Fitur</a></li>
                <li><a href="#paket" className="hover:text-white hover:underline transition">Paket</a></li>
                <li><a href="#testimoni" className="hover:text-white hover:underline transition">Testimoni</a></li>
                <li><a href="#faq" className="hover:text-white hover:underline transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white">Hubungi Kami</h4>
              <ul className="mt-4 space-y-2.5 text-teal-50/90 font-bold">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" /> (021) 555 - 0123
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 shrink-0" /> +62 812-3456-7890
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" /> halo@dokterpintar.id
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-5">
              <div className="text-white font-black">Butuh Informasi Dokter Pintar?</div>
              <p className="mt-1.5 text-xs text-teal-50/90 font-bold leading-relaxed">
                Tim kami siap membantu konsultasi dan demonstrasi produk untuk FasKes Anda.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white text-teal-700 text-xs font-black px-4 py-2 hover:bg-teal-50 transition"
              >
                Coba Demo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-teal-100">
            <span>© {new Date().getFullYear()} Dokter Pintar — SIM &amp; RME FasKes. Seluruh hak cipta.</span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-teal-300" />
              Dibuat untuk FasKes Indonesia
            </span>
          </div>
        </div>
      </footer>

      {/* ============ Tombol WhatsApp mengambang ============ */}
      <a
        href="https://wa.me/6281234567890"
        target="_blank"
        rel="noreferrer"
        aria-label="Hubungi kami via WhatsApp"
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 no-print"
      >
        <span className="hidden md:block max-w-0 overflow-hidden group-hover:max-w-56 transition-all duration-300">
          <span className="block whitespace-nowrap rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-200">
            Butuh bantuan? Chat tim kami
          </span>
        </span>
        <span className="relative flex w-13 h-13">
          <span className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-30" />
          <span className="relative w-13 h-13 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-xl shadow-teal-600/40 transition">
            <MessageCircle className="w-6 h-6" />
          </span>
        </span>
      </a>
    </div>
  );
}
