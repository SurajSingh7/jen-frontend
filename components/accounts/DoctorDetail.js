"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import PayModal from "./PayModal";
import { CalendarPick, Stat, td, tdRight, th, thRight } from "./parts";
import Pagination from "@/components/Pagination";
import { BalanceIcon, DoctorsIcon, ReceiptIcon, ResetIcon, TrashIcon, WalletIcon } from "@/components/Icons";
import { ConfirmModal, ErrorBox, FormHeader, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { rupees, showDate } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

export default function DoctorDetail({ id }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [paying, setPaying] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const params = new URLSearchParams({ from, to, page, limit: perPage }).toString();
  const { data, error, loading, reload } = useLoad(() => api(`/accounts/doctors/${id}?${params}`), params);

  const changeDate = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  async function removePayment() {
    setBusy(true);
    try {
      await api(`/accounts/payments/${removing._id}`, { method: "DELETE" });
      toast.success("Payment deleted");
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox>{error}</ErrorBox>;

  return (
    <div className="space-y-3">
      <FormHeader
        backHref="/accounts/doctors"
        icon={DoctorsIcon}
        title={data.doctor.name}
        action={
          <button type="button" className="btn-primary" disabled={data.balance <= 0} onClick={() => setPaying(true)}>
            Pay
          </button>
        }
      />

      <div className="card flex flex-wrap items-center justify-end gap-2.5 p-3">
        <CalendarPick label="From" value={from} onChange={changeDate(setFrom)} />
        <CalendarPick label="To" value={to} onChange={changeDate(setTo)} />
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setPage(1);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100"
          >
            <ResetIcon className="size-4" /> Reset
          </button>
        )}
      </div>

      <ErrorBox>{error}</ErrorBox>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon={ReceiptIcon} color="violet" label={`Commission Earned · ${data.range.patients} patients`} value={rupees(data.range.earned)} />
        <Stat icon={WalletIcon} color="green" label="Commission Paid" value={rupees(data.range.paid)} />
        <Stat icon={BalanceIcon} color="rose" label="Balance (all time)" value={rupees(data.balance)} />
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-100 px-3 py-2.5 text-sm font-bold text-slate-900">Commission Entries</h2>
          {data.entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No entries in these dates.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/60">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Lab No</th>
                    <th className={th}>Patient</th>
                    <th className={thRight}>Basic</th>
                    <th className={thRight}>%</th>
                    <th className={thRight}>Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.entries.map((r) => (
                    <tr key={r._id} className="transition hover:bg-slate-50/60">
                      <td className={td}>{showDate(r.date)}</td>
                      <td className={`${td} font-bold text-green-700`}>{r.labNo}</td>
                      <td className={`${td} font-medium text-slate-900`}>{r.patientInfo.name}</td>
                      <td className={tdRight}>{rupees(r.bill.basic)}</td>
                      <td className={tdRight}>{r.commission.percent}%</td>
                      <td className={`${tdRight} font-semibold text-slate-900`}>{rupees(r.commission.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-100 px-3 py-2.5 text-sm font-bold text-slate-900">Payments Given</h2>
          {data.payments.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No payments in these dates.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.payments.map((p) => (
                <li key={p._id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-green-700 tabular-nums">{rupees(p.amount)}</span>
                    <span className="block truncate text-xs text-slate-500">{[showDate(p.date), p.mode, p.note].filter(Boolean).join(" · ")}</span>
                  </span>
                  <button type="button" className="text-slate-400 transition hover:text-rose-600" title="Delete payment" aria-label={`Delete payment of ${rupees(p.amount)}`} onClick={() => setRemoving(p)}>
                    <TrashIcon className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="card px-3 py-2 empty:hidden">
        <Pagination
          page={data.page}
          total={data.total}
          perPage={perPage}
          onPage={setPage}
          onPerPage={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </div>

      {paying && (
        <PayModal
          doctor={{ _id: id, name: data.doctor.name, balance: data.balance }}
          onClose={() => setPaying(false)}
          onDone={() => {
            setPaying(false);
            reload();
          }}
        />
      )}
      {removing && <ConfirmModal title={`Delete payment of ${rupees(removing.amount)}?`} note="The doctor's balance will go up by this amount." busy={busy} onConfirm={removePayment} onClose={() => setRemoving(null)} />}
    </div>
  );
}
