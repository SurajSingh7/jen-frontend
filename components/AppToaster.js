"use client";

import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ top: 64 }}
      toastOptions={{
        duration: 3000,
        style: { fontSize: 14, fontWeight: 500, color: "#0f172a" },
        success: { iconTheme: { primary: "#15803d", secondary: "#ffffff" } },
        error: { duration: 4000 },
      }}
    />
  );
}
