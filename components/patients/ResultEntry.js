"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorBox, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { ageText, flagFor } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

function Form({ report }) {
  const router = useRouter();
  const [values, setValues] = useState(() => Object.fromEntries(report.tests.flatMap((t) => t.params.filter((p) => p.type !== "heading").map((p) => [p.paramId, p.result]))));
  const [busy, setBusy] = useState(false);
  const info = report.patientInfo;
  let index = 0;

  // Enter jumps to the next result box
  function onKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    document.querySelector(`[data-result="${Number(e.currentTarget.dataset.result) + 1}"]`)?.focus();
  }

  async function save(next) {
    setBusy(true);
    try {
      const results = Object.entries(values).map(([paramId, value]) => ({ paramId, value }));
      await api(`/reports/${report._id}/results`, { method: "PATCH", body: { results } });
      toast.success("Results saved");
      router.push(next === "pdf" ? `/patients/${report._id}/report` : "/patients");
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{report.resultsSaved ? "Modify Result" : "Result"}</h1>
          <p className="mt-0.5 truncate text-sm text-slate-600">
            {info.name} | {ageText(info)} | {info.gender} | Lab No {report.labNo}
          </p>
        </div>
        <Link href="/patients" className="btn-secondary">Back</Link>
      </div>

      {report.tests.map((test) => (
        <section key={test.test} className="card overflow-hidden">
          <h2 className="bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-900">{test.name}</h2>
          <div className="divide-y divide-slate-100">
            {test.params.map((p) => {
              if (p.type === "heading") return <p key={p.paramId} className="px-4 py-2 text-sm font-semibold text-slate-900">{p.name}</p>;
              const flag = flagFor(values[p.paramId], p.min, p.max);
              const position = index++;
              return (
                <div key={p.paramId} className="grid grid-cols-[1fr_110px] items-center gap-x-3 px-4 py-1.5 sm:grid-cols-[1fr_140px_30px_140px_80px]">
                  <label htmlFor={p.paramId} className={`text-sm text-slate-800 ${p.bold ? "font-semibold" : ""}`}>{p.name}</label>
                  <input
                    id={p.paramId}
                    data-result={position}
                    className={`input ${flag ? "border-red-400 font-semibold text-red-600" : ""}`}
                    autoFocus={position === 0}
                    enterKeyHint="next"
                    value={values[p.paramId]}
                    onChange={(e) => setValues({ ...values, [p.paramId]: e.target.value })}
                    onKeyDown={onKeyDown}
                  />
                  <span className="hidden text-center font-semibold text-red-600 sm:block">{flag === "H" ? "↑" : flag === "L" ? "↓" : ""}</span>
                  <span className="col-span-2 text-xs text-slate-500 sm:col-span-1 sm:text-sm">
                    <span className="font-semibold text-red-600 sm:hidden">{flag === "H" ? "↑ " : flag === "L" ? "↓ " : ""}</span>
                    {p.rangeText}
                  </span>
                  <span className="hidden text-sm text-slate-500 sm:block">{p.unit}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => save("list")}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => save("pdf")}>Save &amp; PDF</button>
      </div>
    </div>
  );
}

export default function ResultEntry({ id }) {
  const { data, error, loading } = useLoad(() => api(`/reports/${id}`).then((d) => d.report), id);
  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  return <Form report={data} />;
}
