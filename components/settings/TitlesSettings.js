"use client";

import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/Icons";
import { api } from "@/lib/api";

const GENDERS = [
  { value: "", label: "Manual (choose each time)" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const genderLabel = (gender) => gender || "Manual";

export default function TitlesSettings() {
  const [titles, setTitles] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // { id?, name, gender } while the add/edit popup is open
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api("/titles");
      setTitles(data.titles);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load from the server
    load();
  }, [load]);

  const closePopups = useCallback(() => {
    setForm(null);
    setRemoving(null);
  }, []);

  async function run(action, message) {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      await load();
      closePopups();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function save(e) {
    e.preventDefault();
    const body = { name: form.name, gender: form.gender };
    run(() => (form.id ? api(`/titles/${form.id}`, { method: "PATCH", body }) : api("/titles", { method: "POST", body })), "Saved");
  }

  async function addDefaults() {
    setBusy(true);
    try {
      const data = await api("/titles/defaults", { method: "POST" });
      setTitles(data.titles);
      toast.success("Titles added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Titles</h2>
          <p className="mt-0.5 text-sm text-slate-500">Selecting a title fills in the gender automatically.</p>
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setForm({ name: "", gender: "" })}>
          <PlusIcon size={17} /> Add
        </button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {titles === null && !error && <p className="mt-6 text-sm text-slate-500">Loading…</p>}

      {titles?.length === 0 && (
        <div className="mt-5 rounded-xl bg-brand-50 p-6 text-center">
          <p className="text-sm text-slate-600">No titles yet.</p>
          <button type="button" className="btn-secondary mt-3" disabled={busy} onClick={addDefaults}>
            Add Mr, Mrs, Miss, Master, Baby, Dr
          </button>
        </div>
      )}

      {titles?.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100">
          {titles.map((t) => (
            <li key={t._id} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{t.name}</span>
              <span className={`badge ${t.gender ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"}`}>{genderLabel(t.gender)}</span>
              <button type="button" className="btn-icon" aria-label={`Edit ${t.name}`} onClick={() => setForm({ id: t._id, name: t.name, gender: t.gender })}>
                <EditIcon size={17} />
              </button>
              <button type="button" className="btn-icon hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${t.name}`} onClick={() => setRemoving(t)}>
                <TrashIcon size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <Modal title={form.id ? "Edit Title" : "Add Title"} onClose={closePopups}>
          <form className="space-y-4" onSubmit={save}>
            <div>
              <label htmlFor="title-name" className="label">Title <span className="text-rose-500">*</span></label>
              <input id="title-name" className="input" autoFocus required maxLength={20} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="title-gender" className="label">Automatic gender</label>
              <select id="title-gender" className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={closePopups}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}

      {removing && (
        <Modal title={`Delete "${removing.name}"?`} onClose={closePopups}>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary" onClick={closePopups}>Cancel</button>
            <button type="button" className="btn-danger-solid" disabled={busy} onClick={() => run(() => api(`/titles/${removing._id}`, { method: "DELETE" }), "Deleted")}>Delete</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
