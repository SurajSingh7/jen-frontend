"use client";

import Link from "next/link";
import { useState } from "react";
import Modal from "./Modal";
import { BackIcon, DownIcon, LockIcon, UpIcon } from "./Icons";

// Top of a form page: Back on the left, title in the center, main action on the right
export function FormHeader({ backHref, backLabel = "Back", title, action, icon: Icon }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
          <BackIcon className="size-4" /> {backLabel}
        </Link>
      </div>
      {Icon ? (
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-500 text-white shadow-sm">
            <Icon className="size-5" />
          </span>
          <h1 className="bg-linear-to-r from-green-800 to-emerald-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">{title}</h1>
        </div>
      ) : (
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      )}
      <div className="flex justify-end">{action}</div>
    </div>
  );
}

// Numbered form section that can be collapsed. `flush` removes the body padding (for lists).
export function SectionCard({ index, title, action, flush = false, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`flex items-center justify-between gap-3 rounded-t-2xl bg-slate-50/60 px-4 py-2.5 ${open ? "" : "rounded-b-2xl"}`}>
        <div className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-semibold text-white">{index}</span>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {action}
          <button type="button" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${title}`} onClick={() => setOpen(!open)} className="text-slate-400 transition hover:text-slate-600">
            {open ? <UpIcon className="size-4" /> : <DownIcon className="size-4" />}
          </button>
        </div>
      </div>
      {open && <div className={`border-t border-slate-100 ${flush ? "" : "p-4"}`}>{children}</div>}
    </section>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {children}
    </p>
  );
}

export function Loading() {
  return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;
}

export function Field({ label, id, required, locked, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
        {locked && <LockIcon className="size-3 text-slate-400" aria-label="Locked" />}
      </label>
      {children}
    </div>
  );
}

export function ConfirmModal({ title, note, busy, confirmLabel = "Delete", confirmClass = "btn-danger-solid", onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      {note && <p className="mb-3 text-sm text-slate-600">{note}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={confirmClass} disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
