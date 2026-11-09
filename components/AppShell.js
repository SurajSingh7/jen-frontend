"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import { DownIcon, LogoutIcon, UserIcon } from "./Icons";
import { api } from "@/lib/api";

async function logout() {
  await api("/auth/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/login";
}

function Profile() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-300 hover:bg-gray-700">
        <UserIcon size={18} />
        <span className="hidden sm:inline">Admin</span>
        <DownIcon size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-[11px] w-36 rounded-md bg-gray-800 py-1 shadow-lg">
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-gray-700">
            <LogoutIcon size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="h-14 print:hidden" />
      <header className="fixed top-0 left-0 z-50 w-full bg-gray-800 text-white shadow print:hidden">
        <div className="flex h-14 items-center justify-between p-4">
          <Link href="/patients" className="text-lg font-bold transition hover:text-green-300">
            Jen Pathology
          </Link>
          <div className="flex items-center space-x-4">
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <Profile />
          </div>
        </div>
      </header>

      <main className="w-full flex-1 bg-slate-50/60 p-3 text-slate-700 sm:p-4 print:bg-white print:p-0">{children}</main>
    </div>
  );
}
