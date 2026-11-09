"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import Modal from "@/components/Modal";
import { Field } from "@/components/Ui";
import { api } from "@/lib/api";

export default function DoctorModal({ doctor, onClose, onSaved }) {
  const [form, setForm] = useState({ name: doctor?.name ?? "", phone: doctor?.phone ?? "", clinic: doctor?.clinic ?? "", commissionPercent: doctor?.commissionPercent ?? "", active: doctor?.active ?? true });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = doctor ? await api(`/doctors/${doctor._id}`, { method: "PATCH", body: form }) : await api("/doctors", { method: "POST", body: form });
      toast.success(doctor ? "Doctor updated" : "Doctor added");
      onSaved(data.doctor);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={doctor ? "Edit Doctor" : "Add Doctor"} onClose={onClose}>
      <form className="space-y-3" onSubmit={save}>
        <Field label="Name" id="doc-name" required>
          <input id="doc-name" className="input" autoFocus required maxLength={80} value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Phone" id="doc-phone">
          <input id="doc-phone" className="input" inputMode="tel" maxLength={20} value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Clinic" id="doc-clinic">
          <input id="doc-clinic" className="input" maxLength={120} value={form.clinic} onChange={set("clinic")} />
        </Field>
        <Field label="Commission %" id="doc-commission">
          <input id="doc-commission" className="input" type="number" min="0" max="100" step="0.01" value={form.commissionPercent} onChange={set("commissionPercent")} />
        </Field>
        {doctor && (
          <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="size-4 accent-brand-600" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
