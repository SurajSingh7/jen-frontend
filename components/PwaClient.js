"use client";

import { useEffect, useSyncExternalStore } from "react";

const subscribe = (cb) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

// Registers the service worker (production only) and shows a banner while the device is offline
export default function PwaClient() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);

  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 bg-amber-400 px-4 pb-2 text-center text-sm font-medium text-black" style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }}>
      You are offline. An internet connection is needed to save.
    </div>
  );
}
