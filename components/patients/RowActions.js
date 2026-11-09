"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { CollectIcon, EditIcon, FileIcon, HistoryIcon, MoreIcon, ReceiptIcon, ResultIcon, ViewIcon, WhatsappIcon } from "@/components/Icons";
import { ErrorBox, Field, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { rupees } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

const when = (date) => new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const HISTORY_TABS = ["All", "Patient", "Result", "Payment"];
const MONEY_FIELDS = new Set(["Basic amount", "Extra charge note", "Extra charge", "Discount", "Doctor discount", "Lab discount", "Doctor commission %", "Patient pays", "Received", "Balance"]);

// An edit can change patient details and money together, so its fields are split between the two tabs
function inTab(events, tab) {
  if (tab === "All") return events;
  return events
    .map((event) => {
      if (event.action.startsWith("Result")) return tab === "Result" ? event : null;
      if (event.action === "Payment received") return tab === "Payment" ? event : null;
      if (tab === "Result") return null;
      return { ...event, changes: event.changes.filter((c) => MONEY_FIELDS.has(c.field) === (tab === "Payment")) };
    })
    .filter((event) => event?.changes.length);
}

// Every recorded change, newest first
export function HistoryList({ report }) {
  const [tab, setTab] = useState("All");
  const all = [...report.history].reverse();
  if (all.length === 0) return <p className="py-6 text-center text-sm text-slate-500">Created on {when(report.createdAt)}. Changes made from now on will appear here.</p>;
  const counts = Object.fromEntries(HISTORY_TABS.map((name) => [name, inTab(all, name).length]));
  const events = inTab(all, tab);

  return (
    <div className="space-y-3">
      <div role="tablist" className="flex flex-wrap gap-1.5">
        {HISTORY_TABS.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${tab === name ? "border-green-700 bg-green-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {name}
            <span className={`rounded-full px-1.5 tabular-nums ${tab === name ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{counts[name]}</span>
          </button>
        ))}
      </div>
      {events.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Nothing recorded here yet.</p>}
      {events.map((event, i) => (
        <section key={i} className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center justify-between gap-3 bg-slate-50/60 px-3 py-2">
            <h3 className="text-sm font-bold text-slate-900">{event.action}</h3>
            <span className="text-xs whitespace-nowrap text-slate-500">{when(event.at)}</span>
          </div>
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-t border-slate-100 text-xs font-bold tracking-wide text-slate-600 uppercase">
                <th className="px-3 py-1.5">Field</th>
                <th className="px-3 py-1.5">Old</th>
                <th className="px-3 py-1.5">New</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {event.changes.map((change) => (
                <tr key={change.field} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 font-medium break-words text-slate-900">{change.field}</td>
                  <td className="px-3 py-1.5 break-words text-slate-500">{change.from || "—"}</td>
                  <td className="px-3 py-1.5 font-semibold break-words text-slate-900">{change.to || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function HistoryModal({ id, name, onClose }) {
  const { data: report, error, loading } = useLoad(() => api(`/reports/${id}`).then((d) => d.report), id);

  return (
    <Modal title={`History · ${name}`} width="sm:max-w-2xl" onClose={onClose}>
      <div className="max-h-[65vh] overflow-y-auto pr-1">
        {loading && <Loading />}
        <ErrorBox>{error}</ErrorBox>
        {report && <HistoryList report={report} />}
      </div>
      <button type="button" className="btn-secondary mt-4 w-full" onClick={onClose}>Close</button>
    </Modal>
  );
}

function CollectModal({ id, name, balance, onClose, onDone }) {
  const [form, setForm] = useState({ amount: balance, mode: "Cash", note: "" });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return toast.error("Enter a valid amount");
    if (amount > balance) return toast.error(`Amount cannot be more than ${rupees(balance)}`);
    setBusy(true);
    try {
      await api(`/reports/${id}/payment`, { method: "PATCH", body: form });
      toast.success("Payment saved");
      onDone();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Receive Payment · ${name}`} width="sm:max-w-md" onClose={onClose}>
      <form className="space-y-3" onSubmit={save}>
        <p className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
          Balance Due <span className="text-base font-bold text-red-600 tabular-nums">{rupees(balance)}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount" id={`collectAmount-${id}`} required>
            <input id={`collectAmount-${id}`} className="input" type="number" min="0" step="any" required autoFocus value={form.amount} onChange={set("amount")} />
          </Field>
          <Field label="Mode" id={`collectMode-${id}`} required>
            <select id={`collectMode-${id}`} className="input" value={form.mode} onChange={set("mode")}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank</option>
            </select>
          </Field>
        </div>
        <Field label="Note" id={`collectNote-${id}`}>
          <input id={`collectNote-${id}`} className="input" maxLength={200} value={form.note} onChange={set("note")} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

const COLORS = {
  whatsapp: "border-emerald-500 bg-emerald-500 text-white hover:border-emerald-600 hover:bg-emerald-600 hover:text-white",
  collect: "border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700",
  result: "border-orange-200 bg-orange-50 text-orange-600 hover:border-orange-300 hover:bg-orange-100 hover:text-orange-700",
  view: "border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700",
  report: "border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 hover:text-green-800",
  more: "border-violet-200 bg-violet-50 text-violet-600 hover:border-violet-300 hover:bg-violet-100 hover:text-violet-700",
};

const MENU_ITEM ="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-slate-700 hover:bg-green-50";

export default function RowActions({ id, name, status, balance, onChanged }) {
  const [collecting, setCollecting] = useState(false);
  const [menu, setMenu] = useState(null); // screen position of the open menu
  const [showHistory, setShowHistory] = useState(false);
  const ref = useRef(null);
  const complete = status === "Complete";

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onMouseDown = (e) => !ref.current?.contains(e.target) && close();
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  function toggleMenu(e) {
    const box = e.currentTarget.getBoundingClientRect();
    setMenu(menu ? null : { top: Math.min(box.bottom + 4, window.innerHeight - 180), right: window.innerWidth - box.right });
  }

  return (
    <div className="flex items-center gap-1">
      {balance > 0 && (
        <button type="button" className={`btn-icon ${COLORS.collect}`} title="Receive payment" aria-label={`${name} receive payment`} onClick={() => setCollecting(true)}>
          <CollectIcon size={18} />
        </button>
      )}
      {!complete && (
        <Link href={`/patients/${id}/result`} className={`btn-icon ${COLORS.result}`} title="Enter results" aria-label={`${name} result`}>
          <ResultIcon size={18} />
        </Link>
      )}
      <Link href={`/patients/${id}`} className={`btn-icon ${COLORS.view}`} title="View details" aria-label={`${name} details`}>
        <ViewIcon size={18} />
      </Link>
      <Link href={`/patients/${id}/report`} className={`btn-icon ${COLORS.report}`} title="PDF and Print" aria-label={`${name} report`}>
        <FileIcon size={18} />
      </Link>
      <Link href={`/patients/${id}/whatsapp`} className={`btn-icon ${COLORS.whatsapp}`} title="WhatsApp" aria-label={`${name} WhatsApp`}>
        <WhatsappIcon size={18} />
      </Link>
      <div ref={ref}>
        <button type="button" className={`btn-icon ${COLORS.more}`} title="More" aria-label={`${name} more actions`} aria-haspopup="menu" aria-expanded={Boolean(menu)} onClick={toggleMenu}>
          <MoreIcon size={18} />
        </button>
        {menu && (
          <div role="menu" className="fixed z-40 flex flex-col rounded-lg border border-slate-200 bg-white p-1 shadow-lift" style={menu}>
            {complete && (
              <Link role="menuitem" href={`/patients/${id}/result`} className={MENU_ITEM}>
                <ResultIcon className="size-4 text-orange-600" /> Modify Result
              </Link>
            )}
            <Link role="menuitem" href={`/patients/${id}/edit`} className={MENU_ITEM}>
              <EditIcon className="size-4 text-blue-600" /> Edit
            </Link>
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM}
              onClick={() => {
                setMenu(null);
                setShowHistory(true);
              }}
            >
              <HistoryIcon className="size-4 text-violet-600" /> History
            </button>
            <Link role="menuitem" href={`/patients/${id}/bill`} className={MENU_ITEM}>
              <ReceiptIcon className="size-4 text-green-700" /> Customer Bill
            </Link>
          </div>
        )}
      </div>
      {collecting && (
        <CollectModal
          id={id}
          name={name}
          balance={balance}
          onClose={() => setCollecting(false)}
          onDone={() => {
            setCollecting(false);
            onChanged();
          }}
        />
      )}
      {showHistory && <HistoryModal id={id} name={name} onClose={() => setShowHistory(false)} />}
    </div>
  );
}
