"use client";

import { useEffect } from "react";

// Bottom sheet on phones, centered dialog on larger screens. Esc or a click outside closes it.
export default function Modal({ title, onClose, children, width = "sm:max-w-sm" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full animate-pop-in rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-2xl ${width}`} style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
        <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
