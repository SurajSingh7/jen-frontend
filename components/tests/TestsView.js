"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusIcon } from "@/components/Icons";
import { ErrorBox, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { rupees } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

export default function TestsView() {
  const { data: tests, error, loading } = useLoad(() => api("/tests").then((d) => d.tests), "tests");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");

  const groups = [...new Set((tests ?? []).map((t) => t.group))];
  const q = search.trim().toLowerCase();
  const shown = (tests ?? []).filter((t) => (!group || t.group === group) && (!q || `${t.name} ${t.shortName}`.toLowerCase().includes(q)));

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Tests</h1>
        <Link href="/tests/new" className="btn-primary">
          <PlusIcon size={17} /> Add Test
        </Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_240px]">
        <input className="input" type="search" aria-label="Test search" placeholder="Search test" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" aria-label="Group filter" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <ErrorBox>{error}</ErrorBox>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="card mt-3 divide-y divide-slate-100">
          {shown.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No tests found.</p>}
          {shown.map((t) => (
            <Link key={t._id} href={`/tests/${t._id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="truncate text-[13px] text-slate-500">
                  {t.group} · {t.parameters.length} parameters
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-700">{rupees(t.mrp)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
