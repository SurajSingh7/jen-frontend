"use client";

import { useSearchParams } from "next/navigation";
import TitlesSettings from "./TitlesSettings";
import MasterList from "./MasterList";
import LabSettings from "./LabSettings";
import { SETTINGS_SECTIONS } from "@/lib/settingsMenu";

const ENTRIES = SETTINGS_SECTIONS.flatMap((section) => section.items.map((item) => ({ ...item, section: section.name })));

export default function SettingsView() {
  const requested = useSearchParams().get("tab");
  const current = ENTRIES.find((e) => e.tab === requested) ?? ENTRIES[0];
  const { tab } = current;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{current.name}</h1>
        <p className="mt-0.5 text-sm text-slate-500">Settings / {current.section}</p>
      </div>
      {tab === "titles" && <TitlesSettings />}
      {tab === "group" && <MasterList key="group" kind="group" title="Test Groups" hint="Tests are organized under these groups." />}
      {tab === "sample" && <MasterList key="sample" kind="sample" title="Sample Types" hint="These appear in the sample list on patient entry." />}
      {tab === "lab" && <LabSettings key="lab" section="lab" />}
      {tab === "discount" && <LabSettings key="discount" section="discount" />}
    </>
  );
}
