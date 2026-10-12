'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useClinicStore } from '@/lib/ClinicStore';
import { useShell } from '@/components/layout/AppShell';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { FormModal } from '@/components/ui/form-modal';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
const labelCls = 'text-xs font-medium text-slate-600 block mb-1';
const emptyForm = { code: '', name: '', room: '', price: 0 };

/**
 * CRUD master Pelayanan — satu-satunya sumber dropdown "Tindakan (Master)"
 * di rekam medis (baca state.services yang sama), jadi perubahan di sini
 * langsung terhubung ke rekam medis.
 */
export function ServiceCrud() {
  const { state, addService, updateService, removeService } = useClinicStore();
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
    const s = state.services.find((x) => x.id === id);
    if (!s) return;
    setForm({ code: s.code, name: s.name, room: s.room, price: s.price });
    setEditingId(id);
    setModalOpen(true);
  };
  const cancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(false);
  };

  const submit = async () => {
    if (!form.code.trim()) return toast('Kode pelayanan wajib diisi.');
    if (!form.name.trim()) return toast('Nama pelayanan wajib diisi.');
    if (!form.room) return toast('Poli wajib dipilih.');
    if (!(form.price >= 0)) return toast('Tarif tidak valid.');
    setSaving(true);
    try {
      if (editingId) {
        await updateService({ id: editingId, ...form, code: form.code.trim(), name: form.name.trim() });
        toast('Pelayanan diperbarui.');
      } else {
        if (state.services.some((x) => x.code === form.code.trim())) {
          toast('Kode pelayanan sudah dipakai.');
          return;
        }
        await addService({ ...form, code: form.code.trim(), name: form.name.trim() });
        toast('Pelayanan ditambahkan.');
      }
      cancel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan pelayanan.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Hapus pelayanan?',
      message: `"${name}" akan dihapus dari master. Data rekam medis lama tidak berubah (tersimpan sebagai salinan).`,
    });
    if (!ok) return;
    try {
      await removeService(id);
      if (editingId === id) cancel();
      toast('Pelayanan dihapus.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus pelayanan.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">Daftar Pelayanan ({state.services.length})</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Dipakai di dropdown Tindakan (Master) rekam medis.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {state.services.map((sv) => (
          <div key={sv.id} className="px-4 py-3.5 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-800 truncate">{sv.name}</div>
              <span className="text-sm font-bold text-slate-800 shrink-0">Rp {sv.price.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400 truncate">
                <span className="font-mono">{sv.code}</span> · {sv.room}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(sv.id)} aria-label="Ubah pelayanan" className="text-teal-600 hover:text-teal-800 p-1.5">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(sv.id, sv.name)} aria-label="Hapus pelayanan" className="text-rose-500 hover:text-rose-700 p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {state.services.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-slate-400">Belum ada pelayanan.</p>
        )}
      </div>
      <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-semibold">Kode</th>
            <th className="px-4 py-3 font-semibold">Nama Pelayanan</th>
            <th className="px-4 py-3 font-semibold">Poli</th>
            <th className="px-4 py-3 font-semibold text-right">Tarif</th>
            <th className="px-4 py-3 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {state.services.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.code}</td>
              <td className="px-4 py-3 text-slate-700">{s.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.room}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-800">Rp {s.price.toLocaleString('id-ID')}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button onClick={() => startEdit(s.id)} aria-label="Ubah pelayanan" className="text-teal-600 hover:text-teal-800 p-1">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(s.id, s.name)} aria-label="Hapus pelayanan" className="text-rose-500 hover:text-rose-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {state.services.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">Belum ada pelayanan.</td></tr>
          )}
        </tbody>
      </table></div>
      {dialog}
      <FormModal
        open={modalOpen}
        title={editingId ? 'Ubah Pelayanan' : 'Tambah Pelayanan'}
        submitLabel={editingId ? 'Simpan' : 'Tambah'}
        saving={saving}
        onClose={cancel}
        onSubmit={submit}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className={labelCls}>Kode *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PK0053" maxLength={20} className={`${inputCls} font-mono`} />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Tarif (Rp) *</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Math.max(0, Number(e.target.value.replace(/[^0-9]/g, '') || 0)) })}
              inputMode="numeric"
              autoComplete="off"
              className={inputCls}
            />
          </div>
          <div className="col-span-2 min-w-0">
            <label className={labelCls}>Nama Pelayanan *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth. Penambalan" maxLength={80} className={inputCls} />
          </div>
          <div className="col-span-2 min-w-0">
            <label className={labelCls}>Poli *</label>
            <select value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className={inputCls}>
              <option value="">— Pilih —</option>
              {state.rooms.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
