'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useClinicStore } from '@/lib/ClinicStore';
import { useShell } from '@/components/layout/AppShell';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
const labelCls = 'text-xs font-medium text-slate-600 block mb-1';
const emptyForm = { name: '', percent: 0, appliesTo: '', active: true };

/** CRUD Diskon Pelayanan (nama, persen, berlaku untuk, aktif/nonaktif). */
export function DiscountCrud() {
  const { state, addDiscount, updateDiscount, toggleDiscountActive, removeDiscount } = useClinicStore();
  const { toast } = useShell();
  const { confirm, dialog } = useConfirmDialog();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (id: string) => {
    const d = state.discounts.find((x) => x.id === id);
    if (!d) return;
    setForm({ name: d.name, percent: d.percent, appliesTo: d.appliesTo, active: d.active });
    setEditingId(id);
  };
  const cancel = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast('Nama diskon wajib diisi.');
    if (!(form.percent >= 0 && form.percent <= 100)) return toast('Persen harus 0–100.');
    if (!form.appliesTo.trim()) return toast('Kolom "Berlaku untuk" wajib diisi.');
    setSaving(true);
    try {
      if (editingId) {
        await updateDiscount({ id: editingId, ...form, name: form.name.trim(), appliesTo: form.appliesTo.trim() });
        toast('Diskon diperbarui.');
      } else {
        await addDiscount({ ...form, name: form.name.trim(), appliesTo: form.appliesTo.trim() });
        toast('Diskon ditambahkan.');
      }
      cancel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan diskon.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string) => {
    try {
      await toggleDiscountActive(id);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal mengubah status diskon.');
    }
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirm({ title: 'Hapus diskon?', message: `"${name}" akan dihapus dari master.` });
    if (!ok) return;
    try {
      await removeDiscount(id);
      if (editingId === id) cancel();
      toast('Diskon dihapus.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus diskon.');
    }
  };

  const statusBadge = (active: boolean) => (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-slate-100 space-y-3">
        <h2 className="font-bold text-slate-800 text-sm">{editingId ? 'Ubah Diskon Pelayanan' : 'Tambah Diskon Pelayanan'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-[1fr_6rem_1fr_auto_auto] gap-2.5 items-end">
          <div className="col-span-2 md:col-span-1 min-w-0">
            <label className={labelCls}>Nama Diskon *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth. Member 10%" maxLength={60} className={inputCls} />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Persen (%) *</label>
            <input
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: Math.max(0, Math.min(100, Number(e.target.value.replace(/[^0-9]/g, '') || 0))) })}
              inputMode="numeric"
              autoComplete="off"
              className={inputCls}
            />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Berlaku Untuk *</label>
            <input value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })} placeholder="cth. Semua tindakan" maxLength={60} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 pb-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-teal-600" />
            Aktif
          </label>
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
        {state.discounts.map((dc) => (
          <div key={dc.id} className="px-4 py-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-800 truncate">{dc.name}</div>
              <div className="shrink-0">{statusBadge(dc.active)}</div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400 truncate">{dc.appliesTo} · {dc.percent}%</div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggle(dc.id)} aria-label="Aktif/nonaktif diskon" className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1.5 rounded-lg">
                  {dc.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button onClick={() => startEdit(dc.id)} aria-label="Ubah diskon" className="text-teal-600 hover:text-teal-800 p-1.5">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(dc.id, dc.name)} aria-label="Hapus diskon" className="text-rose-500 hover:text-rose-700 p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {state.discounts.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-400">Belum ada diskon.</p>
        )}
      </div>
      <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-semibold">Nama Diskon</th>
            <th className="px-4 py-3 font-semibold">Berlaku Untuk</th>
            <th className="px-4 py-3 font-semibold">Persen</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {state.discounts.map((d) => (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{d.appliesTo}</td>
              <td className="px-4 py-3 text-slate-700">{d.percent}%</td>
              <td className="px-4 py-3">
                <button onClick={() => toggle(d.id)} title="Aktif/nonaktif">
                  {statusBadge(d.active)}
                </button>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button onClick={() => startEdit(d.id)} aria-label="Ubah diskon" className="text-teal-600 hover:text-teal-800 p-1">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(d.id, d.name)} aria-label="Hapus diskon" className="text-rose-500 hover:text-rose-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {state.discounts.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">Belum ada diskon.</td></tr>
          )}
        </tbody>
      </table></div>
      {dialog}
    </div>
  );
}
