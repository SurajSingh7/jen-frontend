"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CloseIcon, CommissionIcon, DownIcon, LabIcon, MenuIcon, PatientsIcon, TestsIcon } from "./Icons";
import { SETTINGS_SECTIONS } from "@/lib/settingsMenu";

const LINKS = [
  { label: "Patients", path: "/patients" },
  { label: "Tests", path: "/tests" },
  { label: "Doctors", path: "/doctors" },
];

const ACCOUNTS = [
  { label: "Patient Account", path: "/accounts/patients" },
  { label: "Doctor Account", path: "/accounts/doctors" },
];

const SECTION_ICON = { Tests: TestsIcon, Patients: PatientsIcon, Lab: LabIcon, Billing: CommissionIcon };

const ACTIVE = "bg-green-700 text-white";
const IDLE = "text-gray-300 hover:bg-gray-700";
const EDGE = 8;

// One column per section. Settings sits near the right of the bar, so the panel slides left if it would leave the screen.
function SettingsPanel({ isActive, onPick }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    const rect = el.getBoundingClientRect();
    let shift = 0;
    if (rect.right > window.innerWidth - EDGE) shift = window.innerWidth - EDGE - rect.right;
    if (rect.left + shift < EDGE) shift = EDGE - rect.left;
    el.style.transform = shift ? `translateX(${shift}px)` : "";
  }, []);

  return (
    <div ref={ref} className="absolute left-0 z-10 mt-[15px] grid w-max max-w-[calc(100vw-1rem)] grid-cols-[repeat(2,minmax(10rem,1fr))] gap-x-2 gap-y-2 overflow-x-auto rounded-xl bg-gray-800 p-3 shadow-2xl ring-1 ring-black/20">
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = SECTION_ICON[section.name];
        return (
          <div key={section.name} className="min-w-0 py-1">
            <p className="flex items-center gap-1.5 px-3 pt-1 pb-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              <Icon className="size-3.5" />
              {section.name}
            </p>
            {section.items.map((item) => (
              <Link key={item.tab} href={`/settings?tab=${item.tab}`} onClick={onPick} className={`block rounded-md px-3 py-1.5 text-xs ${isActive(item.tab) ? ACTIVE : IDLE}`}>
                {item.name}
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const currentTab = useSearchParams().get("tab") ?? SETTINGS_SECTIONS[0].items[0].tab;
  const [panelOpen, setPanelOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSettings, setMobileSettings] = useState(false);
  const navRef = useRef(null);
  const inSettings = pathname.startsWith("/settings");
  const inAccounts = pathname.startsWith("/accounts");
  const isTabActive = (tab) => inSettings && currentTab === tab;

  useEffect(() => {
    if (!panelOpen && !accountsOpen) return;
    const onClick = (e) => {
      if (navRef.current?.contains(e.target)) return;
      setPanelOpen(false);
      setAccountsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [panelOpen, accountsOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileSettings(false);
  };

  return (
    <div>
      {/* Desktop */}
      <nav ref={navRef} className="hidden space-x-1 md:flex">
        {LINKS.map((link) => (
          <Link key={link.path} href={link.path} aria-current={pathname.startsWith(link.path) ? "page" : undefined} className={`flex items-center rounded-md px-3 py-1 text-sm font-medium ${pathname.startsWith(link.path) ? ACTIVE : IDLE}`}>
            {link.label}
          </Link>
        ))}
        <div className="relative">
          <button
            type="button"
            aria-expanded={accountsOpen}
            aria-haspopup="true"
            onClick={() => {
              setAccountsOpen(!accountsOpen);
              setPanelOpen(false);
            }}
            className={`flex items-center rounded-md px-3 py-1 text-sm font-medium ${inAccounts ? ACTIVE : IDLE}`}
          >
            <span className="mr-1">Accounts</span>
            <DownIcon size={16} className={`transition-transform ${accountsOpen ? "rotate-180" : ""}`} />
          </button>
          {accountsOpen && (
            <div className="absolute left-0 z-10 mt-[15px] w-44 rounded-xl bg-gray-800 p-2 shadow-2xl ring-1 ring-black/20">
              {ACCOUNTS.map((item) => (
                <Link key={item.path} href={item.path} onClick={() => setAccountsOpen(false)} className={`block rounded-md px-3 py-1.5 text-xs ${pathname.startsWith(item.path) ? ACTIVE : IDLE}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            aria-expanded={panelOpen}
            aria-haspopup="true"
            onClick={() => {
              setPanelOpen(!panelOpen);
              setAccountsOpen(false);
            }}
            className={`flex items-center rounded-md px-3 py-1 text-sm font-medium ${inSettings ? ACTIVE : IDLE}`}>
            <span className="mr-1">Settings</span>
            <DownIcon size={16} className={`transition-transform ${panelOpen ? "rotate-180" : ""}`} />
          </button>
          {panelOpen && <SettingsPanel isActive={isTabActive} onPick={() => setPanelOpen(false)} />}
        </div>
      </nav>

      {/* Phone */}
      <div className="md:hidden">
        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-md bg-gray-800 p-2" aria-label={mobileOpen ? "Close menu" : "Open menu"}>
          {mobileOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-14 right-0 z-20 max-h-[calc(100dvh-3.5rem)] w-64 overflow-y-auto bg-gray-800 shadow-lg md:hidden">
          <div className="space-y-1 px-4 py-3">
            {LINKS.map((link) => (
              <Link key={link.path} href={link.path} onClick={closeMobile} className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${pathname.startsWith(link.path) ? ACTIVE : IDLE}`}>
                {link.label}
              </Link>
            ))}
            <p className="px-3 pt-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">Accounts</p>
            {ACCOUNTS.map((item) => (
              <Link key={item.path} href={item.path} onClick={closeMobile} className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${pathname.startsWith(item.path) ? ACTIVE : IDLE}`}>
                {item.label}
              </Link>
            ))}
            <button type="button" aria-expanded={mobileSettings} onClick={() => setMobileSettings(!mobileSettings)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${inSettings ? ACTIVE : "hover:bg-gray-700"}`}>
              <span>Settings</span>
              <DownIcon size={16} className={`transition-transform ${mobileSettings ? "rotate-180" : ""}`} />
            </button>
            {mobileSettings && (
              <div className="mt-1 space-y-2 pl-4">
                {SETTINGS_SECTIONS.map((section) => (
                  <div key={section.name}>
                    <p className="px-3 pt-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">{section.name}</p>
                    {section.items.map((item) => (
                      <Link key={item.tab} href={`/settings?tab=${item.tab}`} onClick={closeMobile} className={`block rounded-md px-3 py-2 text-xs ${isTabActive(item.tab) ? ACTIVE : IDLE}`}>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
