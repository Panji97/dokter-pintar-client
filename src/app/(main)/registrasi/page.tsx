"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useShell } from "@/components/layout/AppShell";
import { useClinicStore } from "@/lib/ClinicStore";
import { Search, ClipboardPlus, ChevronLeft, ChevronRight, X } from "lucide-react";

type Tab = "baru" | "lama";

/** Hitung umur (tahun/bulan/hari) dari tanggal lahir terhadap tanggal acuan. */
function calcAge(birthDate: string, refDate: string) {
  if (!birthDate || !refDate) return null;
  const b = new Date(birthDate);
  const r = new Date(refDate);
  if (Number.isNaN(b.getTime()) || Number.isNaN(r.getTime()) || b > r)
    return null;
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

/** Geser tanggal acuan mundur Y tahun, M bulan, D hari → string yyyy-mm-dd. */
function shiftDate(refDate: string, y: number, m: number, d: number) {
  const r = new Date(refDate);
  const dt = new Date(r.getFullYear(), r.getMonth(), r.getDate());
  dt.setFullYear(dt.getFullYear() - y);
  dt.setMonth(dt.getMonth() - m);
  dt.setDate(dt.getDate() - d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export default function RegistrasiPage() {
  const { state, loading, refresh, addPatient, addRegistration } = useClinicStore();
  const { queueOpen, setQueueOpen, setQueueSheetOpen, toast } = useShell();
  const [tab, setTab] = useState<Tab>("baru");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (state.rooms.length === 0 && !loading) {
      refresh();
    }
  }, [state.rooms.length, loading, refresh]);

  /** Tampilkan rightbar antrean agar data registrasi baru terlihat. */
  const showQueue = () => {
    if (!queueOpen) setQueueOpen(true);
    // Di mobile/tablet (<xl) rightbar tampil sebagai drawer — buka otomatis.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1279px)").matches
    ) {
      setQueueSheetOpen(true);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // form pasien baru
  const [form, setForm] = useState({
    title: "",
    name: "",
    gender: "",
    birthDate: "",
    regDate: todayStr,
    address: "",
    nik: "",
    group: "",
    room: "",
    serviceType: "",
    doctor: "",
  });
  const age = calcAge(form.birthDate, form.regDate || todayStr);

  /** Ubah salah satu kotak umur → Tgl. Lahir ikut bergeser (two-way binding). */
  const setUmurPart = (part: "y" | "m" | "d", raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return;
    const cur = age ?? { y: 0, m: 0, d: 0 };
    const next = { y: cur.y, m: cur.m, d: cur.d, [part]: n };
    setForm({
      ...form,
      birthDate: shiftDate(form.regDate || todayStr, next.y, next.m, next.d),
    });
  };

  const rooms = state.rooms.map((r) => r.name);
  const patientGroupOptions = useMemo(
    () => state.patientGroups.map((g) => g.name),
    [state.patientGroups],
  );
  // Daftar pilihan Pelayanan dari master tarif (Pengaturan → Pelayanan).
  const serviceOptions = useMemo(
    () => state.services.map((s) => s.name),
    [state.services],
  );
  const doctorOptions = useMemo(
    () =>
      state.staff.filter(
        (s) => s.role === "Dokter Gigi" || s.role === "Dokter Umum",
      ),
    [state.staff],
  );
  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase();
    return state.patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.nik.includes(search),
    );
  }, [state.patients, search]);

  // Pagination daftar pasien lama: 4 data per halaman
  const PAGE_SIZE = 4;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const pagedPatients = filteredPatients.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const rangeStart =
    filteredPatients.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredPatients.length);

  const [saving, setSaving] = useState(false);

  const submitNew = async () => {
    if (!form.name.trim()) {
      toast("Nama pasien wajib diisi.");
      return;
    }
    if (!form.gender) {
      toast("Jenis kelamin wajib dipilih.");
      return;
    }
    if (!form.group) {
      toast("Grup pasien wajib dipilih.");
      return;
    }
    if (!form.room) {
      toast("Poli wajib dipilih.");
      return;
    }
    if (!form.serviceType) {
      toast("Pelayanan wajib dipilih.");
      return;
    }
    if (!form.doctor) {
      toast("Dokter pemeriksa wajib dipilih.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const patient = await addPatient({
        name: form.name,
        title: form.title || undefined,
        nik: form.nik || "-",
        birthDate: form.birthDate || form.regDate,
        gender: form.gender as "L" | "P",
        phone: "",
        address: form.address,
        bloodType: "-",
        allergies: [],
      });
      await addRegistration({
        patientId: patient.id,
        patientName: patient.name,
        group: form.group as never,
        serviceType: form.serviceType,
        room: form.room,
        doctor: form.doctor,
        regDate: form.regDate
          ? new Date(`${form.regDate}T00:00:00`).toISOString()
          : undefined,
      });
      // Tetap di halaman registrasi — data tampil di rightbar antrean.
      toast(
        `${patient.name} berhasil diregistrasi ke ${form.room}. Data antrean tampil di panel kanan.`,
      );
      setForm((f) => ({
        ...f,
        title: "",
        name: "",
        gender: "",
        birthDate: "",
        address: "",
        nik: "",
      }));
      showQueue();
    } catch (err) {
      toast(`Gagal menyimpan: ${err instanceof Error ? err.message : 'periksa koneksi internet'}`);
    } finally {
      setSaving(false);
    }
  };

  // Modal registrasi cepat per pasien (tombol Registrasi di tiap baris)
  const [regModalPatientId, setRegModalPatientId] = useState<string | null>(
    null,
  );
  const [modalForm, setModalForm] = useState({
    group: "",
    room: "",
    serviceType: "",
    doctor: "",
  });
  const regModalPatient = regModalPatientId
    ? (state.patients.find((x) => x.id === regModalPatientId) ?? null)
    : null;

  const openRegModal = (patientId: string) => {
    setModalForm({
      group: "",
      room: "",
      serviceType: "",
      doctor: "",
    });
    setRegModalPatientId(patientId);
  };

  const submitModal = async () => {
    if (!regModalPatient) return;
    if (!modalForm.group) {
      toast("Grup pasien wajib dipilih.");
      return;
    }
    if (!modalForm.room) {
      toast("Poli wajib dipilih.");
      return;
    }
    if (!modalForm.serviceType) {
      toast("Pelayanan wajib dipilih.");
      return;
    }
    if (!modalForm.doctor) {
      toast("Dokter pemeriksa wajib dipilih.");
      return;
    }
    try {
      await addRegistration({
        patientId: regModalPatient.id,
        patientName: regModalPatient.name,
        group: modalForm.group as never,
        serviceType: modalForm.serviceType,
        room: modalForm.room,
        doctor: modalForm.doctor,
      });
      // Tetap di halaman registrasi — data tampil di rightbar antrean.
      toast(
        `${regModalPatient.name} berhasil diregistrasi ke ${modalForm.room}. Data antrean tampil di panel kanan.`,
      );
      setRegModalPatientId(null);
      showQueue();
    } catch (err) {
      toast(`Gagal menyimpan: ${err instanceof Error ? err.message : 'periksa koneksi internet'}`);
    }
  };

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!regModalPatientId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRegModalPatientId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [regModalPatientId]);

  const inputCls =
    "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400";
  const labelCls = "text-xs font-medium text-slate-600 block mb-1";

  return (
    <>
      <Topbar
        title="Registrasi"
        subtitle="Pendaftaran pasien baru dan kunjungan pasien lama"
      />
      <main className="flex-1 p-4 md:p-6">
        <div className="w-full space-y-5">
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-full">
            {(
              [
                ["baru", "Pasien Baru"],
                ["lama", "Pasien Lama"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-2.5 rounded-lg transition text-center w-full ${tab === key ? "bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold" : "text-slate-500 hover:text-slate-800 hover:bg-white/70"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "baru" ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full">
              <div className="px-6 py-4 border-b border-slate-100">
                <label className={labelCls}>Tgl. Registrasi</label>
                <input
                  type="date"
                  value={form.regDate}
                  max={todayStr}
                  onChange={(e) =>
                    setForm({ ...form, regDate: e.target.value })
                  }
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400 w-full"
                />
              </div>

              <div className="p-6 space-y-5">
                {/* Layanan FasKes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Layanan FasKes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        Grup Pasien <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.group}
                        onChange={(e) =>
                          setForm({ ...form, group: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="">
                          {loading && patientGroupOptions.length === 0
                            ? "Memuat Grup Pasien..."
                            : "Pilih Grup Pasien"}
                        </option>
                        {patientGroupOptions.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Poli <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.room}
                        onChange={(e) =>
                          setForm({ ...form, room: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="">
                          {loading && rooms.length === 0
                            ? "Memuat Poli..."
                            : "Pilih Poli"}
                        </option>
                        {rooms.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Pelayanan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.serviceType}
                        onChange={(e) =>
                          setForm({ ...form, serviceType: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="">
                          {loading && serviceOptions.length === 0
                            ? "Memuat Pelayanan..."
                            : "Pilih Pelayanan"}
                        </option>
                        {serviceOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Dokter Pemeriksa{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.doctor}
                        onChange={(e) =>
                          setForm({ ...form, doctor: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="">
                          {loading && doctorOptions.length === 0
                            ? "Memuat Dokter..."
                            : "Pilih Dokter"}
                        </option>
                        {doctorOptions.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Jadwal Dokter <span className="text-rose-500">*</span>
                      </label>
                      <select
                        disabled
                        className={`${inputCls} bg-slate-100 text-slate-400`}
                      >
                        <option>Pilih...</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Informasi Pribadi */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Informasi Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                      <label className={labelCls}>Title</label>
                      <select
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="">Pilih...</option>
                        <option>Tn.</option>
                        <option>Ny.</option>
                        <option>An.</option>
                        <option>By.</option>
                      </select>
                    </div>
                    <div className="md:col-span-6">
                      <label className={labelCls}>
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>
                        Jenis Kelamin <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) =>
                          setForm({ ...form, gender: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="">Pilih...</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className={labelCls}>
                        Tgl. Lahir
                      </label>
                      <input
                        type="date"
                        value={form.birthDate}
                        max={form.regDate || todayStr}
                        onChange={(e) =>
                          setForm({ ...form, birthDate: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Umur</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ["y", "Th"],
                            ["m", "Bln"],
                            ["d", "Hr"],
                          ] as const
                        ).map(([part, suffix]) => (
                          <div key={part} className="flex items-center gap-1">
                            <input
                              inputMode="numeric"
                              value={age ? age[part] : ""}
                              placeholder="0"
                              onChange={(e) =>
                                setUmurPart(part, e.target.value)
                              }
                              className={inputCls}
                            />
                            <span className="text-xs text-slate-500 shrink-0">
                              {suffix}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>
                        Alamat Lengkap
                      </label>
                      <input
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>NIK</label>
                      <input
                        value={form.nik}
                        onChange={(e) =>
                          setForm({ ...form, nik: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={submitNew}
                    disabled={saving}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-60"
                  >
                    {saving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">
                  Cari Data Pasien
                </h3>
              </div>
              <div className="px-4 md:px-6 py-4 flex gap-2 border-b border-slate-50">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Cari Nama Pasien atau No. KTP"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400"
                  />
                </div>
              </div>
              {/* Daftar pasien: kartu di semua view, NIK kolom sendiri di desktop */}
              <div className="hidden md:grid grid-cols-[1fr_220px_120px] gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <span className="pl-[52px]">Nama Pasien</span>
                <span>NIK</span>
                <span className="text-right">Aksi</span>
              </div>
              <div className="divide-y divide-slate-100">
                {pagedPatients.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="w-full text-left px-4 md:px-5 py-3.5 transition grid grid-cols-1 md:grid-cols-[1fr_220px_120px] md:items-center gap-2 md:gap-3 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-slate-100 text-slate-500">
                          {p.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 truncate">
                          {p.name}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2 md:contents">
                        <span className="font-mono text-[11px] text-slate-400 md:text-xs md:text-slate-500 md:truncate pl-[52px] md:pl-0 min-w-0 truncate">
                          <span className="md:hidden">NIK </span>
                          {p.nik}
                        </span>
                        <button
                          onClick={() => openRegModal(p.id)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-sm transition md:justify-self-end"
                        >
                          <ClipboardPlus className="w-3.5 h-3.5" />
                          Registrasi
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
              {filteredPatients.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Pasien tidak ditemukan.
                </div>
              )}
              {filteredPatients.length > 0 && (
                <div className="flex flex-col items-center gap-2.5 px-4 md:px-5 py-3.5 border-t border-slate-100 sm:flex-row sm:justify-between">
                  <span className="text-xs text-slate-400 text-center">
                    Menampilkan {rangeStart}–{rangeEnd} dari{" "}
                    {filteredPatients.length} pasien
                  </span>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setPage((v) => Math.max(1, v - 1))}
                      disabled={safePage === 1}
                      aria-label="Halaman sebelumnya"
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from(
                      { length: totalPages },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-medium transition ${
                          n === safePage
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-100 active:bg-slate-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPage((v) => Math.min(totalPages, v + 1))
                      }
                      disabled={safePage === totalPages}
                      aria-label="Halaman berikutnya"
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal registrasi cepat: Grup Pasien, Poli, Dokter Pemeriksa */}
      {regModalPatient && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Registrasi ${regModalPatient.name}`}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setRegModalPatientId(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800">
                  Registrasi Kunjungan
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {regModalPatient.name} · NIK {regModalPatient.nik}
                </p>
              </div>
              <button
                onClick={() => setRegModalPatientId(null)}
                aria-label="Tutup"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Grup Pasien</label>
                <select
                  value={modalForm.group}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, group: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">
                    {loading && patientGroupOptions.length === 0
                      ? "Memuat Grup Pasien..."
                      : "Pilih Grup Pasien"}
                  </option>
                  {patientGroupOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Poli</label>
                <select
                  value={modalForm.room}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, room: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">
                    {loading && rooms.length === 0
                      ? "Memuat Poli..."
                      : "Pilih Poli"}
                  </option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Pelayanan</label>
                <select
                  value={modalForm.serviceType}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, serviceType: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">
                    {loading && serviceOptions.length === 0
                      ? "Memuat Pelayanan..."
                      : "Pilih Pelayanan"}
                  </option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Dokter Pemeriksa</label>
                <select
                  value={modalForm.doctor}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, doctor: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">
                    {loading && doctorOptions.length === 0
                      ? "Memuat Dokter..."
                      : "Pilih Dokter"}
                  </option>
                  {doctorOptions.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setRegModalPatientId(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={submitModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
              >
                <ClipboardPlus className="w-4 h-4" />
                Registrasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
