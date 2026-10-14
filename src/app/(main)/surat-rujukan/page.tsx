"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useClinicStore, fmtDate } from "@/lib/ClinicStore";
import { useOptionGroup } from "@/lib/useOptions";
import { PrintPreview } from "@/components/print/PrintPreview";
import { SuratDoc, RujukanDoc, useFaskesKop } from "@/components/print/documents";
import { PatientDropdown, DoctorDropdown } from "@/components/ui/entity-dropdowns";
import type { Letter, Referral } from "@/types/clinic";
import { FileText, FileOutput } from "lucide-react";

export default function SuratRujukanPage() {
  const { state, addLetter, addReferral, ensureModule } = useClinicStore();
  const [tab, setTab] = useState<"surat" | "rujukan">("surat");
  // Jenis surat/rujukan — wajib dari API (ms-options), tidak boleh hardcode.
  const { items: letterKinds, isLoading: loadingLetterKinds } = useOptionGroup("letter-kind");
  const { items: referralKinds, isLoading: loadingReferralKinds } = useOptionGroup("referral-kind");
  const kinds = tab === "surat" ? letterKinds : referralKinds;
  const loadingKinds = tab === "surat" ? loadingLetterKinds : loadingReferralKinds;
  const [kind, setKind] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  // Preview cetak (modal di tab yang sama — tanpa tab baru).
  const [printLetter, setPrintLetter] = useState<Letter | null>(null);
  const [printReferral, setPrintReferral] = useState<Referral | null>(null);
  const faskes = useFaskesKop();

  // form fields umum
  const [patientId, setPatientId] = useState("");
  const [doctor, setDoctor] = useState(state.staff[0]?.name ?? "");
  const [notes, setNotes] = useState("");
  const [destination, setDestination] = useState("");

  useEffect(() => {
    ensureModule("surat");
  }, [ensureModule]);

  const patient = state.patients.find((p) => p.id === patientId);

  const openForm = (k: string) => {
    setKind(k);
    setShowForm(true);
  };

  const submit = () => {
    if (!patient || !kind) return;
    // doctor diinisialisasi sebelum daftar staf dimuat → fallback ke dokter pertama.
    const doctorName =
      doctor || state.staff.filter((s) => s.role.startsWith("Dokter"))[0]?.name || "";
    if (tab === "surat") {
      addLetter({
        kind: kind as never,
        patientName: patient.name,
        patientId: patient.id,
        doctor: doctorName,
        date: new Date().toISOString().slice(0, 10),
        notes,
      });
    } else {
      addReferral({
        kind: kind as never,
        patientName: patient.name,
        patientId: patient.id,
        doctor: doctorName,
        destination: destination || "—",
        diagnosis: notes,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    setShowForm(false);
    setPatientId("");
    setNotes("");
    setDestination("");
    setKind("");
  };

  const inputCls =
    "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-teal-400";
  const labelCls = "text-xs font-medium text-slate-600 block mb-1";

  return (
    <>
      <Topbar
        title="Surat & Rujukan"
        subtitle="Pembuatan surat keterangan dan surat rujukan pasien"
      />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-full">
          {(
            [
              ["surat", "Surat"],
              ["rujukan", "Rujukan"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setKind("");
              }}
              className={`px-5 py-2.5 rounded-lg transition text-center w-full ${tab === key ? "bg-teal-600 text-white shadow-md ring-1 ring-teal-600 font-semibold" : "text-slate-500 hover:text-slate-800 hover:bg-white/70"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 w-full">
          <label className={labelCls}>
            {tab === "surat" ? "Pilih Surat" : "Pilih Rujukan"}
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              value={kind}
              onChange={(e) => e.target.value && openForm(e.target.value)}
              className={inputCls}
              disabled={loadingKinds && kinds.length === 0}
            >
              <option value="">
                {loadingKinds && kinds.length === 0
                  ? "Memuat..."
                  : `Pilih Jenis ${tab === "surat" ? "Surat" : "Rujukan"}`}
              </option>
              {kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Daftar surat */}
        {tab === "surat" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">
                Daftar Surat
              </h2>
            </div>
            {/* Mobile: kartu surat */}
            <div className="md:hidden divide-y divide-slate-100">
              {state.letters.map((l) => (
                <div key={l.id} className="px-4 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                      <FileText className="w-3 h-3" /> {l.kind}
                    </span>
                    <button
                      onClick={() => setPrintLetter(l)}
                      className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 active:bg-teal-100 px-2.5 py-2 rounded-lg transition shrink-0"
                    >
                      Cetak
                    </button>
                  </div>
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {l.patientName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {l.doctor} · {fmtDate(l.date)}
                  </div>
                </div>
              ))}
              {state.letters.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-slate-400">
                  Belum ada surat dibuat.
                </p>
              )}
            </div>
            {/* Desktop: datatable */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Jenis</th>
                    <th className="px-4 py-3 font-semibold">Pasien</th>
                    <th className="px-4 py-3 font-semibold">Dokter</th>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.letters.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                          <FileText className="w-3 h-3" /> {l.kind}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {l.patientName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {l.doctor}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {fmtDate(l.date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setPrintLetter(l)}
                          className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-md transition"
                        >
                          Cetak
                        </button>
                      </td>
                    </tr>
                  ))}
                  {state.letters.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-xs text-slate-400"
                      >
                        Belum ada surat dibuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Daftar rujukan */}
        {tab === "rujukan" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">
                Daftar Rujukan
              </h2>
            </div>
            {/* Mobile: kartu rujukan */}
            <div className="md:hidden divide-y divide-slate-100">
              {state.referrals.map((r) => (
                <div key={r.id} className="px-4 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      <FileOutput className="w-3 h-3" />{" "}
                      {r.kind === "Rujukan Internal"
                        ? "Internal"
                        : "Faskes Lain"}
                    </span>
                    <button
                      onClick={() => setPrintReferral(r)}
                      className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-100 px-2.5 py-2 rounded-lg transition shrink-0"
                    >
                      Cetak
                    </button>
                  </div>
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {r.patientName}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    → {r.destination}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {r.diagnosis} · {fmtDate(r.date)}
                  </div>
                </div>
              ))}
              {state.referrals.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-slate-400">
                  Belum ada rujukan dibuat.
                </p>
              )}
            </div>
            {/* Desktop: datatable */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Jenis</th>
                    <th className="px-4 py-3 font-semibold">Pasien</th>
                    <th className="px-4 py-3 font-semibold">Tujuan</th>
                    <th className="px-4 py-3 font-semibold">Diagnosa</th>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          <FileOutput className="w-3 h-3" /> {r.kind}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {r.patientName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.destination}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {r.diagnosis}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {fmtDate(r.date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setPrintReferral(r)}
                          className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition"
                        >
                          Cetak
                        </button>
                      </td>
                    </tr>
                  ))}
                  {state.referrals.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-xs text-slate-400"
                      >
                        Belum ada rujukan dibuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Buat {kind}</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className={labelCls}>Pasien *</label>
                <PatientDropdown
                  value={patientId}
                  onChange={(v) => setPatientId(v)}
                />
              </div>
              <div>
                <label className={labelCls}>Dokter</label>
                <DoctorDropdown
                  value={doctor}
                  onChange={(v) => setDoctor(v)}
                />
              </div>
              {tab === "rujukan" && (
                <div>
                  <label className={labelCls}>Fasilitas Tujuan</label>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="cth. RSUD Pasar Minggu"
                    className={inputCls}
                  />
                </div>
              )}
              <div>
                <label className={labelCls}>
                  {tab === "surat" ? "Keterangan" : "Diagnosa / Alasan Rujukan"}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputCls}
                />
              </div>
              {patient && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500">
                  {kind} akan diterbitkan untuk{" "}
                  <b className="text-slate-700">{patient.name}</b> oleh {doctor}
                  .
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={submit}
                disabled={!patient}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition disabled:opacity-40"
              >
                Terbitkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview cetak surat & rujukan — modal di tab yang sama */}
      <PrintPreview
        open={printLetter !== null}
        title={`Preview ${printLetter?.kind ?? 'Surat'}`}
        docNo={printLetter ? `${printLetter.patientName} · ${fmtDate(printLetter.date)}` : undefined}
        onClose={() => setPrintLetter(null)}
      >
        {printLetter && (
          <SuratDoc
            letter={printLetter}
            patient={printLetter.patientId ? state.patients.find((p) => p.id === printLetter.patientId) : undefined}
            faskes={faskes}
          />
        )}
      </PrintPreview>
      <PrintPreview
        open={printReferral !== null}
        title={`Preview ${printReferral?.kind ?? 'Rujukan'}`}
        docNo={printReferral ? `${printReferral.patientName} → ${printReferral.destination}` : undefined}
        onClose={() => setPrintReferral(null)}
      >
        {printReferral && (
          <RujukanDoc
            referral={printReferral}
            patient={printReferral.patientId ? state.patients.find((p) => p.id === printReferral.patientId) : undefined}
            faskes={faskes}
          />
        )}
      </PrintPreview>
    </>
  );
}
