"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { CloseIcon, DownIcon, PatientAddIcon, PlusIcon, ReceiptIcon, SaveIcon, SearchIcon, SendIcon, TestsIcon, TrashIcon, UpIcon, UserIcon, WalletIcon } from "@/components/Icons";
import { ConfirmModal, ErrorBox, Field, FormHeader, Loading } from "@/components/Ui";
import { api } from "@/lib/api";
import { AGE_TYPES, GENDERS, num, round2, rupees, today } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

const fromMaster = (t) => ({ testId: t._id, name: t.name, mrp: t.mrp, params: t.parameters.map((p) => ({ id: p._id, name: p.name })), selected: t.parameters.map((p) => p._id), open: false });

// A saved test keeps its saved price; parameters may also come from the current Tests list
function fromSaved(saved, master) {
  const params = saved.params.map((p) => ({ id: p.paramId, name: p.name }));
  for (const p of master?.parameters ?? []) if (!params.some((x) => x.id === p._id)) params.push({ id: p._id, name: p.name });
  return { testId: saved.test, name: saved.name, mrp: saved.mrp, params, selected: saved.params.map((p) => p.paramId), open: false };
}

function Form({ id, data }) {
  const router = useRouter();
  const { report, labNo, titles, doctors, tests, samples, settings } = data;
  const info = report?.patientInfo;

  const [form, setForm] = useState({
    labNo: report?.labNo ?? labNo,
    date: report?.date ?? today(),
    title: info?.title ?? "",
    name: info?.name ?? "",
    mobile: info?.mobile ?? "",
    age: info?.age ?? "",
    ageType: info?.ageType ?? "Years",
    gender: info?.gender ?? "Male",
    doctor: report?.doctor ?? "",
    sampleType: report?.sampleType ?? "",
  });
  const [picked, setPicked] = useState(() => (report?.tests ?? []).map((t) => fromSaved(t, tests.find((m) => m._id === t.test))).reverse());
  const searchRef = useRef(null);
  const [search, setSearch] = useState("");
  const [extra, setExtra] = useState(report?.bill.extra || "");
  const [extraNote, setExtraNote] = useState(report?.bill.extraNote || "Home service charge");
  const [summaryTab, setSummaryTab] = useState("bill");
  const savedDiscount = (amount) => ({ mode: "amount", value: amount || "" });
  const [selfDiscount, setSelfDiscount] = useState(() => savedDiscount(report && !report.doctor ? report.bill.discountAmount : 0));
  const [doctorDiscount, setDoctorDiscount] = useState(() => savedDiscount(report?.bill.doctorDiscount));
  const [labDiscount, setLabDiscount] = useState(() => savedDiscount(report?.doctor ? report.bill.labDiscount : 0));
  const [received, setReceived] = useState(report ? report.bill.received : null); // null = follows Net
  const [percent, setPercent] = useState(report?.commission.percent ?? 0);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  // A title with a fixed gender locks the Gender box; a "Manual" title leaves it open
  const titleGender = titles.find((t) => t.name === form.title)?.gender;
  const genderLocked = Boolean(titleGender) && form.gender === titleGender;

  // Title decides the gender; a "Manual" title leaves it alone
  function chooseTitle(title) {
    const gender = titles.find((t) => t.name === title)?.gender;
    setForm({ ...form, title, ...(gender ? { gender } : {}) });
  }

  function chooseDoctor(value) {
    setForm((f) => ({ ...f, doctor: value }));
    const doctor = doctors.find((d) => d._id === value);
    setPercent(doctor?.commissionPercent ?? 0);
  }

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return tests.filter((t) => `${t.name} ${t.shortName}`.toLowerCase().includes(q) && !picked.some((p) => p.testId === t._id));
  }, [search, tests, picked]);

  function addTest(test) {
    setPicked([fromMaster(test), ...picked]);
    setSearch("");
    searchRef.current?.focus();
  }
  const updatePicked = (testId, change) => setPicked(picked.map((p) => (p.testId === testId ? { ...p, ...change(p) } : p)));
  const toggleParam = (testId, paramId) => updatePicked(testId, (p) => ({ selected: p.selected.includes(paramId) ? p.selected.filter((x) => x !== paramId) : [...p.selected, paramId] }));

  // Bill
  const basic = round2(picked.reduce((sum, p) => sum + num(p.mrp), 0));
  // Extra charge only counts once a test has been chosen
  const extraAmount = basic > 0 ? num(extra) : 0;
  const gross = round2(basic + extraAmount);
  const hasDoctor = Boolean(form.doctor);
  const extraLabel = extraNote.trim() || "Extra Charge";
  const discountBase = settings.discountBase;
  const selfBase = discountBase === "basic_extra" ? gross : basic;
  const self = resolveDiscount(selfDiscount, selfBase);

  // Doctor: the commission base comes from Settings; each side's discount comes out of its own share
  const commissionOnExtra = settings.commissionBase === "basic_extra";
  const doctorShare = hasDoctor ? round2(((commissionOnExtra ? gross : basic) * Math.min(num(percent), 100)) / 100) : 0;
  const labShare = round2(gross - doctorShare);
  const fromDoctor = resolveDiscount(doctorDiscount, doctorShare);
  const fromLab = resolveDiscount(labDiscount, labShare);
  const totalDiscount = hasDoctor ? round2(fromDoctor.amount + fromLab.amount) : self.amount;
  const net = round2(gross - totalDiscount);
  const receivedValue = received === null ? net : received === "" ? "" : Math.min(num(received), net);
  const balance = round2(net - num(receivedValue));

  function changeReceived(value) {
    if (value === "") return setReceived("");
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return;
    if (amount > net) {
      toast.error(`Received cannot be more than ${rupees(net)}`, { id: "received-limit" });
      return setReceived(net);
    }
    setReceived(value);
  }

  async function save(next) {
    if (form.mobile && form.mobile !== info?.mobile && !/^[6-9]\d{9}$/.test(form.mobile)) {
      toast.error("Enter a valid 10 digit mobile number");
      return;
    }
    if (!picked.length) {
      toast.error("Select at least one test");
      return;
    }
    setBusy(true);
    try {
      const body = {
        date: form.date,
        patient: { title: form.title, name: form.name, mobile: form.mobile, age: form.age === "" ? NaN : form.age, ageType: form.ageType, gender: form.gender },
        doctor: form.doctor || null,
        sampleType: form.sampleType,
        tests: [...picked].reverse().map((p) => ({ testId: p.testId, paramIds: p.selected })),
        bill: { extra: extraAmount, extraNote, discount: self.amount, doctorDiscount: fromDoctor.amount, labDiscount: fromLab.amount, received: receivedValue },
        commission: { percent },
      };
      const { report: saved } = await (id ? api(`/reports/${id}`, { method: "PATCH", body }) : api("/reports", { method: "POST", body }));
      toast.success(id ? "Patient updated" : "Patient added");
      router.push(next === "bill" ? `/patients/${saved._id}/bill` : "/patients");
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/reports/${id}`, { method: "DELETE" });
      toast.success("Entry deleted");
      router.push("/patients");
    } catch (err) {
      toast.error(err.message);
      setRemoving(false);
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="mx-auto max-w-5xl space-y-3">
      <FormHeader backHref="/patients" icon={PatientAddIcon} title={id ? "Edit Patient Details" : "New Patient Registration"} />

      <section className="card grid grid-cols-2 gap-x-3 gap-y-2 p-3 lg:grid-cols-6">
        <h2 className="col-span-2 flex items-center gap-2 text-sm font-bold text-slate-900 lg:col-span-6"><UserIcon className="size-4 text-green-700" /> Patient Details</h2>
        <Field label="Lab No" id="labNo" required locked>
          <input id="labNo" className="input font-semibold" readOnly disabled value={form.labNo} />
        </Field>
        <Field label="Date" id="date" required>
          <input id="date" className="input" type="date" required value={form.date} onChange={set("date")} />
        </Field>
        <Field label="Title" id="title">
          <SearchableSelect id="title" value={form.title} onChange={chooseTitle} options={[{ value: "", label: "None" }, ...titles.map((t) => ({ value: t.name, label: t.name }))]} />
        </Field>
        <Field label="Patient name" id="name" required className="col-span-2 lg:col-span-2">
          <input id="name" className="input" required maxLength={100} autoFocus={!id} value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Mobile" id="mobile">
          <input id="mobile" className="input" inputMode="numeric" maxLength={10} placeholder="10 digit number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} />
        </Field>
        <Field label="Age" id="age" required>
          <input id="age" className="input" type="number" min="0" max="150" required value={form.age} onChange={set("age")} />
        </Field>
        <Field label="Age type" id="ageType" required>
          <select id="ageType" className="input" value={form.ageType} onChange={set("ageType")}>
            {AGE_TYPES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Gender" id="gender" required locked={genderLocked}>
          <select id="gender" className="input" disabled={genderLocked} value={form.gender} onChange={set("gender")}>
            {GENDERS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Sample" id="sampleType">
          <SearchableSelect
            id="sampleType"
            value={form.sampleType}
            onChange={(sampleType) => setForm({ ...form, sampleType })}
            options={[{ value: "", label: "None" }, ...[...(form.sampleType && !samples.includes(form.sampleType) ? [form.sampleType] : []), ...samples].map((s) => ({ value: s, label: s }))]}
          />
        </Field>
        <Field label="Doctor" id="doctor" className="col-span-2">
          <SearchableSelect
            id="doctor"
            value={form.doctor}
            onChange={chooseDoctor}
            options={[
              { value: "", label: "Self" },
              ...doctors.filter((d) => d.active || d._id === form.doctor).map((d) => ({ value: d._id, label: d.name, hint: [d.clinic, d.phone].filter(Boolean).join(" · ") })),
            ]}
          />
        </Field>
      </section>

      <section className="card overflow-hidden">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-slate-100">
          {/* Left: find a test */}
          <div className="p-3">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
              <SearchIcon className="size-4 text-green-700" /> Search Tests <span className="text-rose-500">*</span>
            </h2>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                className="input pl-9"
                type="search"
                aria-label="Test search"
                placeholder="Search test, press Enter to add"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (search.trim() && matches[0]) addTest(matches[0]);
                }}
              />
            </div>
            <ul className="mt-2 h-64 space-y-1 overflow-y-auto pr-1">
              {matches.length === 0 && <li className="py-8 text-center text-sm text-slate-400">{search.trim() ? "No tests found." : "Type a test name to see suggestions."}</li>}
              {matches.map((t) => (
                <li key={t._id}>
                  <button type="button" className="group flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-1.5 text-left transition hover:border-green-300 hover:bg-green-50" onClick={() => addTest(t)}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{t.name}</span>
                      <span className="block truncate text-xs text-slate-400">{t.group}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-700">{rupees(t.mrp)}</span>
                    <PlusIcon className="size-4 shrink-0 text-slate-400 transition group-hover:text-green-700" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: what is selected, newest on top */}
          <div className="border-t border-slate-100 p-3 md:border-t-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <TestsIcon className="size-4 text-green-700" /> Selected Tests
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 tabular-nums">{picked.length}</span>
              </h2>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{rupees(basic)}</span>
            </div>
            <div className="h-[18.5rem] overflow-y-auto pr-1">
              {picked.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center">
                  <TestsIcon className="size-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">No tests selected</p>
                  <p className="text-sm text-slate-400">Search and add tests from the left.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {picked.map((p) => (
                    <li key={p.testId} className="rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-900">{p.name}</span>
                          <span className="block text-xs text-slate-400">{p.selected.length} of {p.params.length} parameters</span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-slate-700">{rupees(p.mrp)}</span>
                        <button type="button" title="Choose parameters" className="text-slate-400 transition hover:text-green-700" aria-label={`${p.name} parameters`} aria-expanded={p.open} onClick={() => updatePicked(p.testId, (x) => ({ open: !x.open }))}>
                          {p.open ? <UpIcon className="size-4" /> : <DownIcon className="size-4" />}
                        </button>
                        <button type="button" title="Remove test" className="text-slate-400 transition hover:text-rose-600" aria-label={`Remove ${p.name}`} onClick={() => setPicked(picked.filter((x) => x.testId !== p.testId))}>
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                      {p.open && (
                        <div className="grid gap-x-3 rounded-b-lg border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 sm:grid-cols-2">
                          {p.params.map((param) => (
                            <label key={param.id} className="flex min-h-7 items-center gap-2 text-xs text-slate-700">
                              <input type="checkbox" className="size-3.5 accent-brand-600" checked={p.selected.includes(param.id)} onChange={() => toggleParam(p.testId, param.id)} /> {param.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1fr)_24rem] md:divide-x md:divide-slate-100">
          {/* Left: what is typed */}
          <div className="space-y-3 p-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><WalletIcon className="size-4 text-green-700" /> Payment Details</h2>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="sm:w-28 sm:shrink-0">
                <p className="label">Basic Amount</p>
                <p className="py-1.5 text-sm font-semibold text-slate-900">{rupees(basic)}</p>
              </div>
              <Field label="Extra charge note" id="extraNote" className="sm:min-w-0 sm:flex-1">
                <input id="extraNote" className="input" maxLength={60} disabled={basic <= 0} value={extraNote} onChange={(e) => setExtraNote(e.target.value)} />
              </Field>
              <Field label="Extra charge" id="extra" className="sm:w-32 sm:shrink-0">
                <input id="extra" className="input" aria-label="Extra charge" type="number" min="0" step="any" disabled={basic <= 0} placeholder={basic > 0 ? "0" : "Add a test first"} value={basic > 0 ? extra : ""} onChange={(e) => Number(e.target.value) >= 0 && setExtra(e.target.value)} />
              </Field>
              {hasDoctor && (
                <div className="sm:shrink-0">
                  <p className="label">Doctor Commission</p>
                  <p className="py-1.5 text-sm font-semibold text-slate-900">{num(percent)}% <span className="font-normal text-slate-500">on {commissionOnExtra ? "Basic + Extra" : "Basic"}</span></p>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
              <div className={`${BILL_COLUMNS} bg-slate-50/60 text-xs font-bold tracking-wide text-slate-600 uppercase`}>
                <span />
                <span>{hasDoctor ? "Share" : "Amount"}</span>
                <span>{hasDoctor ? "Discount" : `Discount (on ${discountBase === "basic_extra" ? "Basic + Extra" : "Basic"})`}</span>
                <span className="text-right">{hasDoctor ? "Gets" : "Patient pays"}</span>
              </div>
              {hasDoctor ? (
                <>
                  <div className={`${BILL_COLUMNS} border-t border-slate-100`}>
                    <span className="font-medium text-slate-900">Doctor</span>
                    <span className="tabular-nums">{rupees(doctorShare)}</span>
                    <DiscountCell label="Doctor Discount" discount={doctorDiscount} amount={fromDoctor.amount} max={doctorShare} onChange={setDoctorDiscount} />
                    <span className="text-right font-semibold tabular-nums text-green-700">{rupees(round2(doctorShare - fromDoctor.amount))}</span>
                  </div>
                  <div className={`${BILL_COLUMNS} border-t border-slate-100`}>
                    <span className="font-medium text-slate-900">Lab</span>
                    <span className="tabular-nums">{rupees(labShare)}</span>
                    <DiscountCell label="Lab Discount" discount={labDiscount} amount={fromLab.amount} max={labShare} onChange={setLabDiscount} />
                    <span className="text-right font-semibold tabular-nums text-green-700">{rupees(round2(labShare - fromLab.amount))}</span>
                  </div>
                  <div className={`${BILL_COLUMNS} border-t border-slate-200 bg-slate-50/60 font-semibold text-slate-900`}>
                    <span>Total</span>
                    <span className="tabular-nums">{rupees(gross)}</span>
                    <span className="tabular-nums">{rupees(totalDiscount)}</span>
                    <span className="text-right tabular-nums">{rupees(net)}</span>
                  </div>
                </>
              ) : (
                <div className={`${BILL_COLUMNS} border-t border-slate-100`}>
                  <span className="font-medium text-slate-900">Lab</span>
                  <span className="tabular-nums">{rupees(gross)}</span>
                  <DiscountCell label="Discount" discount={selfDiscount} amount={self.amount} max={selfBase} onChange={setSelfDiscount} />
                  <span className="text-right font-semibold tabular-nums text-green-700">{rupees(net)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="label">Patient pays</p>
                <p className="py-1.5 text-sm font-semibold text-slate-900">{rupees(net)}</p>
              </div>
              <Field label="Received" id="received">
                <input id="received" className="input" aria-label="Received" type="number" min="0" step="any" value={receivedValue} onChange={(e) => changeReceived(e.target.value)} onBlur={() => received === "" && setReceived(null)} />
              </Field>
              <div>
                <p className="label">Balance</p>
                <p className={`py-1.5 text-sm font-semibold ${balance > 0 ? "text-red-600" : "text-slate-900"}`}>{rupees(balance)}</p>
              </div>
            </div>
          </div>

          {/* Right: the bill, read like a receipt */}
          <div className="border-t border-slate-100 bg-slate-50/60 p-3 md:border-t-0">
            <div role="tablist" className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-0.5">
              {[["bill", "Bill Summary"], ["customer", "Customer Summary"]].map(([tab, name]) => (
                <button key={tab} type="button" role="tab" aria-selected={summaryTab === tab} onClick={() => setSummaryTab(tab)} className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold transition ${summaryTab === tab ? "bg-white text-green-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                  {tab === "bill" ? <ReceiptIcon className="size-3.5" /> : <UserIcon className="size-3.5" />} {name}
                </button>
              ))}
            </div>
            {summaryTab === "customer" ? (
              <div className="space-y-2">
                <ul className="max-h-32 space-y-1 overflow-y-auto border-b border-slate-200 pb-1.5 text-sm">
                  {picked.length === 0 && <li className="text-center text-slate-400">No tests selected</li>}
                  {[...picked].reverse().map((p) => (
                    <li key={p.testId} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-slate-600">{p.name}</span>
                      <span className="tabular-nums text-slate-900">{rupees(p.mrp)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-1 text-sm">
                  {extraAmount > 0 && <SummaryRow label={extraLabel} value={rupees(extraAmount)} />}
                  <SummaryRow label="Total" value={rupees(gross)} strong />
                  {totalDiscount > 0 && <SummaryRow label="Discount" value={minus(totalDiscount)} />}
                  <div className="border-t border-slate-200 pt-1">
                    <SummaryRow label="Amount Payable" value={rupees(net)} strong large />
                  </div>
                  <SummaryRow label="Received" value={rupees(receivedValue)} />
                  <SummaryRow label="Balance" value={rupees(balance)} strong tone={balance > 0 ? "text-red-600" : "text-green-700"} />
                </dl>
                <button type="button" className="btn-primary w-full" disabled={busy} onClick={(e) => e.currentTarget.form.reportValidity() && save("bill")}>
                  <SendIcon className="size-4" /> {busy ? "Saving…" : "Save & Open PDF"}
                </button>
              </div>
            ) : (
            <dl className="space-y-1 text-sm">
              <SummaryRow label="Basic Amount" value={rupees(basic)} />
              <SummaryRow label={extraLabel} value={rupees(extraAmount)} />
              <div className="border-t border-slate-200 pt-1">
                <SummaryRow label="Total" value={rupees(gross)} strong />
              </div>
              {hasDoctor ? (
                <>
                  <SummaryRow label="Doctor Discount" value={minus(fromDoctor.amount)} />
                  <SummaryRow label="Lab Discount" value={minus(fromLab.amount)} />
                </>
              ) : (
                <SummaryRow label="Discount" value={minus(self.amount)} />
              )}
              <div className="border-t border-slate-200 pt-1">
                <SummaryRow label="Patient Pays" value={rupees(net)} strong large />
              </div>
              <SummaryRow label="Received" value={rupees(receivedValue)} />
              <SummaryRow label="Balance" value={rupees(balance)} strong tone={balance > 0 ? "text-red-600" : "text-green-700"} />
              {hasDoctor && (
                <>
                  <p className="border-t border-dashed border-slate-300 pt-1.5 text-center text-xs text-slate-400">Admin only</p>
                  <SummaryRow label="Doctor Gets" value={rupees(round2(doctorShare - fromDoctor.amount))} strong tone="text-green-700" />
                  <SummaryRow label="Lab Gets" value={rupees(round2(labShare - fromLab.amount))} strong tone="text-green-700" />
                </>
              )}
            </dl>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {id && (
          <button type="button" className="btn-danger-solid" disabled={busy} onClick={() => setRemoving(true)}>
            <TrashIcon className="size-4" /> Delete
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/patients" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={busy}>
            <SaveIcon className="size-4" /> {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      </div>

      {removing && <ConfirmModal title={`Delete Lab No ${form.labNo}?`} note="This entry and its results will be permanently deleted." busy={busy} onConfirm={remove} onClose={() => setRemoving(false)} />}
    </form>
  );
}

const BILL_COLUMNS = "grid grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-3 px-3 py-2";

const minus = (amount) => (amount ? `− ${rupees(amount)}` : rupees(0));

function SummaryRow({ label, value, strong = false, large = false, tone = "text-slate-900" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>{label}</dt>
      <dd className={`tabular-nums ${large ? "text-base" : ""} ${strong ? "font-semibold" : ""} ${tone}`}>{value}</dd>
    </div>
  );
}

// A discount typed as % or ₹, never more than the amount it comes out of
function resolveDiscount(discount, base) {
  const amount = Math.min(discount.mode === "percent" ? round2((base * num(discount.value)) / 100) : num(discount.value), base);
  return { amount };
}

// Hidden behind an "Add" button until needed; one amount box with a ₹ / % choice
function DiscountCell({ label, discount, amount, max, onChange }) {
  const [open, setOpen] = useState(Boolean(discount.value));

  if (!open) {
    return (
      <button type="button" className="inline-flex items-center gap-1 justify-self-start text-xs font-semibold text-green-700 hover:text-green-600" onClick={() => setOpen(true)}>
        <PlusIcon className="size-3.5" /> Add {label}
      </button>
    );
  }

  // Never allows more than the share it comes out of
  function changeValue(raw) {
    if (raw === "") return onChange({ ...discount, value: "" });
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return;
    const percent = discount.mode === "percent";
    const limit = percent ? 100 : max;
    if (value > limit) {
      toast.error(`${label} cannot be more than ${percent ? "100%" : rupees(max)}`, { id: "discount-limit" });
      return onChange({ ...discount, value: limit });
    }
    onChange({ ...discount, value: raw });
  }

  const shownValue = discount.mode === "amount" && num(discount.value) > max ? max : discount.value;

  function remove() {
    onChange({ mode: "amount", value: "" });
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <div className="flex min-w-0 flex-1">
          <input className="input min-w-0 rounded-r-none" aria-label={label} placeholder="0" type="number" min="0" step="any" autoFocus value={shownValue} onChange={(e) => changeValue(e.target.value)} />
          <select className="input w-14 shrink-0 rounded-l-none border-l-0 px-1.5" aria-label={`${label} type`} value={discount.mode} onChange={(e) => onChange({ mode: e.target.value, value: "" })}>
            <option value="amount">₹</option>
            <option value="percent">%</option>
          </select>
        </div>
        <button type="button" className="shrink-0 text-slate-400 transition hover:text-rose-600" aria-label={`Remove ${label}`} onClick={remove}>
          <CloseIcon className="size-4" />
        </button>
      </div>
      {discount.mode === "percent" && <p className="mt-0.5 text-xs text-slate-500">= {rupees(amount)}</p>}
    </div>
  );
}

export default function PatientForm({ id }) {
  const { data, error, loading } = useLoad(async () => {
    const [titles, doctors, tests, samples, settings, report, next] = await Promise.all([
      api("/titles"),
      api("/doctors"),
      api("/tests"),
      api("/masters/sample"),
      api("/settings"),
      id ? api(`/reports/${id}`) : null,
      id ? null : api("/reports/next-lab-no"),
    ]);
    return { titles: titles.titles, doctors: doctors.doctors, tests: tests.tests, samples: samples.items.map((s) => s.name), settings: settings.settings, report: report?.report, labNo: next?.labNo };
  }, id ?? "new");

  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  return <Form id={id} data={data} />;
}
