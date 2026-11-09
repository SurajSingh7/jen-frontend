"use client";

import toast from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { BillPage, PAGE_H, PAGE_W, ReportPage, paginate, paginateBill } from "./ReportPages";
import { FileIcon, PrintIcon, ReceiptIcon } from "@/components/Icons";
import { ConfirmModal, ErrorBox, FormHeader, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

// Each page becomes one image in the PDF: the browser has already drawn the Hindi text correctly
export async function buildPdf(container, fileName) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pages = [...container.querySelectorAll(".report-page")];
  for (const [i, page] of pages.entries()) {
    const image = await toJpeg(page, { width: PAGE_W, height: PAGE_H, pixelRatio: 2, quality: 0.92, skipFonts: true, backgroundColor: "#ffffff", style: { boxShadow: "none" } });
    if (i > 0) pdf.addPage();
    pdf.addImage(image, "JPEG", 0, 0, 210, 297);
  }
  const blob = pdf.output("blob");
  return new File([blob], fileName, { type: "application/pdf" });
}

export const pdfName = (report, isBill) => `JEN-${isBill ? "Bill-" : ""}${report.labNo}-${report.patientInfo.name.replace(/[^\w]+/g, "-")}.pdf`;

export function download(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function View({ report, settings, isBill }) {
  const [letterhead, setLetterhead] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const pages = useMemo(() => (isBill ? paginateBill(report, settings) : paginate(report, settings)), [report, settings, isBill]);
  const fileName = pdfName(report, isBill);

  // The A4 page shrinks to fit a phone screen
  useEffect(() => {
    const fit = () => setZoom(Math.min(1, (window.innerWidth - 32) / PAGE_W));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  async function withPdf(action) {
    setBusy(true);
    try {
      await action(await buildPdf(containerRef.current, fileName));
    } catch (err) {
      if (err.name !== "AbortError") toast.error(err.message || "Could not create the PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="space-y-3 print:hidden">
        <FormHeader
          backHref="/patients"
          icon={isBill ? ReceiptIcon : FileIcon}
          title={`${isBill ? "Customer Bill" : "Report"} · Lab No ${report.labNo}`}
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="flex items-center gap-2 pr-1 text-sm font-medium text-slate-700">
                <input type="checkbox" className="size-4 accent-brand-600" checked={letterhead} onChange={(e) => setLetterhead(e.target.checked)} /> Letterhead
              </label>
              <button type="button" className="btn-secondary" onClick={() => window.print()}>
                <PrintIcon className="size-4" /> Print
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => setConfirming(true)}>
                <FileIcon className="size-4" /> {busy ? "Creating…" : "Download PDF"}
              </button>
            </div>
          }
        />
        {!isBill && report.status !== "Complete" && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Some results are still pending.</p>}
        {confirming && (
          <ConfirmModal
            title="Download PDF?"
            note={`Are you sure you want to download ${fileName}?`}
            confirmLabel="Download"
            confirmClass="btn-primary"
            onClose={() => setConfirming(false)}
            onConfirm={() => {
              setConfirming(false);
              withPdf(async (file) => {
                download(file);
                toast.success("PDF downloaded");
              });
            }}
          />
        )}
      </div>

      <div ref={containerRef} className="report-zoom flex flex-col items-center gap-4" style={{ zoom }}>
        {pages.map((rows, i) => {
          const Page = isBill ? BillPage : ReportPage;
          return <Page key={i} report={report} settings={settings} rows={rows} letterhead={letterhead} pageNo={i + 1} pageCount={pages.length} />;
        })}
      </div>
    </div>
  );
}

export default function ReportViewLoader({ id, kind = "report" }) {
  const { data, error, loading } = useLoad(async () => {
    const [{ report }, { settings }] = await Promise.all([api(`/reports/${id}`), api("/settings")]);
    return { report, settings };
  }, id);
  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  return <View report={data.report} settings={data.settings} isBill={kind === "bill"} />;
}
