'use client';

import { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { useClinicStore } from '@/lib/ClinicStore';
import { useOptionGroup } from '@/lib/useOptions';
import { FaskesInfo } from '@/components/pengaturan/FaskesInfo';
import { StaffAccounts } from '@/components/pengaturan/StaffAccounts';
import { ServiceCrud } from '@/components/pengaturan/ServiceCrud';
import { PackageCrud } from '@/components/pengaturan/PackageCrud';
import { DiscountCrud } from '@/components/pengaturan/DiscountCrud';
import { ScheduleCrud } from '@/components/pengaturan/ScheduleCrud';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Settings, Globe, Save, Check, Plus, Trash2, UserPlus, CalendarClock, Building2, Users, Stethoscope,
} from 'lucide-react';

type MainTab = 'sistem' | 'eksternal';
type SysTab = 'pelayanan' | 'jadwal' | 'pegawai' | 'faskes' | 'akun';
type ServiceTab = 'poli' | 'pelayanan' | 'paket' | 'diskon';
type ExtTab = 'bpjs' | 'fonnte';

export default function PengaturanPage() {
  const { state, ensureModule, addRoom, removeRoom, addStaff, toggleStaffActive } = useClinicStore();
  const [mainTab, setMainTab] = useState<MainTab>('sistem');
  const [sysTab, setSysTab] = useState<SysTab>('pelayanan');
  const [svcTab, setSvcTab] = useState<ServiceTab>('poli');
  const [extTab, setExtTab] = useState<ExtTab>('bpjs');
  const [saved, setSaved] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [newStaff, setNewStaff] = useState({ name: '', role: '', room: 'Poli Gigi & Mulut' });
  // Paket/diskon/jadwal dimuat on-demand (modul pengaturan).
  useEffect(() => {
    ensureModule('pengaturan');
  }, [ensureModule]);
  // Peran pegawai — wajib dari API (ms-options), tidak boleh hardcode.
  const { items: staffRoles, isLoading: loadingStaffRoles } = useOptionGroup('staff-role');
  const staffRoleValue = newStaff.role || staffRoles[0]?.value || '';
  const { confirm, dialog } = useConfirmDialog();

  const removePoli = async (id: string, name: string) => {
    const ok = await confirm({ title: 'Hapus poli?', message: `"${name}" akan dihapus dari master.` });
    if (!ok) return;
    removeRoom(id);
  };

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
  const labelCls = 'text-xs font-medium text-slate-600 block mb-1';
  const subTabCls = (active: boolean) =>
    `flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-xs font-medium transition border text-center shrink-0 whitespace-nowrap ${
      active
        ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/25 font-semibold'
        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
    }`;

  return (
    <>
      <Topbar title="Pengaturan" subtitle="Pengaturan sistem, pelayanan, pegawai, dan integrasi eksternal" />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Tab utama */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-full">
          {([
            ['sistem', 'Pengaturan Sistem'],
            ['eksternal', 'Pengaturan Eksternal'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`px-5 py-2.5 rounded-lg transition text-center w-full font-medium ${mainTab === key ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ==================== PENGATURAN SISTEM ==================== */}
        {mainTab === 'sistem' && (
          <div className="space-y-4">
            <div className="flex lg:grid lg:grid-cols-5 gap-2 w-full overflow-x-auto lg:overflow-visible bg-white border border-slate-200 rounded-xl p-2 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                ['pelayanan', 'Pelayanan', Stethoscope],
                ['jadwal', 'Jadwal', CalendarClock],
                ['pegawai', 'Pegawai', Users],
                ['faskes', 'FasKes', Building2],
                ['akun', 'Akun', Settings],
              ] as const).map(([key, label, Icon]) => (
                <button key={key} onClick={() => setSysTab(key)} className={subTabCls(sysTab === key)}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Pelayanan */}
            {sysTab === 'pelayanan' && (
              <div className="space-y-4">
                <div className="flex md:grid md:grid-cols-4 gap-2 w-full overflow-x-auto md:overflow-visible pb-1 md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {([
                    ['poli', 'Poli'],
                    ['pelayanan', 'Pelayanan'],
                    ['paket', 'Paket Pelayanan'],
                    ['diskon', 'Diskon Pelayanan'],
                  ] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setSvcTab(key)} className={subTabCls(svcTab === key)}>{label}</button>
                  ))}
                </div>

                {svcTab === 'poli' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                      <h2 className="font-bold text-slate-800 text-sm">Poli FasKes</h2>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input
                          value={newRoom}
                          onChange={(e) => setNewRoom(e.target.value)}
                          placeholder="Nama poli baru"
                          className="px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-400 flex-1 sm:w-44"
                        />
                        <button
                          onClick={() => { if (newRoom.trim()) { addRoom(newRoom.trim()); setNewRoom(''); } }}
                          className="inline-flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-medium px-3 py-2 rounded-lg transition shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah
                        </button>
                      </div>
                    </div>
                    <div className="md:hidden divide-y divide-slate-100">
                      {state.rooms.map((r) => (
                        <div key={r.id} className="px-4 py-3 flex items-center gap-2">
                          <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                            {r.name}
                          </span>
                          <button onClick={() => removePoli(r.id, r.name)} aria-label="Hapus poli" className="text-rose-500 hover:text-rose-700 active:text-rose-800 p-1.5 shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3 font-semibold">Nama Poli</th>
                          <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {state.rooms.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-700">
                              {r.name}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => removePoli(r.id, r.name)} aria-label="Hapus poli" className="text-rose-500 hover:text-rose-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  </div>
                )}

                {svcTab === 'pelayanan' && <ServiceCrud />}

                {svcTab === 'paket' && <PackageCrud />}

                {svcTab === 'diskon' && <DiscountCrud />}
              </div>
            )}

            {/* Jadwal */}
            {sysTab === 'jadwal' && <ScheduleCrud />}

            {/* Pegawai */}
            {sysTab === 'pegawai' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 md:px-5 py-4 border-b border-slate-100 space-y-2">
                  <h2 className="font-bold text-slate-800 text-sm">Pegawai</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                    <input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Nama pegawai" className="px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-400 w-full" />
                    <select
                      value={staffRoleValue}
                      onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                      disabled={loadingStaffRoles && staffRoles.length === 0}
                      className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">
                        {loadingStaffRoles && staffRoles.length === 0 ? 'Memuat...' : '— Peran —'}
                      </option>
                      {staffRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button
                      onClick={() => { if (newStaff.name.trim() && staffRoleValue) { addStaff({ ...newStaff, name: newStaff.name.trim(), role: staffRoleValue as never, active: true }); setNewStaff({ name: '', role: staffRoles[0]?.value ?? '', room: 'Poli Gigi & Mulut' }); } }}
                      className="inline-flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>
                <div className="md:hidden divide-y divide-slate-100">
                  {state.staff.map((st) => (
                    <div key={st.id} className="px-4 py-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">{st.name}</div>
                          {st.sip && <div className="text-[11px] text-slate-400 truncate">{st.sip}</div>}
                        </div>
                        <button onClick={() => toggleStaffActive(st.id)} className="text-[11px] font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-slate-200 px-2.5 py-2 rounded-lg transition shrink-0">
                          {st.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">{st.role}</span>
                        <span className="text-[11px] text-slate-400 truncate">{st.room}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {st.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-semibold">Nama</th>
                      <th className="px-4 py-3 font-semibold">Peran</th>
                      <th className="px-4 py-3 font-semibold">Poli</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {state.staff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{s.name}</div>
                          {s.sip && <div className="text-[11px] text-slate-400">{s.sip}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">{s.role}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{s.room}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {s.active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => toggleStaffActive(s.id)} className="text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition">
                            {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            )}

            {/* FasKes */}
            {sysTab === 'faskes' && <FaskesInfo />}

            {/* Akun */}
            {sysTab === 'akun' && <StaffAccounts />}
          </div>
        )}

        {/* ==================== PENGATURAN EKSTERNAL ==================== */}
        {mainTab === 'eksternal' && (
          <div className="space-y-4">
            <div className="flex sm:grid sm:grid-cols-2 gap-2 w-full overflow-x-auto sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                ['bpjs', 'BPJS Kesehatan'],
                ['fonnte', 'Fonnte'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setExtTab(key)} className={subTabCls(extTab === key)}>
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {extTab === 'bpjs' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4">
                <h2 className="font-bold text-slate-800 text-sm">BPJS Kesehatan (PCare / iCare / Mobile JKN)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Username PCare</label>
                    <input placeholder="cth. dokterpintar" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Password PCare</label>
                    <input type="password" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Kode Fasyankes (Kode PPK)</label>
                    <input placeholder="cth. 11000030001" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Fasyankes</label>
                    <input placeholder="cth. FASKES GIGI PERMATA" className={inputCls} />
                  </div>
                </div>
                <button onClick={flash} className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 sm:py-2 rounded-lg shadow-sm transition w-full sm:w-auto">
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Tersimpan!' : 'Simpan Kredensial'}
                </button>
              </div>
            )}

            {extTab === 'fonnte' && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4">
                <h2 className="font-bold text-slate-800 text-sm">Fonnte (Notifikasi WhatsApp)</h2>
                <p className="text-xs text-slate-500">
                  Hubungkan Fonnte untuk mengirim notifikasi pemesanan, reminder kunjungan, dan ucapan ulang tahun
                  pasien via WhatsApp.
                </p>
                <div>
                  <label className={labelCls}>Fonnte Device Token</label>
                  <input type="password" placeholder="Token perangkat Fonnte" className={inputCls} />
                </div>
                <button onClick={flash} className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 sm:py-2 rounded-lg shadow-sm transition w-full sm:w-auto">
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Tersimpan!' : 'Hubungkan Fonnte'}
                </button>
              </div>
            )}
          </div>
        )}
        {dialog}
      </main>
    </>
  );
}
