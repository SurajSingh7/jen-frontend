"use client";

import Link from "next/link";
import { useState } from "react";
import PayModal from "./PayModal";
import { CalendarPick, Stat, StatusPill, StatusTabs, td, tdRight, th, thRight } from "./parts";
import Pagination from "@/components/Pagination";
import SearchableSelect from "@/components/SearchableSelect";
import { BalanceIcon, DoctorsIcon, PatientsIcon, ReceiptIcon, ResetIcon, SearchIcon, ViewIcon, WalletIcon } from "@/components/Icons";
import { ErrorBox, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { round2, rupees } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

export default function DoctorAccount() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [clinic, setClinic] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [paying, setPaying] = useState(null);

  const params = new URLSearchParams({ from, to }).toString();
  const { data, error, loading, reload } = useLoad(() => api(`/accounts/doctors?${params}`), params);

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const fromInput = (setter) => (e) => change(setter)(e.target.value);

  function reset() {
    setFrom("");
    setTo("");
    setSearch("");
    setStatus("");
    setClinic("");
    setPage(1);
  }

  const q = search.trim().toLowerCase();
  const clinics = [...new Set((data?.rows ?? []).map((r) => r.clinic).filter(Boolean))].sort();
  const found = data?.rows.filter((r) => `${r.name} ${r.clinic ?? ""}`.toLowerCase().includes(q) && (!clinic || r.clinic === clinic)) ?? [];
  const rows = found.filter((r) => !status || r.status === status);
  const sumOf = (key) => round2(rows.reduce((sum, r) => sum + r[key], 0));
  const shown = rows.slice((page - 1) * perPage, page * perPage);
  const counts = { "": found.length, ...Object.fromEntries(["Paid", "Partial", "Unpaid"].map((s) => [s, found.filter((r) => r.status === s).length])) };

  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-8">
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-500 text-white shadow-sm">
            <DoctorsIcon className="size-5" />
          </span>
          <h1 className="bg-linear-to-r from-green-800 to-emerald-500 bg-clip-text text-2xl font-bold tracking-tight whitespace-nowrap text-transparent">Doctor Account</h1>
        </div>
        {data && (
          <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-[10rem_repeat(3,minmax(0,1fr))]">
            <Stat icon={PatientsIcon} color="blue" label="Patients" value={sumOf("patients")} />
            <Stat icon={ReceiptIcon} color="violet" label="Commission Earned" value={rupees(sumOf("earned"))} />
            <Stat icon={WalletIcon} color="green" label="Commission Paid" value={rupees(sumOf("paid"))} />
            <Stat icon={BalanceIcon} color="rose" label="Balance (all time)" value={rupees(sumOf("balance"))} />
          </div>
        )}
      </div>

      <div className="card mt-3 grid grid-cols-1 gap-2 p-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" type="search" aria-label="Doctor search" placeholder="Search doctor or clinic..." value={search} onChange={(e) => change(setSearch)(e.target.value)} />
        </div>
        <SearchableSelect id="clinicFilter" value={clinic} onChange={change(setClinic)} options={[{ value: "", label: "All clinics" }, ...clinics.map((c) => ({ value: c, label: c }))]} />      </div>

      <div className="card mt-3 flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs value={status} counts={counts} onChange={change(setStatus)} />
        <div className="flex flex-wrap items-center gap-2.5">
          <CalendarPick label="From" value={from} onChange={fromInput(setFrom)} />
          <CalendarPick label="To" value={to} onChange={fromInput(setTo)} />
          {(search || status || clinic || from || to) && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100">
              <ResetIcon className="size-4" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-3">
        <ErrorBox>{error}</ErrorBox>
      </div>
      {loading && !data && <Loading />}
      {data && rows.length === 0 && <div className="card mt-3 p-10 text-center text-sm text-slate-500">No doctors found for these filters.</div>}

      {rows.length > 0 && (
        <>
          <div className="card mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className={th}>Doctor</th>
                  <th className={thRight}>Patients</th>
                  <th className={thRight}>Commission Earned</th>
                  <th className={thRight}>Commission Paid</th>
                  <th className={thRight}>Balance Due</th>
                  <th className={th}>Status</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => (
                  <tr key={r._id} className="transition hover:bg-slate-50/60">
                    <td className={td}>
                      <span className="block font-medium text-slate-900">{r.name}</span>
                      {r.clinic && <span className="block text-xs text-slate-500">{r.clinic}</span>}
                    </td>
                    <td className={tdRight}>{r.patients}</td>
                    <td className={tdRight}>{rupees(r.earned)}</td>
                    <td className={`${tdRight} text-green-700`}>{rupees(r.paid)}</td>
                    <td className={`${tdRight} font-semibold ${r.balance > 0 ? "text-red-600" : "text-slate-900"}`}>{rupees(r.balance)}</td>
                    <td className={td}><StatusPill value={r.status} /></td>
                    <td className="px-3 py-1">
                      <div className="flex items-center gap-1">
                        <button type="button" className="btn-icon border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 hover:text-green-800" title="Pay commission" aria-label={`Pay ${r.name}`} disabled={r.balance <= 0} onClick={() => setPaying(r)}>
                          <WalletIcon size={18} />
                        </button>
                        <Link href={`/accounts/doctors/${r._id}`} className="btn-icon border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700" title="View details" aria-label={`${r.name} details`}>
                          <ViewIcon size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card mt-3 px-3 py-2 empty:hidden">
            <Pagination page={page} total={rows.length} perPage={perPage} onPage={setPage} onPerPage={change(setPerPage)} />
          </div>
        </>
      )}

      {paying && (
        <PayModal
          doctor={paying}
          onClose={() => setPaying(null)}
          onDone={() => {
            setPaying(null);
            reload();
          }}
        />
      )}
    </>
  );
}
