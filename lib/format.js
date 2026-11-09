export const AGE_TYPES = ["Years", "Months", "Days"];
export const GENDERS = ["Male", "Female", "Other"];

export const today = () => new Date().toLocaleDateString("en-CA");
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
export const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const showDate = (ymd) => (ymd ? ymd.split("-").reverse().join("-") : "");
export const ageText = (i) => `${i.age} ${i.ageType === "Years" ? "Yrs" : i.ageType}`;

export function flagFor(result, min, max) {
  const text = String(result ?? "").trim();
  const n = Number(text);
  if (!text || !Number.isFinite(n)) return "";
  if (max !== null && max !== undefined && n > max) return "H";
  if (min !== null && min !== undefined && n < min) return "L";
  return "";
}
