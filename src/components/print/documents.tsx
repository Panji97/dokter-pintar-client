'use client';

/**
 * Template dokumen cetak Dokter Pintar — HTML/CSS untuk di-render browser
 * lalu Cetak / Save as PDF (pola yang sama seperti HRIS).
 *
 * Semua template memakai kop faskes yang sama + gaya dunia kesehatan:
 * bersih, teal accent, tabel jelas, tanda tangan, nomor dokumen.
 */
import { Cross } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useFetch } from '@/lib/strapi';
import { fmtRupiah, fmtDate } from '@/lib/ClinicStore';
import type {
  Invoice, ApotekInvoice, Letter, Referral, Registration,
  Patient, EmrDocument,
} from '@/types/clinic';

/* ================= Kop & bingkai bersama ================= */

export interface FaskesKop {
  name: string;
  address: string;
  phone: string;
}

/** Profil faskes untuk kop: dari API bila bisa, fallback nama sesi. */
export function useFaskesKop(): FaskesKop {
  const session = typeof window !== 'undefined' ? getSession() : null;
  const docId = session?.faskes?.documentId ?? '';
  const { data } = useFetch(docId ? `/api/faskes-list/${docId}` : (null as unknown as string));
  const f = (data as { data?: Partial<FaskesKop> } | undefined)?.data;
  return {
    name: f?.name || session?.faskes?.name || 'Fasilitas Kesehatan',
    address: f?.address || '-',
    phone: f?.phone || '-',
  };
}

function Kop({ title, docNo, date, faskes }: {
  title: string;
  docNo?: string;
  date?: string;
  faskes: FaskesKop;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 px-7 pt-7">
        <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center shrink-0 print:bg-teal-600">
          <Cross className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-slate-900 leading-tight">{faskes.name}</h1>
          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{faskes.address}</p>
          <p className="text-[11px] text-slate-500">Telp: {faskes.phone}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-teal-700 font-bold">{title}</p>
          {docNo && <p className="text-[11px] font-mono text-slate-600 mt-0.5">{docNo}</p>}
          {date && <p className="text-[11px] text-slate-500 mt-0.5">{date}</p>}
        </div>
      </div>
      <div className="px-7 mt-3">
        <div className="border-t-[3px] border-teal-600" />
        <div className="border-t border-slate-300 mt-[2px]" />
      </div>
    </div>
  );
}

function SignRow({ leftLabel, leftName, rightLabel, rightName, city }: {
  leftLabel: string; leftName: string;
  rightLabel: string; rightName: string;
  city?: string;
}) {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="px-7 pb-7 mt-8 grid grid-cols-2 gap-6 text-center">
      <div>
        <p className="text-[11px] text-slate-500">{leftLabel}</p>
        <div className="h-16" />
        <p className="text-xs font-bold text-slate-800 underline underline-offset-2">{leftName || '( … )'} </p>
      </div>
      <div>
        <p className="text-[11px] text-slate-500">{city ? `${city}, ${today}` : today}</p>
        <p className="text-[11px] text-slate-500">{rightLabel}</p>
        <div className="h-16" />
        <p className="text-xs font-bold text-slate-800 underline underline-offset-2">{rightName || '( … )'}</p>
      </div>
    </div>
  );
}

function DocNote({ text }: { text: string }) {
  return (
    <p className="mx-7 mb-2 text-[10px] italic text-slate-400 leading-relaxed border-t border-dashed border-slate-200 pt-2">
      {text}
    </p>
  );
}

function Shell({ title, docNo, date, faskes, children }: {
  title: string; docNo?: string; date?: string; faskes: FaskesKop; children: React.ReactNode;
}) {
  return (
    <div className="bg-white text-slate-800 text-[12px] leading-relaxed">
      <Kop title={title} docNo={docNo} date={date} faskes={faskes} />
      <div className="px-7 py-5">{children}</div>
    </div>
  );
}

const th = 'px-2.5 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-50 border border-slate-200';
const td = 'px-2.5 py-2 border border-slate-200 text-[12px]';
const tdR = 'px-2.5 py-2 border border-slate-200 text-[12px] text-right';

/** Terbilang rupiah sederhana untuk kwitansi. */
export function terbilang(n: number): string {
  const kata = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const rec = (x: number): string => {
    if (x < 12) return kata[x];
    if (x < 20) return `${rec(x - 10)} belas`;
    if (x < 100) return `${rec(Math.floor(x / 10))} puluh ${rec(x % 10)}`.replace(' nol', '');
    if (x < 200) return `seratus ${rec(x - 100)}`.replace(' nol', '');
    if (x < 1000) return `${rec(Math.floor(x / 100))} ratus ${rec(x % 100)}`.replace(' nol', '');
    if (x < 2000) return `seribu ${rec(x - 1000)}`.replace(' nol', '');
    if (x < 1000000) return `${rec(Math.floor(x / 1000))} ribu ${rec(x % 1000)}`.replace(' nol', '');
    if (x < 1000000000) return `${rec(Math.floor(x / 1000000))} juta ${rec(x % 1000000)}`.replace(' nol', '');
    return `${rec(Math.floor(x / 1000000000))} miliar ${rec(x % 1000000000)}`.replace(' nol', '');
  };
  return `${rec(Math.max(0, Math.floor(n))).trim()} rupiah`.replace(/\s+/g, ' ');
}

function PatientBox({ patient, rows }: { patient?: Patient; rows: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
      {patient && (
        <>
          <InfoRow label="Nama Pasien" value={patient.name} />
          <InfoRow label="NIK" value={patient.nik || '-'} />
          <InfoRow
            label="Tgl. Lahir / JK"
            value={`${patient.birthDate ? fmtDate(patient.birthDate) : '-'} / ${patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`}
          />
          <InfoRow label="Gol. Darah" value={patient.bloodType || '-'} />
        </>
      )}
      {rows.map(([l, v]) => (
        <InfoRow key={l} label={l} value={v} />
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[12px] min-w-0">
      <span className="w-28 shrink-0 text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <span className="font-medium text-slate-800 break-words">{value}</span>
    </div>
  );
}

/* ================= 1. Kwitansi Tagihan Pasien ================= */

export function InvoiceDoc({ invoice, faskes }: { invoice: Invoice; faskes: FaskesKop }) {
  const rows: [string, number][] = [
    ['Konsultasi dokter', invoice.consultationFee],
    ['Tindakan & pelayanan', invoice.procedureFee],
    ['Alat kesehatan (alkes)', invoice.alkesFee],
    ['Obat & farmasi', invoice.medicineFee],
  ];
  return (
    <Shell title="Kwitansi Pembayaran" docNo={`No. ${invoice.id.slice(0, 8).toUpperCase()}`} date={fmtDate(invoice.date)} faskes={faskes}>
      <PatientBox rows={[
        ['Grup Pasien', invoice.group],
        ['Dokter', invoice.doctor],
        ['Status', invoice.paymentStatus + (invoice.paymentMethod ? ` · ${invoice.paymentMethod}` : '')],
        ['Tgl. Bayar', invoice.paidAt ? fmtDate(invoice.paidAt) : '-'],
      ]} patient={undefined} />
      {/* Nama pasien menonjol (tanpa data master penuh di billing) */}
      <p className="mt-3 text-sm"><span className="text-slate-500">Pasien: </span><b className="text-slate-900">{invoice.patientName}</b></p>

      <table className="w-full mt-3 border-collapse">
        <thead>
          <tr>
            <th className={th} style={{ width: 32 }}>No</th>
            <th className={th}>Uraian</th>
            <th className={`${th} text-right`}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, val], i) => (
            <tr key={label}>
              <td className={`${td} text-center text-slate-500`}>{i + 1}</td>
              <td className={td}>{label}</td>
              <td className={tdR}>{fmtRupiah(val)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className={`${td} text-right text-slate-500`}>Diskon</td>
            <td className={`${tdR} text-rose-600`}>−{fmtRupiah(invoice.discount)}</td>
          </tr>
          <tr className="bg-teal-50/60">
            <td colSpan={2} className={`${td} text-right font-bold text-slate-800`}>TOTAL BAYAR</td>
            <td className={`${tdR} font-extrabold text-teal-800 text-[14px]`}>{fmtRupiah(invoice.total)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 capitalize">
        <span className="text-slate-500 normal-case">Terbilang: </span>
        <i className="font-medium text-slate-700">“{terbilang(invoice.total)}”</i>
      </p>
      <SignRow leftLabel="Pasien / Keluarga" leftName={invoice.patientName} rightLabel="Kasir" rightName="" />
      <DocNote text="Simpan kwitansi ini sebagai bukti pembayaran yang sah. Dana yang sudah dibayarkan tidak dapat diminta kembali kecuali atas kebijakan faskes." />
    </Shell>
  );
}

/* ================= 2. Struk Apotek ================= */

export function ApotekDoc({ apotek, faskes }: { apotek: ApotekInvoice; faskes: FaskesKop }) {
  return (
    <Shell title={apotek.type === 'Obat Bebas' ? 'Struk Penjualan Bebas' : 'Struk Penjualan Resep'} docNo={`No. ${apotek.id.slice(0, 8).toUpperCase()}`} date={fmtDate(apotek.date)} faskes={faskes}>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
        <InfoRow label="Pembeli" value={apotek.patientName} />
        <InfoRow label="Jenis" value={apotek.type} />
        <InfoRow label="Status" value={apotek.paymentStatus} />
      </div>
      <table className="w-full mt-3 border-collapse">
        <thead>
          <tr>
            <th className={th} style={{ width: 32 }}>No</th>
            <th className={th}>Nama Obat / Alkes</th>
            <th className={`${th} text-center`}>Qty</th>
            <th className={`${th} text-right`}>Harga</th>
            <th className={`${th} text-right`}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {apotek.items.map((it, i) => (
            <tr key={it.id}>
              <td className={`${td} text-center text-slate-500`}>{i + 1}</td>
              <td className={`${td} font-medium`}>{it.name}</td>
              <td className={`${td} text-center`}>{it.qty}</td>
              <td className={tdR}>{fmtRupiah(it.price)}</td>
              <td className={tdR}>{fmtRupiah(it.qty * it.price)}</td>
            </tr>
          ))}
          {apotek.items.length === 0 && (
            <tr><td colSpan={5} className={`${td} text-center text-slate-400`}>Tidak ada item.</td></tr>
          )}
          <tr className="bg-teal-50/60">
            <td colSpan={4} className={`${td} text-right font-bold`}>TOTAL</td>
            <td className={`${tdR} font-extrabold text-teal-800 text-[14px]`}>{fmtRupiah(apotek.total)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-500">Obat digunakan sesuai anjuran. Simpan di tempat sejuk & kering, jauhkan dari jangkauan anak.</p>
      <SignRow leftLabel="Pembeli" leftName={apotek.patientName} rightLabel="Apoteker" rightName="" />
      <DocNote text="Periksa kembali nama obat, jumlah, dan aturan pakai sebelum meninggalkan apotek." />
    </Shell>
  );
}

/* ================= 3. Surat Keterangan ================= */

const SURAT_BODY: Record<string, (p: string, d: string) => string> = {
  'Surat Sakit': (p) => `Menerangkan bahwa ${p} memerlukan istirahat sakit karena kondisi kesehatannya, terhitung sejak tanggal surat ini diterbitkan sesuai keterangan dokter pemeriksa.`,
  'Surat Sehat': (p) => `Menerangkan bahwa ${p} dalam keadaan sehat jasmani berdasarkan pemeriksaan kesehatan pada tanggal surat ini diterbitkan, dan dinyatakan layak untuk keperluan administrasi yang bersangkutan.`,
  'Surat Kematian': (p) => `Menerangkan dengan sesungguhnya bahwa ${p} telah meninggal dunia berdasarkan pemeriksaan dan keterangan yang diterima faskes pada tanggal surat ini diterbitkan.`,
  'Surat Kontrol': (p) => `Menerangkan bahwa ${p} dijadwalkan untuk kontrol ulang / pemeriksaan lanjutan sesuai anjuran dokter pemeriksa. Harap membawa surat ini saat kunjungan berikutnya.`,
  'Surat Keterangan': (p) => `Menerangkan bahwa ${p} telah menjalani pemeriksaan kesehatan di faskes kami dengan hasil sebagaimana tercantum dalam keterangan tambahan di bawah.`,
};

export function SuratDoc({ letter, patient, faskes }: { letter: Letter; patient?: Patient; faskes: FaskesKop }) {
  const body = (SURAT_BODY[letter.kind] ?? SURAT_BODY['Surat Keterangan'])(letter.patientName, letter.doctor);
  return (
    <Shell title={letter.kind} docNo={`No. ${letter.id.slice(0, 8).toUpperCase()}`} date={fmtDate(letter.date)} faskes={faskes}>
      <p className="text-center font-extrabold text-slate-900 text-[15px] uppercase tracking-wide underline underline-offset-4">{letter.kind}</p>
      <div className="mt-4 space-y-3 text-justify">
        <p>Yang bertanda tangan di bawah ini, dokter pemeriksa pada {faskes.name}, menerangkan bahwa:</p>
        <PatientBox patient={patient} rows={[
          ['Dokter Pemeriksa', letter.doctor],
          ['Tanggal', fmtDate(letter.date)],
        ]} />
        {!patient && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <InfoRow label="Nama Pasien" value={letter.patientName} />
            <InfoRow label="Dokter" value={letter.doctor} />
          </div>
        )}
        <p>{body}</p>
        {letter.notes && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Keterangan tambahan</p>
            <p className="mt-1 whitespace-pre-wrap">{letter.notes}</p>
          </div>
        )}
        <p>Demikian surat ini dibuat dengan sesungguhnya untuk dipergunakan sebagaimana mestinya.</p>
      </div>
      <SignRow leftLabel="" leftName="" rightLabel="Dokter Pemeriksa" rightName={letter.doctor} />
      <DocNote text="Surat ini sah bila ditandatangani dokter pemeriksa dan distempel faskes." />
    </Shell>
  );
}

/* ================= 4. Surat Rujukan ================= */

export function RujukanDoc({ referral, patient, faskes }: { referral: Referral; patient?: Patient; faskes: FaskesKop }) {
  return (
    <Shell title={referral.kind} docNo={`No. ${referral.id.slice(0, 8).toUpperCase()}`} date={fmtDate(referral.date)} faskes={faskes}>
      <p className="text-center font-extrabold text-slate-900 text-[15px] uppercase tracking-wide underline underline-offset-4">{referral.kind}</p>
      <p className="text-center text-[11px] text-slate-500 mt-1">Kepada Yth. <b className="text-slate-800">{referral.destination}</b></p>
      <div className="mt-4 space-y-3">
        <p className="text-justify">Dengan hormat, bersama ini kami merujuk pasien berikut untuk mendapatkan penanganan / pemeriksaan lebih lanjut:</p>
        <PatientBox patient={patient} rows={[
          ['Dokter Perujuk', referral.doctor],
          ['Tanggal Rujuk', fmtDate(referral.date)],
        ]} />
        {!patient && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <InfoRow label="Nama Pasien" value={referral.patientName} />
            <InfoRow label="Dokter" value={referral.doctor} />
          </div>
        )}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Diagnosa / Alasan rujukan</div>
          <p className="px-4 py-3 whitespace-pre-wrap">{referral.diagnosis || '-'}</p>
        </div>
        <p className="text-justify">Atas perhatian dan kerja samanya, kami mengucapkan terima kasih.</p>
      </div>
      <SignRow leftLabel="" leftName="" rightLabel="Dokter Perujuk" rightName={referral.doctor} />
      <DocNote text="Harap membawa surat rujukan ini beserta kartu identitas dan dokumen penunjang (hasil lab / radiologi bila ada)." />
    </Shell>
  );
}

/* ================= 5. Salinan Resep ================= */

export interface ResepItem {
  name: string;
  qty: number;
  aturan?: string;
}

export function ResepDoc({ resepNo, patientName, doctor, date, diagnosis, items, copyLabel }: {
  resepNo: string; patientName: string; doctor: string; date: string;
  diagnosis?: string; items: ResepItem[]; copyLabel?: string;
}) {
  const faskesName = typeof window !== 'undefined' ? (getSession()?.faskes?.name || 'Fasilitas Kesehatan') : 'Fasilitas Kesehatan';
  return (
    <div className="bg-white text-slate-800 text-[12px] leading-relaxed">
      <div className="flex items-center justify-between px-7 pt-7">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
            <Cross className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-slate-900 leading-tight">{faskesName}</p>
            <p className="text-[10px] uppercase tracking-widest text-teal-700 font-bold">Salinan Resep {copyLabel ? `· ${copyLabel}` : ''}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-mono text-slate-600">{resepNo}</p>
          <p className="text-[11px] text-slate-500">{date}</p>
        </div>
      </div>
      <div className="px-7 mt-3">
        <div className="border-t-[3px] border-teal-600" />
        <div className="border-t border-slate-300 mt-[2px]" />
      </div>
      <div className="px-7 py-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <InfoRow label="Pasien" value={patientName} />
          <InfoRow label="Dokter" value={doctor} />
          {diagnosis && <InfoRow label="Diagnosa" value={diagnosis} />}
        </div>
        <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">R/ — Daftar obat</div>
          <div className="divide-y divide-slate-100">
            {items.map((it, i) => (
              <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 text-[11px] font-bold flex items-center justify-center shrink-0">R{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{it.name} <span className="font-medium text-slate-500">× {it.qty}</span></p>
                  {it.aturan && <p className="text-[11px] text-slate-500 italic">Aturan: {it.aturan}</p>}
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="px-4 py-4 text-center text-slate-400 text-[11px]">Tidak ada item resep.</p>}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Minum / gunakan obat sesuai aturan. Habiskan antibiotik sesuai anjuran meski keluhan membaik.</p>
        <div className="mt-6 grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="text-[11px] text-slate-500">Penerima</p>
            <div className="h-14" />
            <p className="text-xs font-bold underline underline-offset-2">{patientName}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Dokter Penulis Resep</p>
            <div className="h-14" />
            <p className="text-xs font-bold underline underline-offset-2">{doctor}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 6. Resume Rekam Medis ================= */

export function ResumeDoc({ reg, patient, emr, faskes }: {
  reg: Registration; patient?: Patient; emr: EmrDocument; faskes: FaskesKop;
}) {
  const secTitle = 'text-[10px] uppercase tracking-wider font-extrabold text-teal-800 bg-teal-50 border border-teal-100 rounded-md px-3 py-1.5 mt-4';
  const field = (l: string, v: string) => v?.trim() ? (
    <div className="flex gap-2 text-[12px]"><span className="w-32 shrink-0 text-slate-500">{l}</span><span className="text-slate-400">:</span><span className="font-medium break-words">{v}</span></div>
  ) : null;
  return (
    <Shell title="Resume Medis" docNo={`Kunjungan ${fmtDate(reg.regDate)}`} date={fmtDate(reg.regDate)} faskes={faskes}>
      <PatientBox patient={patient} rows={[
        ['Poli / Layanan', `${reg.room} · ${reg.serviceType}`],
        ['Dokter', reg.doctor],
        ['Grup Pasien', reg.group],
        ['Status', reg.status],
      ]} />
      {!patient && <p className="mt-2 text-sm"><span className="text-slate-500">Pasien: </span><b>{reg.patientName}</b></p>}

      <p className={secTitle}>S — Subjektif (Keluhan)</p>
      <div className="mt-2 space-y-1">
        {field('Keluhan utama', emr.anamnesaUmum.keluhanUtama)}
        {field('Keluhan tambahan', emr.anamnesaUmum.keluhanTambahan)}
        {field('Riwayat penyakit', emr.anamnesaUmum.riwayatPenyakit)}
        {field('Penyakit saat ini', emr.anamnesaUmum.penyakitSaatIni)}
        {field('Alergi obat', emr.anamnesaUmum.alergi.obat)}
      </div>

      <p className={secTitle}>O — Objektif (Pemeriksaan)</p>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
        {field('Tensi', emr.pemeriksaanUmum.tensiSistolik ? `${emr.pemeriksaanUmum.tensiSistolik}/${emr.pemeriksaanUmum.tensiDiastolik} mmHg` : '')}
        {field('Nadi', emr.pemeriksaanUmum.nadi ? `${emr.pemeriksaanUmum.nadi} x/mnt` : '')}
        {field('Suhu', emr.pemeriksaanUmum.suhu ? `${emr.pemeriksaanUmum.suhu} °C` : '')}
        {field('BB / TB', (emr.pemeriksaanUmum.beratBadan || emr.pemeriksaanUmum.tinggiBadan) ? `${emr.pemeriksaanUmum.beratBadan || '-'} kg / ${emr.pemeriksaanUmum.tinggiBadan || '-'} cm` : '')}
      </div>
      <div className="mt-1 space-y-1">{field('Deskripsi', emr.pemeriksaanUmum.deskripsi)}</div>

      <p className={secTitle}>A — Asesmen (Diagnosa)</p>
      <div className="mt-2 space-y-1">
        {emr.diagnosa.length === 0 && <p className="text-slate-400 text-[12px]">-</p>}
        {emr.diagnosa.map((d) => (
          <p key={d.id} className="text-[12px]">• <b>{d.icd10Code}</b> — {d.icd10Desc} <span className="text-slate-400">({d.type})</span></p>
        ))}
      </div>

      <p className={secTitle}>P — Plan (Tindakan, Alkes, Resep)</p>
      {emr.tindakan.length > 0 && (
        <table className="w-full mt-2 border-collapse">
          <thead><tr><th className={th}>Tindakan</th><th className={`${th} text-center`}>Gigi</th><th className={`${th} text-center`}>Qty</th><th className={`${th} text-right`}>Biaya</th></tr></thead>
          <tbody>
            {emr.tindakan.map((t) => (
              <tr key={t.id}><td className={td}>{t.name}</td><td className={`${td} text-center`}>{t.tooth}</td><td className={`${td} text-center`}>{t.qty}</td><td className={tdR}>{fmtRupiah(t.qty * t.price - t.discount)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {emr.resepApotek.flatMap((r) => r.items).length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-bold text-slate-600">Resep apotek:</p>
          {emr.resepApotek.flatMap((r) => r.items).map((it) => (
            <p key={it.id} className="text-[12px]">• {it.name} × {it.qty}</p>
          ))}
        </div>
      )}
      {emr.tindakan.length === 0 && emr.resepApotek.flatMap((r) => r.items).length === 0 && (
        <p className="text-slate-400 text-[12px] mt-2">-</p>
      )}

      <SignRow leftLabel="Pasien / Keluarga" leftName={reg.patientName} rightLabel="Dokter Pemeriksa" rightName={reg.doctor} />
      <DocNote text="Resume ini ringkasan kunjungan dan bukan pengganti rekam medis lengkap. Minta salinan lengkap ke bagian rekam medis bila diperlukan." />
    </Shell>
  );
}

/* ================= 7. Laporan ================= */

export interface LaporanRow {
  cells: string[];
}

export function LaporanDoc({ variantTitle, periode, stats, columns, rows, faskes }: {
  variantTitle: string;
  periode: string;
  stats: [string, string][];
  columns: string[];
  rows: LaporanRow[];
  faskes: FaskesKop;
}) {
  return (
    <Shell title="Laporan Faskes" docNo={variantTitle} date={periode} faskes={faskes}>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map(([l, v]) => (
          <div key={l} className="border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{l}</p>
            <p className="text-[15px] font-extrabold text-slate-900 mt-0.5 break-words">{v}</p>
          </div>
        ))}
      </div>
      <table className="w-full mt-3 border-collapse">
        <thead>
          <tr>{columns.map((c) => <th key={c} className={th}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/60' : ''}>
              {r.cells.map((c, j) => (
                <td key={j} className={`${td} ${j === 0 ? 'text-slate-500 whitespace-nowrap' : ''}`}>{c}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className={`${td} text-center text-slate-400`}>Tidak ada data pada periode ini.</td></tr>
          )}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-500">Total baris: <b className="text-slate-800">{rows.length}</b> · Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <SignRow leftLabel="Mengetahui" leftName="" rightLabel="Penanggung Jawab" rightName="" />
      <DocNote text="Laporan digenerate otomatis dari data sistem pada periode tertera." />
    </Shell>
  );
}
