'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore } from '@/lib/ClinicStore';
import { Search, History, ClipboardPlus } from 'lucide-react';

type Tab = 'baru' | 'lama';

/** Hitung umur (tahun/bulan/hari) dari tanggal lahir terhadap tanggal acuan. */
function calcAge(birthDate: string, refDate: string) {
  if (!birthDate || !refDate) return null;
  const b = new Date(birthDate);
  const r = new Date(refDate);
  if (Number.isNaN(b.getTime()) || Number.isNaN(r.getTime()) || b > r) return null;
  let y = r.getFullYear() - b.getFullYear();
  let m = r.getMonth() - b.getMonth();
  let d = r.getDate() - b.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(r.getFullYear(), r.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

export default function RegistrasiPage() {
  const router = useRouter();
  const { state, addPatient, addRegistration } = useClinicStore();
  const [tab, setTab] = useState<Tab>('lama');
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  // form pasien baru
  const [form, setForm] = useState({
    title: '', name: '', gender: '', birthDate: '', regDate: todayStr,
    address: '', nik: '', group: 'Umum',
    room: 'Poli Gigi 1', doctor: 'dr. Zaela',
  });
  const age = calcAge(form.birthDate, form.regDate || todayStr);

  // form pasien lama
  const [oldForm, setOldForm] = useState({
    patientId: '', group: 'Umum',
    room: 'Poli Gigi 1', doctor: 'dr. Zaela',
  });

  const rooms = state.rooms.map((r) => r.name);
  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase();
    return state.patients.filter((p) => p.name.toLowerCase().includes(q) || p.nik.includes(search));
  }, [state.patients, search]);

  const submitNew = () => {
    if (!form.name || !form.gender) return;
    const patient = addPatient({
      name: form.name,
      title: form.title || undefined,
      nik: form.nik || '-',
      birthDate: form.birthDate || form.regDate,
      gender: form.gender as 'L' | 'P',
      phone: '',
      address: form.address,
      bloodType: '-',
      allergies: [],
    });
    const reg = addRegistration({
      patientId: patient.id,
      patientName: patient.name,
      group: form.group as never,
      serviceType: 'Pelayanan Dokter Gigi Umum',
      room: form.room,
      doctor: form.doctor,
      regDate: form.regDate ? new Date(`${form.regDate}T00:00:00`).toISOString() : undefined,
    });
    router.push(`/rekam-medis/${reg.id}`);
  };

  const submitOld = () => {
    const p = state.patients.find((x) => x.id === oldForm.patientId);
    if (!p) return;
    const reg = addRegistration({
      patientId: p.id,
      patientName: p.name,
      group: oldForm.group as never,
      serviceType: 'Pelayanan Dokter Gigi Umum',
      room: oldForm.room,
      doctor: oldForm.doctor,
    });
    router.push(`/rekam-medis/${reg.id}`);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
  const labelCls = 'text-xs font-medium text-slate-600 block mb-1';

  return (
    <>
      <Topbar title="Registrasi" subtitle="Pendaftaran pasien baru dan kunjungan pasien lama" />
      <main className="flex-1 p-4 md:p-6">
        <div className="w-full space-y-5">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-full">
          {([
            ['baru', 'Pasien Baru'],
            ['lama', 'Pasien Lama'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-lg transition text-center w-full ${tab === key ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'baru' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-3xl">
            <div className="px-6 py-4 border-b border-slate-100">
              <label className={labelCls}>Tgl. Registrasi (bisa backdate)</label>
              <input
                type="date"
                value={form.regDate}
                max={todayStr}
                onChange={(e) => setForm({ ...form, regDate: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 w-full sm:w-56"
              />
            </div>

            <div className="p-6 space-y-5">
              {/* Layanan FasKes */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Layanan FasKes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Grup Pasien *</label>
                    <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className={inputCls}>
                      {['Umum', 'BPJS Kesehatan', 'Asuransi Swasta', 'Member'].map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Poli *</label>
                    <select value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className={inputCls}>
                      {rooms.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Dokter Pemeriksa *</label>
                    <select value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} className={inputCls}>
                      {state.staff.filter((s) => s.role === 'Dokter Gigi' || s.role === 'Dokter Umum').map((s) => (
                        <option key={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Jadwal Dokter *</label>
                    <select disabled className={`${inputCls} bg-slate-100 text-slate-400`}>
                      <option>Pilih...</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Informasi Pribadi */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Informasi Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nama Lengkap *</label>
                    <div className="flex gap-2">
                      <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputCls} w-24`}>
                        <option value="">Title</option>
                        <option>Tn.</option><option>Ny.</option><option>An.</option><option>By.</option>
                      </select>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Jenis Kelamin *</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>
                      <option value="">Pilih...</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tgl. Lahir *</label>
                    <input type="date" value={form.birthDate} max={form.regDate || todayStr} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Umur (otomatis)</label>
                    <div className="px-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                      {age ? `${age.y} th ${age.m} bl ${age.d} hr` : 'Isi tanggal lahir dulu'}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Alamat Lengkap *</label>
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>
                      NIK <span className="text-slate-400 font-normal">(wajib jika data dikirim ke SATUSEHAT)</span>
                    </label>
                    <input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={submitNew}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Cari Data Pasien</h3>
            </div>
            <div className="px-6 py-4 flex gap-2 border-b border-slate-50">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari Nama Pasien atau No. KTP"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400"
                />
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Nama Pasien</th>
                  <th className="px-4 py-3 font-semibold">NIK</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.nik}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setOldForm((f) => ({ ...f, patientId: p.id }))}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md transition mr-2 ${
                          oldForm.patientId === p.id ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <History className="w-3 h-3" /> Pilih
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {filteredPatients.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">Pasien tidak ditemukan.</div>
            )}

            {/* Form layanan untuk pasien terpilih */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Grup Pasien</label>
                  <select value={oldForm.group} onChange={(e) => setOldForm({ ...oldForm, group: e.target.value })} className={inputCls}>
                    {['Umum', 'BPJS Kesehatan', 'Asuransi Swasta', 'Member'].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Poli</label>
                  <select value={oldForm.room} onChange={(e) => setOldForm({ ...oldForm, room: e.target.value })} className={inputCls}>
                    {rooms.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Dokter Pemeriksa</label>
                  <select value={oldForm.doctor} onChange={(e) => setOldForm({ ...oldForm, doctor: e.target.value })} className={inputCls}>
                    {state.staff.filter((s) => s.role === 'Dokter Gigi' || s.role === 'Dokter Umum').map((s) => (
                      <option key={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={submitOld}
                    disabled={!oldForm.patientId}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-40"
                  >
                    <ClipboardPlus className="w-4 h-4" />
                    Registrasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </>
  );
}
