import { Suspense } from "react";
import SettingsView from "@/components/settings/SettingsView";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={null}>
        <SettingsView />
      </Suspense>
    </div>
  );
}
