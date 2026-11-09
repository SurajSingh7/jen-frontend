"use client";

import { useEffect, useRef, useState } from "react";
import { DownIcon, SearchIcon } from "./Icons";

// A dropdown with a search box. options: [{ value, label, hint? }]
export default function SearchableSelect({ id, value, options, onChange, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const q = query.trim().toLowerCase();
  const shown = options.filter((o) => !q || `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q));
  const selected = options.find((o) => o.value === value);

  function toggle() {
    setQuery("");
    setActive(0);
    setOpen(!open);
  }

  function choose(option) {
    onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault(); // must not submit the form
      if (shown[active]) choose(shown[active]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" id={id} aria-haspopup="listbox" aria-expanded={open} onClick={toggle} className="input flex items-center justify-between gap-2 text-left">
        <span className={`truncate ${selected ? "" : "text-slate-400"}`}>{selected?.label ?? placeholder}</span>
        <DownIcon className={`size-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lift">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              className="input py-1 pl-8"
              type="search"
              aria-label="Search list"
              placeholder="Search"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
            />
          </div>
          <ul role="listbox" className="mt-1 max-h-56 overflow-y-auto">
            {shown.length === 0 && <li className="px-2.5 py-3 text-center text-sm text-slate-400">No results found.</li>}
            {shown.map((option, i) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button type="button" onClick={() => choose(option)} onMouseEnter={() => setActive(i)} className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm ${i === active ? "bg-green-50" : ""} ${option.value === value ? "font-semibold text-green-800" : "text-slate-800"}`}>
                  <span className="block truncate">{option.label}</span>
                  {option.hint && <span className="block truncate text-xs font-normal text-slate-400">{option.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
