"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import DoctorModal from "./DoctorModal";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/Icons";
import { ConfirmModal, ErrorBox, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

export default function DoctorsView() {
  const { data: doctors, error, loading, reload } = useLoad(() => api("/doctors").then((d) => d.doctors), "doctors");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // {} = new, a doctor = edit
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const q = search.trim().toLowerCase();
  const shown = (doctors ?? []).filter((d) => !q || `${d.name} ${d.phone} ${d.clinic}`.toLowerCase().includes(q));

  async function remove() {
    setBusy(true);
    try {
      const data = await api(`/doctors/${removing._id}`, { method: "DELETE" });
      toast.success(data.deactivated ? `${removing.name} has old entries, so the doctor was marked Inactive.` : "Doctor deleted");
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold tracking-tight text-slate-900">Doctors</h1><p className="mt-0.5 text-sm text-slate-500">Manage referring doctors and their commission.</p></div>
        <button type="button" className="btn-primary" onClick={() => setEditing({})}>
          <PlusIcon size={17} /> Add Doctor
        </button>
      </div>

      <input className="input mt-4" type="search" aria-label="Doctor search" placeholder="Search name, phone or clinic" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="mt-3 space-y-3">
        <ErrorBox>{error}</ErrorBox>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="card mt-3 divide-y divide-slate-100">
          {shown.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No doctors found.</p>}
          {shown.map((d) => (
            <div key={d._id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {d.name} {!d.active && <span className="badge ml-1 bg-slate-100 text-slate-600">Inactive</span>}
                </p>
                <p className="truncate text-[13px] text-slate-500">{[d.phone, d.clinic].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <span className="badge bg-brand-100 text-brand-800">{d.commissionPercent}%</span>
              <button type="button" className="btn-icon" aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)}>
                <EditIcon size={17} />
              </button>
              <button type="button" className="btn-icon hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${d.name}`} onClick={() => setRemoving(d)}>
                <TrashIcon size={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <DoctorModal
          doctor={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {removing && <ConfirmModal title={`Delete ${removing.name}?`} busy={busy} onConfirm={remove} onClose={() => setRemoving(null)} />}
    </>
  );
}
