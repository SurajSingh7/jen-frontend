"use client";

import Link from "next/link";
import { HistoryList } from "./RowActions";
import { ResultPill, StatusPill, paymentOf } from "@/components/accounts/parts";
import { DoctorsIcon, FileIcon, HistoryIcon, TestsIcon, UserIcon, ViewIcon, WalletIcon } from "@/components/Icons";
import { ErrorBox, FormHeader, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { ageText, rupees, showDate } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

function Card({ icon: Icon, title, className = "", children }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <h2 className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-sm font-bold text-slate-900">
        <Icon className="size-4 text-green-700" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Info({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="truncate text-sm font-semibold text-slate-900">{children || "—"}</div>
    </div>
  );
}

function Money({ label, value, strong, tone = "text-slate-900" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""} ${tone}`}>{value}</dd>
    </div>
  );
}

const minus = (amount) => (amount ? `− ${rupees(amount)}` : rupees(0));

function TestResults({ test }) {
  return (
    <div>
      <h3 className="bg-green-50/60 px-4 py-2 text-sm font-bold text-green-900">{test.name}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-bold tracking-wide text-slate-600 uppercase">
              <th className="px-4 py-1.5">Parameter</th>
              <th className="px-4 py-1.5">Result</th>
              <th className="px-4 py-1.5">Normal Range</th>
              <th className="px-4 py-1.5">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {test.params.map((p) =>
              p.type === "heading" ? (
                <tr key={p.paramId}>
                  <td colSpan={4} className="px-4 py-1.5 font-semibold text-slate-900">{p.name}</td>
                </tr>
              ) : (
                <tr key={p.paramId}>
                  <td className={`px-4 py-1.5 text-slate-800 ${p.bold ? "font-semibold" : ""}`}>{p.name}</td>
                  <td className={`px-4 py-1.5 whitespace-nowrap ${p.flag ? "font-semibold text-red-600" : "text-slate-900"}`}>
                    {p.result || <span className="text-slate-300">—</span>} {p.flag === "H" ? "↑" : p.flag === "L" ? "↓" : ""}
                  </td>
                  <td className="px-4 py-1.5 text-slate-600">{p.rangeText}</td>
                  <td className="px-4 py-1.5 text-slate-600">{p.unit}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {(test.method || test.notes) && (
        <div className="space-y-0.5 border-t border-slate-100 px-4 py-2 text-xs text-slate-600">
          {test.method && <p><b>Method:</b> {test.method}</p>}
          {test.notes && <p><b>Note:</b> {test.notes}</p>}
        </div>
      )}
    </div>
  );
}

function Detail({ report: r, backHref }) {
  const i = r.patientInfo;
  const b = r.bill;
  const c = r.commission;

  return (
    <div className="space-y-3">
      <FormHeader backHref={backHref} icon={ViewIcon} title={`Lab No ${r.labNo} · ${i.name}`} />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={`/patients/${r._id}/report`} className="btn-primary"><FileIcon className="size-4" /> Report PDF</Link>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-3">
        <Card icon={UserIcon} title="Patient Information" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:grid-cols-4">
            <Info label="Lab No">{r.labNo}</Info>
            <Info label="Date">{showDate(r.date)}</Info>
            <Info label="Name">{[i.title, i.name].filter(Boolean).join(" ")}</Info>
            <Info label="Mobile">{i.mobile}</Info>
            <Info label="Age">{ageText(i)}</Info>
            <Info label="Gender">{i.gender}</Info>
            <Info label="Doctor">{r.doctorName}</Info>
            <Info label="Sample">{r.sampleType}</Info>
            <Info label="Result"><ResultPill value={r.status} /></Info>
            <Info label="Payment"><StatusPill value={paymentOf(b)} /></Info>
          </div>
        </Card>

        <Card icon={WalletIcon} title="Payment Details" className="lg:row-span-2">
          <dl className="space-y-1 p-4 text-sm">
            <Money label="Basic Amount" value={rupees(b.basic)} />
            {b.extra > 0 && <Money label={b.extraNote || "Extra Charge"} value={rupees(b.extra)} />}
            <div className="border-t border-slate-200 pt-1">
              <Money label="Total" value={rupees(b.basic + b.extra)} strong />
            </div>
            {r.doctor ? (
              <>
                <Money label="Doctor Discount" value={minus(b.doctorDiscount)} />
                <Money label="Lab Discount" value={minus(b.labDiscount)} />
              </>
            ) : (
              <Money label="Discount" value={minus(b.discountAmount)} />
            )}
            <div className="border-t border-slate-200 pt-1">
              <Money label="Patient Pays" value={rupees(b.net)} strong />
            </div>
            <Money label="Received" value={rupees(b.received)} />
            <Money label="Balance" value={rupees(b.balance)} strong tone={b.balance > 0 ? "text-red-600" : "text-green-700"} />
          </dl>
          {r.doctor && (
            <>
              <h3 className="flex items-center gap-2 border-y border-slate-100 bg-slate-50/60 px-4 py-2 text-sm font-bold text-slate-900">
                <DoctorsIcon className="size-4 text-green-700" /> Commission
              </h3>
              <dl className="space-y-1 p-4 text-sm">
                <Money label={`Doctor Share (${c.percent}%)`} value={rupees(c.gross)} />
                <Money label="Doctor Gets" value={rupees(c.amount)} strong tone="text-green-700" />
                <Money label="Lab Gets" value={rupees(b.labEarning)} strong tone="text-green-700" />
              </dl>
            </>
          )}
        </Card>

        <Card icon={TestsIcon} title={`Tests and Results (${r.tests.length})`} className="lg:col-span-2">
          <div className="divide-y divide-slate-200">
            {r.tests.map((test) => (
              <TestResults key={test.test} test={test} />
            ))}
          </div>
        </Card>
      </div>

      <Card icon={HistoryIcon} title="History">
        <div className="p-4">
          <HistoryList report={r} />
        </div>
      </Card>
    </div>
  );
}

export default function PatientDetail({ id, backHref = "/patients" }) {
  const { data, error, loading } = useLoad(() => api(`/reports/${id}`).then((d) => d.report), id);
  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  return <Detail report={data} backHref={backHref} />;
}
