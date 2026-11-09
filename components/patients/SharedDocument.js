"use client";

import toast from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { BillPage, PAGE_W, ReportPage, paginate, paginateBill } from "./ReportPages";
import { buildPdf, download, pdfName } from "./ReportView";
import { FileIcon } from "@/components/Icons";
import { Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

function Document({ kind, letterhead, report, settings }) {
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const pagesRef = useRef(null);
  const isBill = kind === "bill";
  const pages = useMemo(() => (isBill ? paginateBill(report, settings) : paginate(report, settings)), [report, settings, isBill]);
  const Page = isBill ? BillPage : ReportPage;

  useEffect(() => {
    const fit = () => setZoom(Math.min(1, (window.innerWidth - 24) / PAGE_W));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  async function save() {
    setBusy(true);
    try {
      download(await buildPdf(pagesRef.current, pdfName(report, isBill)));
    } catch (err) {
      toast.error(err.message || "Could not create the PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-gray-800 px-3 py-2.5 text-white shadow">
        <span className="truncate text-sm font-bold">{settings.labNameLatin} Pathology · Lab No {report.labNo}</span>
        <button type="button" className="btn-primary shrink-0" disabled={busy} onClick={save}>
          <FileIcon className="size-4" /> {busy ? "Creating…" : "Download PDF"}
        </button>
      </header>
      <div ref={pagesRef} className="flex flex-col items-center gap-4 p-3" style={{ zoom }}>
        {pages.map((rows, i) => (
          <Page key={i} report={report} settings={settings} rows={rows} letterhead={letterhead} pageNo={i + 1} pageCount={pages.length} />
        ))}
      </div>
    </div>
  );
}

export default function SharedDocument({ token }) {
  const { data, error, loading } = useLoad(() => api(`/public/r/${token}`), token);
  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-6">
        <p role="alert" className="card max-w-sm p-6 text-center text-sm font-medium text-slate-700">{error}</p>
      </div>
    );
  }
  return <Document kind={data.kind} letterhead={data.letterhead} report={data.report} settings={data.settings} />;
}
