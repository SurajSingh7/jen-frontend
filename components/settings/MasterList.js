"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import Modal from "@/components/Modal";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/Icons";
import { ConfirmModal, ErrorBox, Field, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

export default function MasterList({ kind, title, hint }) {
  const { data: items, error, loading, reload } = useLoad(() => api(`/masters/${kind}`).then((d) => d.items), kind);
  const [form, setForm] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setForm(null);
    setRemoving(null);
  };

  async function run(action, message) {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      close();
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function save(e) {
    e.preventDefault();
    const body = { name: form.name };
    run(() => (form.id ? api(`/masters/${kind}/${form.id}`, { method: "PATCH", body }) : api(`/masters/${kind}`, { method: "POST", body })), "Saved");
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{hint}</p>
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setForm({ name: "" })}>
          <PlusIcon size={17} /> Add
        </button>
      </div>
      <div className="mt-3">
        <ErrorBox>{error}</ErrorBox>
      </div>
      {loading && <Loading />}
      {items?.length === 0 && (
        <div className="mt-4 rounded-xl bg-brand-50 p-6 text-center">
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => run(() => api(`/masters/${kind}/defaults`, { method: "POST" }), "List added")}>
            Add common list
          </button>
        </div>
      )}
      {items?.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item._id} className="flex items-center gap-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{item.name}</span>
              <button type="button" className="btn-icon" aria-label={`Edit ${item.name}`} onClick={() => setForm({ id: item._id, name: item.name })}>
                <EditIcon size={17} />
              </button>
              <button type="button" className="btn-icon hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${item.name}`} onClick={() => setRemoving(item)}>
                <TrashIcon size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <Modal title={form.id ? "Edit" : `Add to ${title}`} onClose={close}>
          <form className="space-y-3" onSubmit={save}>
            <Field label="Name" id="master-name" required>
              <input id="master-name" className="input" autoFocus required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={close}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
      {removing && <ConfirmModal title={`Delete "${removing.name}"?`} busy={busy} onConfirm={() => run(() => api(`/masters/${kind}/${removing._id}`, { method: "DELETE" }), "Deleted")} onClose={close} />}
    </section>
  );
}
