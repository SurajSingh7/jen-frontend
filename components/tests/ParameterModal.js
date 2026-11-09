"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Field } from "@/components/Ui";

const WHO = [
  ["All", "All patients"],
  ["Male", "Male"],
  ["Female", "Female"],
  ["Child", "Child (under 12 years)"],
];

export default function ParameterModal({ parameter, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", unit: "", defaultValue: "", type: "value", bold: false, ...parameter });
  const [ranges, setRanges] = useState(() =>
    WHO.map(([who]) => {
      const r = parameter?.ranges?.find((x) => x.who === who);
      return { who, min: r?.min ?? "", max: r?.max ?? "", text: r?.text ?? "" };
    })
  );
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setRange = (who, key, value) => setRanges(ranges.map((r) => (r.who === who ? { ...r, [key]: value } : r)));

  function submit(e) {
    e.preventDefault();
    e.stopPropagation();
    onSave({ ...form, ranges: form.type === "heading" ? [] : ranges.filter((r) => r.min !== "" || r.max !== "" || r.text) });
  }

  return (
    <Modal title={parameter ? "Edit Parameter" : "Add Parameter"} onClose={onClose} width="sm:max-w-3xl">
      <form className="max-h-[75vh] space-y-3 overflow-y-auto pr-1" onSubmit={submit}>
        <Field label="Parameter name" id="param-name" required>
          <input id="param-name" className="input" autoFocus required maxLength={100} value={form.name} onChange={set("name")} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Type" id="param-type">
            <select id="param-type" className="input" value={form.type} onChange={set("type")}>
              <option value="value">Value</option>
              <option value="heading">Heading</option>
            </select>
          </Field>
          <Field label="Unit" id="param-unit">
            <input id="param-unit" className="input" maxLength={30} disabled={form.type === "heading"} value={form.unit} onChange={set("unit")} />
          </Field>
        </div>
        {form.type === "value" && (
          <>
            <Field label="Default value" id="param-default">
              <input id="param-default" className="input" placeholder="e.g. NEGATIVE" maxLength={100} value={form.defaultValue} onChange={set("defaultValue")} />
            </Field>
            <div>
              <p className="label">Normal range</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {WHO.map(([who, label]) => {
                  const r = ranges.find((x) => x.who === who);
                  return (
                    <div key={who} className="rounded-xl bg-brand-50 p-2.5">
                      <p className="mb-1.5 text-[13px] font-medium text-slate-700">{label}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <input className="input" aria-label={`${label} min`} placeholder="Min" type="number" step="any" value={r.min} onChange={(e) => setRange(who, "min", e.target.value)} />
                        <input className="input" aria-label={`${label} max`} placeholder="Max" type="number" step="any" value={r.max} onChange={(e) => setRange(who, "max", e.target.value)} />
                        <input className="input" aria-label={`${label} text`} placeholder="Text" maxLength={80} value={r.text} onChange={(e) => setRange(who, "text", e.target.value)} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">If Text is empty, the report shows Min-Max.</p>
            </div>
          </>
        )}
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="size-4 accent-brand-600" checked={form.bold} onChange={(e) => setForm({ ...form, bold: e.target.checked })} /> Bold
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            OK
          </button>
        </div>
      </form>
    </Modal>
  );
}
