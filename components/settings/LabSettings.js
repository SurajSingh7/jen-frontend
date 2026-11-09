"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import { ErrorBox, Field, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

const TEXT_FIELDS = [
  ["labNameLatin", "Lab name (English)"],
  ["labNameLocal", "Lab name (Hindi)"],
  ["regNo", "Reg. No."],
  ["phone", "Phone"],
  ["address", "Address"],
  ["doctorName", "Doctor name"],
  ["doctorDegree", "Doctor degree"],
  ["technicianName", "Technician name"],
  ["technicianDegree", "Technician degree"],
  ["footerNote", "Footer line"],
  ["labTime", "Lab time"],
];

function SettingsForm({ initial, section }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm({ ...form, [key]: value });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api("/settings", { method: "PATCH", body: form });
      setForm(data.settings);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const number = (key, label) => (
    <Field label={label} id={key}>
      <input id={key} className="input" type="number" value={form[key]} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );
  const radio = (key, value, label) => (
    <label className="flex min-h-9 items-center gap-2 text-sm text-slate-700">
      <input type="radio" name={key} className="size-4 accent-brand-600" checked={form[key] === value} onChange={() => set(key, value)} /> {label}
    </label>
  );

  return (
    <form className="space-y-4" onSubmit={save}>
      {section === "discount" && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-4 sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">Self entries</h2>
            <p className="mt-0.5 text-sm text-slate-500">Choose what the discount % is calculated on.</p>
            <div className="mt-2">
              {radio("discountBase", "basic", "Basic amount")}
              {radio("discountBase", "basic_extra", "Basic + Extra charge")}
            </div>
          </section>
          <section className="card p-4 sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">Doctor entries</h2>
            <p className="mt-0.5 text-sm text-slate-500">Choose what the doctor commission % is calculated on.</p>
            <div className="mt-2">
              {radio("commissionBase", "basic", "Basic amount")}
              {radio("commissionBase", "basic_extra", "Basic + Extra charge")}
            </div>
          </section>
        </div>
      )}

      {section === "lab" && (
        <>
          <section className="card p-4 sm:p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Letterhead details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEXT_FIELDS.map(([key, label]) => (
                <Field key={key} label={label} id={key} className={key === "address" ? "sm:col-span-2" : ""}>
                  <input id={key} className="input" maxLength={200} value={form[key]} onChange={(e) => set(key, e.target.value)} />
                </Field>
              ))}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Lab No and PDF spacing</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {number("startLabNo", "Starting Lab No")}
              {number("topSpaceMm", "Letterhead top (mm)")}
              {number("bottomSpaceMm", "Letterhead bottom (mm)")}
            </div>
          </section>
        </>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function LabSettings({ section }) {
  const { data, error, loading } = useLoad(() => api("/settings").then((d) => d.settings), section);
  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  return <SettingsForm initial={data} section={section} />;
}
