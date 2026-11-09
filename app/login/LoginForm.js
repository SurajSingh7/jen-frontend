"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import { LockIcon, UserIcon } from "@/components/Icons";
import { api } from "@/lib/api";

const fieldCls = "w-full rounded-lg border border-gray-300 py-3 pl-10 text-base outline-none focus:border-transparent focus:ring-2 focus:ring-green-600";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/auth/login", { method: "POST", body: { username, password } });
      // Full load so the proxy sees the new cookie
      window.location.href = "/patients";
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-medium text-black">
          Username <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input id="username" name="username" autoComplete="username" autoCapitalize="none" autoFocus required value={username} onChange={(e) => setUsername(e.target.value)} className={`${fieldCls} pr-4`} />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-black">
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${fieldCls} pr-16`} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-3 text-base font-semibold text-white transition hover:bg-green-800 disabled:opacity-50">
        {busy && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {busy ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
