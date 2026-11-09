"use client";

import toast from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { BillPage, PAGE_W, ReportPage, paginate, paginateBill } from "./ReportPages";
import { LockIcon, ResetIcon, WhatsappIcon } from "@/components/Icons";
import { ConfirmModal, ErrorBox, Field, FormHeader, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

const isPhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const when = (date) => new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const liveToken = (share) => (share?.token && new Date(share.expiresAt) > new Date() ? share.token : null);
const NAMES = { report: "Report", bill: "Customer Bill", doctor: "Report" };

function linkStatus(share) {
  if (!share?.sentAt) return { label: "Not sent", style: "bg-slate-100 text-slate-600" };
  if (share.viewedAt) return { label: "Viewed", style: "bg-green-50 text-green-700" };
  return { label: "Sent, not viewed yet", style: "bg-amber-50 text-amber-700" };
}

function ShareStatus({ name, share }) {
  const status = linkStatus(share);
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{name}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.style}`}>{status.label}</span>
      </div>
      {share?.sentAt && <p className="text-xs text-slate-500">Last sent {when(share.sentAt)} to {share.sentTo}</p>}
      {share?.viewedAt && <p className="text-xs text-slate-500">First viewed {when(share.viewedAt)} · opened {share.viewCount} {share.viewCount === 1 ? "time" : "times"}</p>}
      {share?.sentAt && <p className="text-xs text-slate-500">Link valid till {new Date(share.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>}
    </div>
  );
}

function Send({ report, settings, doctorPhone }) {
  const info = report.patientInfo;
  const [to, setTo] = useState("patient");
  const [doc, setDoc] = useState("report");
  const [letterhead, setLetterhead] = useState(true);
  const [mobiles, setMobiles] = useState({ patient: info.mobile ?? "", doctor: doctorPhone });
  const [customs, setCustoms] = useState({}); // typed messages, per choice of documents
  const [shares, setShares] = useState(report.shares ?? {});
  const [busy, setBusy] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef(null);

  const forDoctor = to === "doctor";
  const kinds = useMemo(() => (forDoctor ? ["doctor"] : doc === "both" ? ["report", "bill"] : [doc]), [forDoctor, doc]);
  const choice = kinds.join("+");
  const mobile = mobiles[to];
  const reportPages = useMemo(() => paginate(report, settings), [report, settings]);
  const billPages = useMemo(() => paginateBill(report, settings), [report, settings]);

  const missing = kinds.filter((k) => !liveToken(shares[k])).join("+");
  const ready = !missing;

  const linkOf = (kind) => `${window.location.origin}/r/${liveToken(shares[kind])}`;
  function defaultMessage() {
    const lab = `${settings.labNameLatin} Pathology`;
    if (forDoctor) return `Dear ${report.doctorName}, the report of ${info.name} from ${lab} is ready. Lab No ${report.labNo}.`;
    const what = doc === "both" ? "report and bill" : doc === "bill" ? "bill" : "report";
    return `Dear ${info.name}, your ${what} from ${lab} is ready. Lab No ${report.labNo}.`;
  }
  const message = customs[choice] ?? defaultMessage();

  // Shown under the message and sent with it; never typed, so a link cannot get broken
  function linkText() {
    if (!ready) return "";
    if (forDoctor) return `View and download the report:\n${linkOf("doctor")}`;
    if (doc === "both") return `Report:\n${linkOf("report")}\n\nBill:\n${linkOf("bill")}`;
    return `View and download your ${doc === "bill" ? "bill" : "report"}:\n${linkOf(doc)}`;
  }

  // The A4 page shrinks to fit its column
  useEffect(() => {
    const box = previewRef.current;
    const observer = new ResizeObserver(() => setZoom(Math.min(1, box.clientWidth / PAGE_W)));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // The links must exist before the click: a browser only opens a new tab straight from the click
  useEffect(() => {
    if (!missing) return;
    (async () => {
      try {
        for (const kind of missing.split("+")) {
          const data = await api(`/reports/${report._id}/share/prepare`, { method: "POST", body: { kind } });
          setShares(data.shares);
        }
      } catch (err) {
        toast.error(err.message);
      }
    })();
  }, [missing, report._id]);

  async function markSent() {
    for (const kind of kinds) {
      const saved = await api(`/reports/${report._id}/share`, { method: "POST", body: { kind, mobile, letterhead } });
      setShares(saved.shares);
    }
  }

  async function send() {
    if (!/^[6-9]\d{9}$/.test(mobile)) return toast.error("Enter a valid 10 digit mobile number");
    if (!message.trim()) return toast.error("Enter a message");

    const text = encodeURIComponent(`${message.trim()}\n\n${linkText()}`);
    setBusy(true);
    try {
      if (isPhone()) {
        await markSent();
        window.location.href = `https://wa.me/91${mobile}?text=${text}`;
        return;
      }
      const chat = window.open(`https://web.whatsapp.com/send?phone=91${mobile}&text=${text}`, "jen-whatsapp");
      if (!chat) return toast.error("Allow pop-ups for this site, then try again");
      chat.focus();
      await markSent();
      toast.success("Chat opened. Press send in WhatsApp.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function renewLink() {
    setRenewing(false);
    setBusy(true);
    try {
      for (const kind of kinds) {
        const data = await api(`/reports/${report._id}/share/prepare`, { method: "POST", body: { kind, renew: true } });
        setShares(data.shares);
      }
      toast.success("New link ready. Press Send.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus() {
    try {
      const { report: latest } = await api(`/reports/${report._id}`);
      setShares(latest.shares ?? {});
      toast.success("Status updated", { id: "share-status" });
    } catch (err) {
      toast.error(err.message);
    }
  }

  const sentBefore = kinds.some((k) => shares[k]?.sentAt);
  const needsResults = report.status !== "Complete" && (forDoctor || doc !== "bill");

  return (
    <div className="space-y-3">
      <FormHeader backHref="/patients" icon={WhatsappIcon} title={`WhatsApp · Lab No ${report.labNo}`} />

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="card min-w-0 overflow-hidden p-3">
          <div ref={previewRef}>
            <div className="flex flex-col items-center gap-4" style={{ zoom }}>
              {kinds.includes("report") || kinds.includes("doctor")
                ? reportPages.map((rows, i) => <ReportPage key={`r${i}`} report={report} settings={settings} rows={rows} letterhead={letterhead} pageNo={i + 1} pageCount={reportPages.length} />)
                : null}
              {kinds.includes("bill") ? billPages.map((rows, i) => <BillPage key={`b${i}`} report={report} settings={settings} rows={rows} letterhead={letterhead} pageNo={i + 1} pageCount={billPages.length} />) : null}
            </div>
          </div>
        </section>

        <section className="card space-y-3 p-4 lg:sticky lg:top-18">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <WhatsappIcon className="size-4 text-green-700" /> Send on WhatsApp
          </h2>

          {report.doctor && (
            <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-0.5">
              {[["patient", "Patient"], ["doctor", "Doctor"]].map(([value, name]) => (
                <button key={value} type="button" role="tab" aria-selected={to === value} onClick={() => setTo(value)} className={`rounded-md px-2 py-1.5 text-xs font-bold transition ${to === value ? "bg-white text-green-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                  {name}
                </button>
              ))}
            </div>
          )}

          {forDoctor && (
            <Field label="Doctor" id="waDoctor">
              <input id="waDoctor" className="input" disabled value={report.doctorName} />
            </Field>
          )}

          <Field label="Patient" id="waPatient">
            <input id="waPatient" className="input" disabled value={[info.title, info.name].filter(Boolean).join(" ")} />
          </Field>

          <Field label="Send to" id="waMobile" required>
            <input id="waMobile" className="input" inputMode="numeric" maxLength={10} placeholder="10 digit number" value={mobile} onChange={(e) => setMobiles({ ...mobiles, [to]: e.target.value.replace(/\D/g, "") })} />
          </Field>

          {!forDoctor && (
            <div>
              <p className="label">Document</p>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-200/70 p-0.5">
                {[["report", "Report"], ["bill", "Bill"], ["both", "Both"]].map(([value, name]) => (
                  <button key={value} type="button" aria-pressed={doc === value} onClick={() => setDoc(value)} className={`rounded-md px-2 py-1.5 text-xs font-bold transition ${doc === value ? "bg-white text-green-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="size-4 accent-brand-600" checked={letterhead} onChange={(e) => setLetterhead(e.target.checked)} /> Letterhead
          </label>

          <Field label="Message" id="waMessage" required>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-green-500">
              <textarea id="waMessage" className="block w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none" rows={3} maxLength={1000} value={message} onChange={(e) => setCustoms({ ...customs, [choice]: e.target.value })} />
              <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <LockIcon className="size-3" /> Link cannot be edited
                </p>
                <p className="text-xs break-all whitespace-pre-wrap text-slate-600">{linkText() || "Preparing the link…"}</p>
              </div>
            </div>
          </Field>

          {needsResults && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Some results are still pending.</p>}

          <button type="button" className="btn-primary w-full" disabled={busy || !ready} onClick={send}>
            <WhatsappIcon className="size-4" /> {busy ? "Opening…" : "Send"}
          </button>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">Status</span>
              <button type="button" className="text-slate-400 transition hover:text-green-700" title="Refresh status" aria-label="Refresh status" onClick={refreshStatus}>
                <ResetIcon className="size-4" />
              </button>
            </div>
            {kinds.map((kind) => (
              <ShareStatus key={kind} name={NAMES[kind]} share={shares[kind]} />
            ))}
            {sentBefore && (
              <button type="button" className="text-xs font-semibold text-green-700 hover:text-green-600" disabled={busy} onClick={() => setRenewing(true)}>
                Create new link
              </button>
            )}
          </div>
        </section>
      </div>

      {renewing && (
        <ConfirmModal
          title="Create a new link?"
          note="The old link will stop working. Press Send after this to share the new one."
          confirmLabel="Create"
          confirmClass="btn-primary"
          onClose={() => setRenewing(false)}
          onConfirm={renewLink}
        />
      )}
    </div>
  );
}

export default function WhatsappSend({ id }) {
  const { data, error, loading } = useLoad(async () => {
    const [{ report }, { settings }, { doctors }] = await Promise.all([api(`/reports/${id}`), api("/settings"), api("/doctors")]);
    const phone = doctors.find((d) => d._id === report.doctor)?.phone ?? "";
    return { report, settings, doctorPhone: phone.replace(/\D/g, "").slice(-10) };
  }, id);
  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  return <Send report={data.report} settings={data.settings} doctorPhone={data.doctorPhone} />;
}
