'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useClinicStore } from '@/lib/ClinicStore';
import { useShell } from '@/components/layout/AppShell';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
const labelCls = 'text-xs font-medium text-slate-600 block mb-1';
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const emptyForm = { staffName: '', day: 'Senin', startTime: '08:00', endTime: '16:00', room: '' };

/** CRUD Jadwal pegawai (nama, hari, jam mulai–selesai, poli). */
export function ScheduleCrud() {
  const { state, addSchedule, updateSchedule, removeSchedule } = useClinicStore();
  const { toast } = useShell();
  const { confirm, dialog } = useConfirmDialog();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const staffOptions = state.staff.filter((s) => s.active).map((s) => s.name);
  const roomValue = form.room || state.rooms[0]?.name || '';

  const startEdit = (id: string) => {
    const s = state.schedules.find((x) => x.id === id);
    if (!s) return;
    setForm({ staffName: s.staffName, day: s.day, startTime: s.startTime, endTime: s.endTime, room: s.room });
    setEditingId(id);
  };
  const cancel = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.staffName) return toast('Pegawai wajib dipilih.');
    if (!form.day) return toast('Hari wajib dipilih.');
    if (!form.startTime || !form.endTime) return toast('Jam mulai & selesai wajib diisi.');
    if (form.endTime <= form.startTime) return toast('Jam selesai harus setelah jam mulai.');
    if (!roomValue) return toast('Poli wajib dipilih.');
    setSaving(true);
    try {
      const payload = { ...form, room: roomValue };
      if (editingId) {
        await updateSchedule({ id: editingId, ...payload });
        toast('Jadwal diperbarui.');
      } else {
        await addSchedule(payload);
        toast('Jadwal ditambahkan.');
      }
      cancel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan jadwal.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, label: string) => {
    const ok = await confirm({ title: 'Hapus jadwal?', message: `Jadwal "${label}" akan dihapus dari master.` });
    if (!ok) return;
    try {
      await removeSchedule(id);
      if (editingId === id) cancel();
      toast('Jadwal dihapus.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus jadwal.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-slate-100 space-y-3">
        <h2 className="font-bold text-slate-800 text-sm">{editingId ? 'Ubah Jadwal' : 'Tambah Jadwal'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-[1fr_8rem_7rem_7rem_10rem_auto] gap-2.5 items-end">
          <div className="col-span-2 md:col-span-1 min-w-0">
            <label className={labelCls}>Pegawai *</label>
            <select value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} className={inputCls}>
              <option value="">— Pilih —</option>
              {staffOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Hari *</label>
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className={inputCls}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Mulai *</label>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputCls} />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Selesai *</label>
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputCls} />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Poli *</label>
            <select value={roomValue} onChange={(e) => setForm({ ...form, room: e.target.value })} className={inputCls}>
              <option value="">— Pilih —</option>
              {state.rooms.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 flex gap-2">
            {editingId && (
              <button onClick={cancel} className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition">
                <X className="w-3.5 h-3.5" /> Batal
              </button>
            )}
            <button onClick={submit} disabled={saving} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-60">
              {editingId ? 'Simpan' : <><Plus className="w-3.5 h-3.5" /> Tambah</>}
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {state.schedules.map((sc) => (
          <div key={sc.id} className="px-4 py-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-800 truncate">{sc.staffName}</div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(sc.id)} aria-label="Ubah jadwal" className="text-teal-600 hover:text-teal-800 p-1.5">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(sc.id, `${sc.staffName} ${sc.day}`)} aria-label="Hapus jadwal" className="text-rose-500 hover:text-rose-700 p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 truncate">{sc.day} · {sc.startTime} – {sc.endTime}</div>
            <div className="text-[11px] text-slate-500 truncate">{sc.room}</div>
          </div>
        ))}
        {state.schedules.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-400">Belum ada jadwal.</p>
        )}
      </div>
      <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-semibold">Pegawai</th>
            <th className="px-4 py-3 font-semibold">Hari</th>
            <th className="px-4 py-3 font-semibold">Jam</th>
            <th className="px-4 py-3 font-semibold">Poli</th>
            <th className="px-4 py-3 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {state.schedules.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{s.staffName}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.day}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.startTime} – {s.endTime}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.room}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button onClick={() => startEdit(s.id)} aria-label="Ubah jadwal" className="text-teal-600 hover:text-teal-800 p-1">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(s.id, `${s.staffName} ${s.day}`)} aria-label="Hapus jadwal" className="text-rose-500 hover:text-rose-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {state.schedules.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">Belum ada jadwal.</td></tr>
          )}
        </tbody>
      </table></div>
      {dialog}
    </div>
  );
}
