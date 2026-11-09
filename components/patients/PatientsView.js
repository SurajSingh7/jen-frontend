"use client";

import Link from "next/link";
import PatientFilters, { usePatientFilters } from "./PatientFilters";
import RowActions from "./RowActions";
import { ResultPill, StatusPill, paymentOf } from "@/components/accounts/parts";
import Pagination from "@/components/Pagination";
import { PatientsIcon, PlusIcon } from "@/components/Icons";
import { ErrorBox, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { ageText, rupees, showDate } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

const Status = ResultPill;

const Payment = ({ bill }) => <StatusPill value={paymentOf(bill)} />;

const HEADINGS = ["Date", "Lab No", "Patient", "Doctor", "Mobile", "Total Amount", "Received", "Balance Due", "Payment", "Result", "Action"];

export default function PatientsView() {
  const filters = usePatientFilters();
  const { params, perPage, setPage, changePerPage } = filters;
  const { data, error, loading, reload } = useLoad(() => api(`/reports?${params}`), params);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-500 text-white shadow-sm">
            <PatientsIcon className="size-5" />
          </span>
          <h1 className="bg-linear-to-r from-green-800 to-emerald-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">Patient Details</h1>
        </div>
        <Link href="/patients/new" className="btn-primary">
          <PlusIcon size={17} /> New Patient
        </Link>
      </div>

      <PatientFilters filters={filters} data={data} />

      <div className="mt-3">
        <ErrorBox>{error}</ErrorBox>
      </div>

      {loading && !data && <Loading />}
      {data?.reports.length === 0 && <div className="card mt-3 p-10 text-center text-sm text-slate-500">No patients found for these filters.</div>}

      {data?.reports.length > 0 && (
        <>
          {/* Phone: cards */}
          <div className="mt-3 space-y-2 md:hidden">
            {data.reports.map((r) => (
              <div key={r._id} className="card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      #{r.labNo} {r.patientInfo.name}
                    </p>
                    <p className="truncate text-[13px] text-slate-500">
                      {ageText(r.patientInfo)} · {r.patientInfo.gender} · {r.doctorName} · {showDate(r.date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Payment bill={r.bill} />
                    <Status value={r.status} />
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-slate-700">
                    {rupees(r.bill.net)} {r.bill.balance > 0 && <span className="font-medium text-red-600">· {rupees(r.bill.balance)} balance</span>}
                  </span>
                  <RowActions id={r._id} name={r.patientInfo.name} status={r.status} balance={r.bill.balance} onChanged={reload} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="card mt-3 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/60">
                <tr>
                  {HEADINGS.map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold tracking-wide whitespace-nowrap text-slate-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.reports.map((r) => (
                  <tr key={r._id} className="transition hover:bg-slate-50/60">
                    <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">{showDate(r.date)}</td>
                    <td className="px-3 py-1.5 font-bold text-green-700">{r.labNo}</td>
                    <td className="px-3 py-1.5">
                      <span className="block font-medium whitespace-nowrap text-slate-900">{[r.patientInfo.title, r.patientInfo.name].filter(Boolean).join(" ")}</span>
                      <span className="block text-xs whitespace-nowrap text-slate-500">{ageText(r.patientInfo)} · {r.patientInfo.gender}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{r.doctorName}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.patientInfo.mobile}</td>
                    <td className="px-3 py-1.5 font-semibold tabular-nums text-slate-900">{rupees(r.bill.net)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-green-700">{rupees(r.bill.received)}</td>
                    <td className={`px-3 py-1.5 tabular-nums ${r.bill.balance > 0 ? "font-semibold text-red-600" : ""}`}>{rupees(r.bill.balance)}</td>
                    <td className="px-3 py-1.5"><Payment bill={r.bill} /></td>
                    <td className="px-3 py-1.5"><Status value={r.status} /></td>
                    <td className="px-1 py-0.5"><RowActions id={r._id} name={r.patientInfo.name} status={r.status} balance={r.bill.balance} onChanged={reload} /></td>
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
    </>
  );
}
