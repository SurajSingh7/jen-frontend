"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import Modal from "@/components/Modal";
import { Field } from "@/components/Ui";
import { api } from "@/lib/api";
import { rupees, today } from "@/lib/format";

// Records money given to a doctor; never more than what is still due
export default function PayModal({ doctor, onClose, onDone }) {
  const [form, setForm] = useState({ date: today(), amount: doctor.balance, mode: "Cash", note: "" });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return toast.error("Enter a valid amount");
    if (amount > doctor.balance) return toast.error(`Amount cannot be more than ${rupees(doctor.balance)}`);
    setBusy(true);
    try {
      await api(`/accounts/doctors/${doctor._id}/payments`, { method: "POST", body: form });
      toast.success("Payment saved");
      onDone();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Pay Commission · ${doctor.name}`} width="sm:max-w-md" onClose={onClose}>
      <form className="space-y-3" onSubmit={save}>
        <p className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
          Commission balance <span className="text-base font-bold text-red-600 tabular-nums">{rupees(doctor.balance)}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" id="payDate" required>
            <input id="payDate" className="input" type="date" required value={form.date} onChange={set("date")} />
          </Field>
          <Field label="Amount" id="payAmount" required>
            <input id="payAmount" className="input" type="number" min="0" step="any" required autoFocus value={form.amount} onChange={set("amount")} />
          </Field>
        </div>
        <Field label="Mode" id="payMode" required>
          <select id="payMode" className="input" value={form.mode} onChange={set("mode")}>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank</option>
          </select>
        </Field>
        <Field label="Note" id="payNote">
          <input id="payNote" className="input" maxLength={200} value={form.note} onChange={set("note")} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}
