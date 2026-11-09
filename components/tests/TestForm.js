"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ParameterModal from "./ParameterModal";
import { CopyIcon, DownIcon, EditIcon, LoaderIcon, PlusIcon, SaveIcon, TestsIcon, TrashIcon, UpIcon } from "@/components/Icons";
import { ConfirmModal, ErrorBox, Field, FormHeader, Loading, SectionCard } from "@/components/Ui";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

const EMPTY = { group: "", name: "", printHeading: "", shortName: "", mrp: "", cost: "", method: "", notes: "", parameters: [] };

const rangeSummary = (p) =>
  p.ranges
    .map((r) => {
      const value = r.text || (r.min !== null && r.min !== "" && r.max !== null && r.max !== "" ? `${r.min}-${r.max}` : "");
      return r.who === "All" ? value : `${r.who[0]} ${value}`;
    })
    .join(" | ");

function Form({ id, initial, groups }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null); // { index } (index null = new)
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const params = form.parameters;

  // Local key keeps list rows stable while moving parameters that have no _id yet
  function saveParameter(parameter) {
    const next = [...params];
    if (editing.index === null) next.push({ ...parameter, key: crypto.randomUUID() });
    else next[editing.index] = parameter;
    setForm({ ...form, parameters: next });
    setEditing(null);
  }

  function move(index, by) {
    const next = [...params];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setForm({ ...form, parameters: next });
  }

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      toast.error(err.message);
      setRemoving(false);
      setBusy(false);
    }
  }

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      await (id ? api(`/tests/${id}`, { method: "PATCH", body: form }) : api("/tests", { method: "POST", body: form }));
      toast.success(id ? "Test updated" : "Test added");
      router.push("/tests");
    });
  };
  const copy = () =>
    run(async () => {
      const { test } = await api(`/tests/${id}/copy`, { method: "POST" });
      toast.success("Test copied");
      router.push(`/tests/${test._id}`);
    });
  const remove = () =>
    run(async () => {
      await api(`/tests/${id}`, { method: "DELETE" });
      toast.success("Test deleted");
      router.push("/tests");
    });

  const saveButton = (
    <button type="submit" className="btn-primary" disabled={busy}>
      {busy ? <LoaderIcon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
      {busy ? "Saving…" : "Save Test"}
    </button>
  );

  return (
    <form onSubmit={save}>
      <div className="mx-auto max-w-5xl space-y-3">
      <FormHeader backHref="/tests" backLabel="Back to Tests" title={id ? "Edit Test" : "Add Test"} action={saveButton} />

      <SectionCard index={1} title="Test Details">
      <div className="grid gap-x-3 gap-y-3 sm:grid-cols-6">
        <Field label="Group" id="group" required className="sm:col-span-2">
          <select id="group" className="input" required value={form.group} onChange={set("group")}>
            <option value="">Select</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Test name" id="name" required className="sm:col-span-4">
          <input id="name" className="input" required maxLength={120} value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Print heading" id="printHeading" className="sm:col-span-3">
          <input id="printHeading" className="input" maxLength={120} value={form.printHeading} onChange={set("printHeading")} />
        </Field>
        <Field label="Short name" id="shortName">
          <input id="shortName" className="input" maxLength={40} value={form.shortName} onChange={set("shortName")} />
        </Field>
        <Field label="MRP" id="mrp">
          <input id="mrp" className="input" type="number" min="0" step="any" value={form.mrp} onChange={set("mrp")} />
        </Field>
        <Field label="Cost" id="cost">
          <input id="cost" className="input" type="number" min="0" step="any" value={form.cost} onChange={set("cost")} />
        </Field>
      </div>
      </SectionCard>

      <SectionCard
        index={2}
        title="Parameters"
        flush
        action={
          <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-600" onClick={() => setEditing({ index: null })}>
            <PlusIcon className="size-3.5" /> Add parameter
          </button>
        }
      >
        {params.length === 0 && (
          <div className="m-3 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center">
            <TestsIcon className="mx-auto size-7 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">No parameters yet</p>
            <p className="text-sm text-slate-400">Add at least one parameter to save this test.</p>
          </div>
        )}
        {params.length > 0 && (
          <div className="hidden grid-cols-[2fr_1fr_2fr_1fr_9.5rem] gap-3 border-b border-slate-100 px-4 py-2.5 text-xs font-bold tracking-wide text-slate-600 uppercase md:grid">
            <span>Parameter</span>
            <span>Unit</span>
            <span>Normal Range</span>
            <span>Default</span>
            <span className="text-right">Actions</span>
          </div>
        )}
        <ul className="divide-y divide-slate-100">
          {params.map((p, i) => (
            <li key={p._id ?? p.key} className="grid items-center gap-x-3 gap-y-1 px-4 py-1.5 transition hover:bg-slate-50/60 md:grid-cols-[2fr_1fr_2fr_1fr_9.5rem]">
              <p className={`min-w-0 truncate text-sm text-slate-900 ${p.type === "heading" || p.bold ? "font-semibold" : ""}`}>{p.name}</p>
              <span className="truncate text-sm text-slate-500">{p.type === "heading" ? "Heading" : p.unit || "—"}</span>
              <span className="truncate text-sm text-slate-500">{p.type === "heading" ? "" : rangeSummary(p) || "—"}</span>
              <span className="truncate text-sm text-slate-500">{p.defaultValue || (p.type === "heading" ? "" : "—")}</span>
              <div className="flex items-center gap-1 md:justify-end">
              <button type="button" className="btn-icon" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                <UpIcon className="size-3.5" />
              </button>
              <button type="button" className="btn-icon" aria-label={`Move ${p.name} down`} disabled={i === params.length - 1} onClick={() => move(i, 1)}>
                <DownIcon className="size-3.5" />
              </button>
              <button type="button" className="btn-icon" aria-label={`Edit ${p.name}`} onClick={() => setEditing({ index: i })}>
                <EditIcon className="size-3.5" />
              </button>
              <button type="button" className="btn-icon hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${p.name}`} onClick={() => setForm({ ...form, parameters: params.filter((_, x) => x !== i) })}>
                <TrashIcon className="size-3.5" />
              </button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard index={3} title="Method and Notes">
      <div className="grid gap-3">
        <Field label="Method" id="method">
          <textarea id="method" className="input" rows={2} maxLength={500} value={form.method} onChange={set("method")} />
        </Field>
        <Field label="Notes / Interpretation" id="notes">
          <textarea id="notes" className="input" rows={4} maxLength={3000} value={form.notes} onChange={set("notes")} />
        </Field>
      </div>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-2">
        {id && (
          <>
            <button type="button" className="btn-danger-solid" disabled={busy} onClick={() => setRemoving(true)}>
              <TrashIcon className="size-4" /> Delete
            </button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={copy}>
              <CopyIcon className="size-4" /> Copy
            </button>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/tests" className="btn-secondary">
            Cancel
          </Link>
          {saveButton}
        </div>
      </div>
      </div>

      {editing && <ParameterModal parameter={editing.index === null ? null : params[editing.index]} onClose={() => setEditing(null)} onSave={saveParameter} />}
      {removing && <ConfirmModal title={`Delete ${form.name}?`} note="Old reports will not change." busy={busy} onConfirm={remove} onClose={() => setRemoving(false)} />}
    </form>
  );
}

export default function TestForm({ id }) {
  const { data, error, loading } = useLoad(async () => {
    const [{ items }, test] = await Promise.all([api("/masters/group"), id ? api(`/tests/${id}`).then((d) => d.test) : null]);
    return { groups: items.map((g) => g.name), test };
  }, id ?? "new");

  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!data.groups.length) {
    return (
      <div className="card p-8 text-center text-sm text-slate-600">
        First create a group in{" "}
        <Link href="/settings" className="font-semibold text-brand-700 underline">
          Settings → Test Groups
        </Link>.
      </div>
    );
  }
  return <Form id={id} initial={data.test ?? EMPTY} groups={data.groups} />;
}
