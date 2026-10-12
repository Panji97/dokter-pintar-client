'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useClinicStore } from '@/lib/ClinicStore';
import { useShell } from '@/components/layout/AppShell';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { FormModal } from '@/components/ui/form-modal';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
const labelCls = 'text-xs font-medium text-slate-600 block mb-1';
const emptyForm = { name: '', totalSessions: 1, price: 0 };

/** CRUD master Paket Pelayanan (nama, jumlah sesi, harga). */
export function PackageCrud() {
  const { state, addPackage, updatePackage, removePackage } = useClinicStore();
  const { toast } = useShell();
  const { confirm, dialog } = useConfirmDialog();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };
  const startEdit = (id: string) => {
    const p = state.packages.find((x) => x.id === id);
    if (!p) return;
    setForm({ name: p.name, totalSessions: p.totalSessions, price: p.price });
    setEditingId(id);
    setModalOpen(true);
  };
  const cancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(false);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast('Nama paket wajib diisi.');
    if (!(form.totalSessions >= 1)) return toast('Jumlah sesi minimal 1.');
    if (!(form.price >= 0)) return toast('Harga tidak valid.');
    setSaving(true);
    try {
      if (editingId) {
        await updatePackage({ id: editingId, patientName: '', usedSessions: 0, ...form, name: form.name.trim() });
        toast('Paket diperbarui.');
      } else {
        await addPackage({ patientName: '', usedSessions: 0, ...form, name: form.name.trim() });
        toast('Paket ditambahkan.');
      }
      cancel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan paket.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirm({ title: 'Hapus paket?', message: `"${name}" akan dihapus dari master.` });
    if (!ok) return;
    try {
      await removePackage(id);
      if (editingId === id) cancel();
      toast('Paket dihapus.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus paket.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <h2 className="font-bold text-slate-800 text-sm">Daftar Paket ({state.packages.length})</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {state.packages.map((pk) => (
          <div key={pk.id} className="px-4 py-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-800 truncate">{pk.name}</div>
              <span className="text-sm font-bold text-slate-800 shrink-0">Rp {pk.price.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400 truncate">{pk.usedSessions}/{pk.totalSessions} sesi{pk.patientName ? ` · ${pk.patientName}` : ''}</div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(pk.id)} aria-label="Ubah paket" className="text-teal-600 hover:text-teal-800 p-1.5">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(pk.id, pk.name)} aria-label="Hapus paket" className="text-rose-500 hover:text-rose-700 p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {state.packages.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-400">Belum ada paket.</p>
        )}
      </div>
      <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-semibold">Paket</th>
            <th className="px-4 py-3 font-semibold">Sesi</th>
            <th className="px-4 py-3 font-semibold text-right">Harga</th>
            <th className="px-4 py-3 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {state.packages.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{p.usedSessions}/{p.totalSessions}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-800">Rp {p.price.toLocaleString('id-ID')}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button onClick={() => startEdit(p.id)} aria-label="Ubah paket" className="text-teal-600 hover:text-teal-800 p-1">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(p.id, p.name)} aria-label="Hapus paket" className="text-rose-500 hover:text-rose-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {state.packages.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">Belum ada paket.</td></tr>
          )}
        </tbody>
      </table></div>
      {dialog}
      <FormModal
        open={modalOpen}
        title={editingId ? 'Ubah Paket Pelayanan' : 'Tambah Paket Pelayanan'}
        submitLabel={editingId ? 'Simpan' : 'Tambah'}
        saving={saving}
        onClose={cancel}
        onSubmit={submit}
      >
        <div>
          <label className={labelCls}>Nama Paket *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth. Scaling + Bleaching" maxLength={80} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className={labelCls}>Jml Sesi *</label>
            <input
              value={form.totalSessions}
              onChange={(e) => setForm({ ...form, totalSessions: Math.max(1, Math.min(999, Number(e.target.value.replace(/[^0-9]/g, '') || 1))) })}
              inputMode="numeric"
              autoComplete="off"
              className={inputCls}
            />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Harga (Rp) *</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Math.max(0, Number(e.target.value.replace(/[^0-9]/g, '') || 0)) })}
              inputMode="numeric"
              autoComplete="off"
              className={inputCls}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
