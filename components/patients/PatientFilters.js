"use client";

import { useEffect, useState } from "react";
import { CalendarPick, StatusTabs } from "@/components/accounts/parts";
import SearchableSelect from "@/components/SearchableSelect";
import { ResetIcon, SearchIcon } from "@/components/Icons";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

const RESULT_TABS = [
  { key: "", label: "All", active: "border-slate-800 bg-slate-800 text-white", inactive: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" },
  { key: "Pending", label: "Pending", active: "border-orange-500 bg-orange-500 text-white", inactive: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100" },
  { key: "Complete", label: "Complete", active: "border-green-600 bg-green-600 text-white", inactive: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
];

const EMPTY = { from: "", to: "", status: "", payment: "", doctor: "", test: "" };

// Filter state for the /reports list; `params` is the query string to load with
export function usePatientFilters() {
  const [values, setValues] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Wait for a pause in typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setPage(1);
  };

  function reset() {
    setValues(EMPTY);
    setSearch("");
    setPage(1);
  }

  function changePerPage(value) {
    setPerPage(value);
    setPage(1);
  }

  const params = new URLSearchParams({ ...values, q, page, limit: perPage }).toString();
  const filtered = Boolean(search) || Object.values(values).some(Boolean);
  return { values, search, setSearch, set, reset, filtered, params, perPage, setPage, changePerPage };
}

// `paymentTabs` swaps them: payment becomes the tabs and result becomes the dropdown
export default function PatientFilters({ filters, data, paymentTabs = false, afterDates = null }) {
  const { values, search, setSearch, set, reset, filtered } = filters;
  const { data: lists } = useLoad(async () => {
    const [d, t] = await Promise.all([api("/doctors"), api("/tests")]);
    return { doctors: d.doctors, tests: t.tests };
  }, "lists");
  const fromInput = (key) => (e) => set(key)(e.target.value);
  const tabCounts = paymentTabs ? data?.payment : data?.result;
  const counts = tabCounts && { "": Object.values(tabCounts).reduce((sum, n) => sum + n, 0), ...tabCounts };

  return (
    <>
      <div className="card mt-3 p-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <div className="relative col-span-2">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" type="search" aria-label="Patient search" placeholder="Search Lab No, name or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SearchableSelect
            id="doctorFilter"
            value={values.doctor}
            onChange={set("doctor")}
            options={[{ value: "", label: "All doctors" }, { value: "self", label: "Self" }, ...(lists?.doctors ?? []).map((d) => ({ value: d._id, label: d.name }))]}
          />
          <SearchableSelect id="testFilter" value={values.test} onChange={set("test")} options={[{ value: "", label: "All tests" }, ...(lists?.tests ?? []).map((t) => ({ value: t._id, label: t.name }))]} />
          {paymentTabs ? (
            <select className="input col-span-2 lg:col-span-1" aria-label="Result filter" value={values.status} onChange={fromInput("status")}>
              <option value="">All results</option>
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
            </select>
          ) : (
            <select className="input col-span-2 lg:col-span-1" aria-label="Payment filter" value={values.payment} onChange={fromInput("payment")}>
              <option value="">All payments</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          )}
        </div>
      </div>

      <div className="card mt-3 flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        {paymentTabs ? <StatusTabs value={values.payment} counts={counts} onChange={set("payment")} /> : <StatusTabs tabs={RESULT_TABS} value={values.status} counts={counts} onChange={set("status")} />}
        <div className="flex flex-wrap items-center gap-2.5">
          <CalendarPick label="From" value={values.from} onChange={fromInput("from")} />
          <CalendarPick label="To" value={values.to} onChange={fromInput("to")} />
          {afterDates}
          {filtered && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100">
              <ResetIcon className="size-4" /> Reset
            </button>
          )}
        </div>
      </div>
    </>
  );
}
