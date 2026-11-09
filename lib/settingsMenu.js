// Settings menu: one column per section in the navbar. `tab` is the ?tab= value on /settings.
export const SETTINGS_SECTIONS = [
  {
    name: "Tests",
    items: [
      { name: "Test Groups", tab: "group" },
      { name: "Sample Types", tab: "sample" },
    ],
  },
  { name: "Patients", items: [{ name: "Titles", tab: "titles" }] },
  { name: "Lab", items: [{ name: "Lab Details", tab: "lab" }] },
  { name: "Billing", items: [{ name: "Discount Settings", tab: "discount" }] },
];
