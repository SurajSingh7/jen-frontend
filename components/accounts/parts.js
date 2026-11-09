import { CalendarIcon } from "@/components/Icons";
import { showDate } from "@/lib/format";

export const STATUS_TABS = [
  { key: "", label: "All", active: "border-slate-800 bg-slate-800 text-white", inactive: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" },
  { key: "Paid", label: "Paid", active: "border-green-600 bg-green-600 text-white", inactive: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
  { key: "Partial", label: "Partial", active: "border-amber-500 bg-amber-500 text-white", inactive: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { key: "Unpaid", label: "Unpaid", active: "border-rose-600 bg-rose-600 text-white", inactive: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" },
];

const STATUS_STYLES = {
  Paid: "bg-green-50 text-green-700 ring-green-200",
  Partial: "bg-amber-50 text-amber-700 ring-amber-200",
  Unpaid: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const PILL = "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset";

const RESULT_STYLES = {
  Complete: "bg-green-50 text-green-700 ring-green-200",
  Pending: "bg-orange-50 text-orange-700 ring-orange-200",
};

export const ResultPill = ({ value }) => <span className={`${PILL} ${RESULT_STYLES[value]}`}>{value}</span>;

export const paymentOf = ({ balance, received }) => (balance <= 0 ? "Paid" : received > 0 ? "Partial" : "Unpaid");

export const StatusPill = ({ value }) => <span className={`${PILL} ${STATUS_STYLES[value]}`}>{value}</span>;

export function StatusTabs({ value, counts, onChange, tabs = STATUS_TABS }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <button key={tab.label} type="button" aria-pressed={active} onClick={() => onChange(tab.key)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm transition ${active ? tab.active : tab.inactive}`}>
            {tab.label}
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/20 text-white" : "bg-white/80 text-slate-500"}`}>{counts?.[tab.key] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

// Just a calendar button until a date is picked; the invisible date input takes the click
export function CalendarPick({ label, value, onChange }) {
  return (
    <label title={`${label} date`} className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap shadow-sm transition ${value ? "border-green-300 bg-green-50 text-green-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
      <CalendarIcon className="size-4" />
      {value ? showDate(value) : label}
      <input className="absolute inset-0 cursor-pointer opacity-0" type="date" aria-label={`${label} date`} value={value} onChange={onChange} onClick={(e) => e.currentTarget.showPicker?.()} />
    </label>
  );
}

const STAT_COLORS = {
  blue: ["from-blue-50 border-blue-200", "bg-blue-600"],
  violet: ["from-violet-50 border-violet-200", "bg-violet-600"],
  green: ["from-green-50 border-green-200", "bg-green-600"],
  rose: ["from-rose-50 border-rose-200", "bg-rose-600"],
};

export function Stat({ icon: Icon, label, value, color }) {
  const [box, tile] = STAT_COLORS[color];
  return (
    <div className={`flex items-center gap-3 rounded-2xl border bg-linear-to-br to-white p-3 shadow-sm ${box}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${tile}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-600">{label}</p>
        <p className="truncate text-xl font-bold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export const th = "px-3 py-2.5 text-left text-xs font-bold tracking-wide whitespace-nowrap text-slate-600 uppercase";
export const thRight = `${th} text-right`;
export const td = "px-3 py-2 whitespace-nowrap";
export const tdRight = `${td} text-right tabular-nums`;
