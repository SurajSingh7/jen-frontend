"use client";

import Link from "next/link";
import { useState } from "react";
import { Stat, StatusPill, paymentOf, td, tdRight, th, thRight } from "./parts";
import PatientFilters, { usePatientFilters } from "@/components/patients/PatientFilters";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { BalanceIcon, HideIcon, InfoIcon, PatientsIcon, ReceiptIcon, ViewIcon, WalletIcon } from "@/components/Icons";
import { ErrorBox, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { round2, rupees, showDate } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

const orDash = (value) => (value ? rupees(value) : "—");

function BreakupRow({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-slate-900" : "text-slate-900"}`}>{value}</dd>
    </div>
  );
}

const minus = (amount) => `− ${rupees(amount)}`;

function Popup({ title, onClose, children }) {
  return (
    <Modal title={title} onClose={onClose}>
      <dl className="space-y-1 text-sm">{children}</dl>
      <button type="button" className="btn-secondary mt-4 w-full" onClick={onClose}>Close</button>
    </Modal>
  );
}

const TotalLine = ({ label, value }) => (
  <div className="border-t border-slate-200 pt-1">
    <BreakupRow label={label} value={value} strong />
  </div>
);

function AmountBreakup({ report: r, onClose }) {
  const b = r.bill;
  return (
    <Popup title={`Amount Breakup · Lab No ${r.labNo}`} onClose={onClose}>
      <BreakupRow label="Basic Amount" value={rupees(b.basic)} />
      <BreakupRow label={b.extraNote || "Extra Charge"} value={rupees(b.extra)} />
      <TotalLine label="Subtotal" value={rupees(b.basic + b.extra)} />
      {r.doctorName === "Self" ? (
        <BreakupRow label="Discount" value={minus(b.discountAmount)} />
      ) : (
        <>
          <BreakupRow label="Doctor Discount" value={minus(b.doctorDiscount)} />
          <BreakupRow label="Lab Discount" value={minus(b.labDiscount)} />
        </>
      )}
      <TotalLine label="Total Amount" value={rupees(b.net)} />
    </Popup>
  );
}

// Each later payment is in the entry's history; whatever is left came in at registration
function ReceivedBreakup({ report: r, onClose }) {
  const { data, error, loading } = useLoad(() => api(`/reports/${r._id}`).then((d) => d.report), r._id);
  const payments = (data?.history ?? [])
    .filter((event) => event.action === "Payment received")
    .map((event) => {
      const value = (field) => event.changes.find((c) => c.field === field)?.to ?? "";
      return { at: event.at, amount: Number(value("Amount paid")), mode: value("Mode"), note: value("Note") };
    });
  const atEntry = round2(r.bill.received - payments.reduce((sum, p) => sum + p.amount, 0));

  return (
    <Popup title={`Received · Lab No ${r.labNo}`} onClose={onClose}>
      {loading && <Loading />}
      <ErrorBox>{error}</ErrorBox>
      {data && (
        <>
          {atEntry > 0 && <BreakupRow label="At registration" value={rupees(atEntry)} />}
          {payments.map((p, i) => (
            <BreakupRow key={i} label={[new Date(p.at).toLocaleDateString("en-IN", { dateStyle: "medium" }), p.mode, p.note].filter(Boolean).join(" · ")} value={rupees(p.amount)} />
          ))}
          <TotalLine label="Total Received" value={rupees(r.bill.received)} />
          <BreakupRow label="Balance Due" value={rupees(r.bill.balance)} />
        </>
      )}
    </Popup>
  );
}

function LabBreakup({ report: r, onClose }) {
  const b = r.bill;
  const self = r.doctorName === "Self";
  return (
    <Popup title={`Lab Earning · Lab No ${r.labNo}`} onClose={onClose}>
      <BreakupRow label="Basic Amount" value={rupees(b.basic)} />
      <BreakupRow label={b.extraNote || "Extra Charge"} value={rupees(b.extra)} />
      <TotalLine label="Subtotal" value={rupees(b.basic + b.extra)} />
      {!self && <BreakupRow label={`Doctor Share (${r.commission.percent}%)`} value={minus(r.commission.gross)} />}
      <BreakupRow label={self ? "Discount" : "Lab Discount"} value={minus(b.labDiscount)} />
      <TotalLine label="Lab Earning" value={rupees(b.labEarning)} />
    </Popup>
  );
}

function DoctorBreakup({ report: r, onClose }) {
  const b = r.bill;
  const c = r.commission;
  const onExtra = b.commissionBase === "basic_extra";
  return (
    <Popup title={`Doctor Earning · Lab No ${r.labNo}`} onClose={onClose}>
      <BreakupRow label={onExtra ? "Basic + Extra" : "Basic Amount"} value={rupees(onExtra ? b.basic + b.extra : b.basic)} />
      <BreakupRow label="Commission" value={`${c.percent}%`} />
      <TotalLine label="Doctor Share" value={rupees(c.gross)} />
      <BreakupRow label="Doctor Discount" value={minus(b.doctorDiscount)} />
      <TotalLine label="Doctor Earning" value={rupees(c.amount)} />
    </Popup>
  );
}

const BREAKUPS = { amount: AmountBreakup, received: ReceivedBreakup, lab: LabBreakup, doctor: DoctorBreakup };

function WithInfo({ label, onClick, children }) {
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      {children}
      <button type="button" className="rounded-md border border-blue-200 bg-white p-0.5 text-blue-600 shadow-sm transition hover:bg-blue-50" title={label} aria-label={label} onClick={onClick}>
        <InfoIcon className="size-3.5" />
      </button>
    </span>
  );
}

export default function PatientAccount() {
  const [showDoctor, setShowDoctor] = useState(false);
  const [breakup, setBreakup] = useState(null); // { kind, report }
  const BreakupView = breakup && BREAKUPS[breakup.kind];
  const filters = usePatientFilters();
  const { params, perPage, setPage, changePerPage } = filters;
  const { data, error, loading } = useLoad(() => api(`/reports?${params}`), params);

  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-8">
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-500 text-white shadow-sm">
            <WalletIcon className="size-5" />
          </span>
          <h1 className="bg-linear-to-r from-green-800 to-emerald-500 bg-clip-text text-2xl font-bold tracking-tight whitespace-nowrap text-transparent">Patient Account</h1>
        </div>
        {data && (
          <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-[10rem_repeat(3,minmax(0,1fr))]">
            <Stat icon={PatientsIcon} color="blue" label="Patients" value={data.total} />
            <Stat icon={ReceiptIcon} color="violet" label="Total Amount" value={rupees(data.totals.net)} />
            <Stat icon={WalletIcon} color="green" label="Received" value={rupees(data.totals.received)} />
            <Stat icon={BalanceIcon} color="rose" label="Balance" value={rupees(data.totals.balance)} />
          </div>
        )}
      </div>

      <PatientFilters
        filters={filters}
        data={data}
        paymentTabs
        afterDates={
          <button type="button" aria-pressed={showDoctor} onClick={() => setShowDoctor(!showDoctor)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap shadow-sm transition ${showDoctor ? "border-green-300 bg-green-50 text-green-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {showDoctor ? <ViewIcon className="size-4" /> : <HideIcon className="size-4" />} Dr. Earning
          </button>
        }
      />

      <div className="mt-3">
        <ErrorBox>{error}</ErrorBox>
      </div>
      {loading && !data && <Loading />}
      {data?.reports.length === 0 && <div className="card mt-3 p-10 text-center text-sm text-slate-500">No entries found for these filters.</div>}

      {data?.reports.length > 0 && (
        <>
          <div className="card mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Lab No</th>
                  <th className={th}>Patient</th>
                  <th className={th}>Doctor</th>
                  <th className={thRight}>Total Amount</th>
                  <th className={thRight}>Received</th>
                  <th className={thRight}>Balance Due</th>
                  <th className={th}>Payment</th>
                  <th className={thRight}>Lab Earning</th>
                  {showDoctor && <th className={thRight}>Dr. Earning</th>}
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.reports.map((r) => (
                  <tr key={r._id} className="transition hover:bg-slate-50/60">
                    <td className={td}>{showDate(r.date)}</td>
                    <td className={`${td} font-bold text-green-700`}>{r.labNo}</td>
                    <td className={`${td} font-medium text-slate-900`}>{r.patientInfo.name}</td>
                    <td className={td}>{r.doctorName}</td>
                    <td className={`${tdRight} font-semibold text-slate-900`}>
                      <WithInfo label={`${r.patientInfo.name} amount breakup`} onClick={() => setBreakup({ kind: "amount", report: r })}>{rupees(r.bill.net)}</WithInfo>
                    </td>
                    <td className={tdRight}>
                      <WithInfo label={`${r.patientInfo.name} received breakup`} onClick={() => setBreakup({ kind: "received", report: r })}>{rupees(r.bill.received)}</WithInfo>
                    </td>
                    <td className={`${tdRight} ${r.bill.balance > 0 ? "font-semibold text-red-600" : ""}`}>{orDash(r.bill.balance)}</td>
                    <td className={td}><StatusPill value={paymentOf(r.bill)} /></td>
                    <td className={tdRight}>
                      <WithInfo label={`${r.patientInfo.name} lab earning breakup`} onClick={() => setBreakup({ kind: "lab", report: r })}>{rupees(r.bill.labEarning)}</WithInfo>
                    </td>
                    {showDoctor && (
                      <td className={tdRight}>
                        {r.doctorName === "Self" ? "—" : <WithInfo label={`${r.patientInfo.name} doctor earning breakup`} onClick={() => setBreakup({ kind: "doctor", report: r })}>{rupees(r.commission.amount)}</WithInfo>}
                      </td>
                    )}
                    <td className="px-3 py-1">
                      <Link href={`/accounts/patients/${r._id}`} className="btn-icon border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700" title="View details" aria-label={`${r.patientInfo.name} details`}>
                        <ViewIcon size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card mt-3 px-3 py-2 empty:hidden">
            <Pagination page={data.page} total={data.total} perPage={perPage} onPage={setPage} onPerPage={changePerPage} />
          </div>
        </>
      )}

      {BreakupView && <BreakupView report={breakup.report} onClose={() => setBreakup(null)} />}
    </>
  );
}
