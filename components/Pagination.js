"use client";

import { NextIcon, PrevIcon } from "./Icons";

const PAGE_SIZES = [10, 25, 50, 75, 100];
const MAX_BUTTONS = 10;

function pageNumbers(current, total) {
  if (total <= MAX_BUTTONS) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(MAX_BUTTONS / 2));
  let end = start + MAX_BUTTONS - 1;
  if (end > total) {
    end = total;
    start = end - MAX_BUTTONS + 1;
  }
  const pages = [];
  if (start > 1) pages.push(1, ...(start > 2 ? ["..."] : []));
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total) pages.push(...(end < total - 1 ? ["..."] : []), total);
  return pages;
}

const EDGE_BUTTON = "inline-flex items-center border border-slate-300 bg-white px-2 py-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300";

export default function Pagination({ page, total, perPage, onPage, onPerPage }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1 && total <= PAGE_SIZES[0]) return null;

  const perPageSelect = (
    <label className="flex items-center gap-1.5 text-sm whitespace-nowrap text-slate-500">
      Rows per page:
      <select className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700" value={perPage} onChange={(e) => onPerPage(Number(e.target.value))}>
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Phone */}
      <div className="flex flex-1 flex-col gap-3 sm:hidden">
        {perPageSelect}
        <div className="flex justify-between">
          <button type="button" className="btn-secondary" disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</button>
          <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden flex-1 items-center justify-between gap-4 sm:flex">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-700">
            Showing <span className="font-medium">{Math.min((page - 1) * perPage + 1, total)}</span> to <span className="font-medium">{Math.min(page * perPage, total)}</span> of <span className="font-medium">{total}</span> results
          </p>
          {perPageSelect}
        </div>

        {pages > 1 && (
          <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button type="button" aria-label="Previous page" className={`${EDGE_BUTTON} rounded-l-md`} disabled={page === 1} onClick={() => onPage(page - 1)}>
              <PrevIcon className="size-5" />
            </button>
            {pageNumbers(page, pages).map((n, i) => (
              <button key={i} type="button" disabled={n === "..."} aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)} className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${n === page ? "z-10 border-green-600 bg-green-50 text-green-700" : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"} ${n === "..." ? "cursor-default" : "cursor-pointer"}`}>
                {n}
              </button>
            ))}
            <button type="button" aria-label="Next page" className={`${EDGE_BUTTON} rounded-r-md`} disabled={page >= pages} onClick={() => onPage(page + 1)}>
              <NextIcon className="size-5" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
