'use client';

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useFetch } from '@/lib/strapi';
import { getSession } from '@/lib/auth';
import { useClinicStore } from '@/lib/ClinicStore';
import { useShell } from '@/components/layout/AppShell';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400';
const labelCls = 'text-xs font-medium text-slate-600 block mb-1';

interface FaskesData {
  name?: string;
  address?: string;
  phone?: string;
}

/** Profil faskes milik user yang login — lihat & ubah (nama/alamat/telepon). */
export function FaskesInfo() {
  const session = typeof window !== 'undefined' ? getSession() : null;
  const docId = session?.faskes?.documentId;
  const { data, isLoading, mutate } = useFetch(docId ? `/api/faskes-list/${docId}` : (null as unknown as string));
  const { updateFaskesProfile } = useClinicStore();
  const { toast } = useShell();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);

  if (!docId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400 shadow-sm">
        Akun belum terikat ke faskes.
      </div>
    );
  }

  const f = (data as { data?: FaskesData } | undefined)?.data;

  const startEdit = () => {
    setForm({
      name: f?.name ?? session?.faskes?.name ?? '',
      address: f?.address ?? '',
      phone: f?.phone ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast('Nama faskes wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await updateFaskesProfile(docId, {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      });
      setEditing(false);
      await mutate();
      toast('Profil faskes diperbarui.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan profil faskes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-slate-800 text-sm">Profil Faskes</h2>
        {!editing && f && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
          >
            <Pencil className="w-3.5 h-3.5" /> Ubah
          </button>
        )}
      </div>

      {isLoading && !f ? (
        <p className="text-sm text-slate-400">Memuat…</p>
      ) : editing ? (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Nama Faskes *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Alamat</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} maxLength={300} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Telepon</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} autoComplete="off" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <X className="w-3.5 h-3.5" /> Batal
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Nama</span>
            <span className="font-medium text-slate-800 text-right">{f?.name ?? session?.faskes?.name ?? '-'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Alamat</span>
            <span className="font-medium text-slate-800 text-right">{f?.address || '-'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Telepon</span>
            <span className="font-medium text-slate-800 text-right">{f?.phone || '-'}</span>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Profil faskes dibuat saat pendaftaran dan tampil di dokumen faskes.
      </p>
    </div>
  );
}
