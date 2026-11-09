import { ageText, rupees, showDate } from "@/lib/format";

// Report pages are drawn with inline colors and a system font, so the same markup works for
// on-screen preview, browser print and the PDF image (Hindi needs the device's Devanagari font).
const FONT = 'Arial, "Nirmala UI", "Noto Sans Devanagari", sans-serif';
export const PAGE_W = 794;
export const PAGE_H = 1123;
const MM = 3.78;
const INFO_H = 88;
const TABLE_HEAD_H = 28;
const SIGN_H = 52;
const ROW_H = 22;
const TEST_HEAD_H = 32;
const NOTE_LINE_H = 15;
const NOTE_CHARS = 112;

const noteHeight = (text) => (text ? Math.ceil(text.length / NOTE_CHARS) * NOTE_LINE_H + 8 : 0);

// Splits the report's rows over as many A4 pages as needed
export function paginate(report, settings) {
  const available = PAGE_H - (settings.topSpaceMm + settings.bottomSpaceMm) * MM - INFO_H - TABLE_HEAD_H - SIGN_H;
  const pages = [[]];
  let used = 0;
  const put = (row, height) => {
    if (used + height > available && pages.at(-1).length) {
      pages.push([]);
      used = 0;
    }
    pages.at(-1).push(row);
    used += height;
  };

  report.tests.forEach((test, testIndex) => {
    // Keep a test's heading together with its first row
    if (used + TEST_HEAD_H + ROW_H > available && pages.at(-1).length) {
      pages.push([]);
      used = 0;
    }
    put({ kind: "test", key: `t${testIndex}`, text: test.printHeading || test.name }, TEST_HEAD_H);
    test.params.forEach((param) => put({ kind: "param", key: `${testIndex}-${param.paramId}`, param }, ROW_H));
    if (test.method) put({ kind: "note", key: `m${testIndex}`, label: "Method", text: test.method }, noteHeight(`Method: ${test.method}`));
    if (test.notes) put({ kind: "note", key: `n${testIndex}`, label: "Note", text: test.notes }, noteHeight(`Note: ${test.notes}`));
  });
  return pages;
}

const BILL_TITLE_H = 36;
const BILL_ROW_H = 24;
const BILL_TOTALS_H = 170;

// Tests split over pages; the totals print on the last page only
export function paginateBill(report, settings) {
  const available = PAGE_H - (settings.topSpaceMm + settings.bottomSpaceMm) * MM - INFO_H - BILL_TITLE_H - TABLE_HEAD_H - BILL_TOTALS_H - SIGN_H;
  const perPage = Math.max(1, Math.floor(available / BILL_ROW_H));
  const rows = report.tests.map((test, i) => ({ no: i + 1, name: test.name, mrp: test.mrp }));
  const pages = [];
  for (let i = 0; i < rows.length; i += perPage) pages.push(rows.slice(i, i + perPage));
  return pages;
}

function Letterhead({ s, height }) {
  return (
    <div style={{ height, display: "flex", flexDirection: "column", color: "#fff", overflow: "hidden" }}>
      <div style={{ flex: 1, background: "linear-gradient(90deg,#7a1f1f,#a0342a,#7a1f1f)", padding: "12px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
          <span>Reg. No. : {s.regNo}</span>
          <span>☎ {s.phone}</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 54, fontWeight: 800, lineHeight: 1.25 }}>
          {s.labNameLatin} {s.labNameLocal}
        </div>
        <div style={{ textAlign: "center", fontSize: 14, fontWeight: 600 }}>{s.address}</div>
      </div>
      <div style={{ background: "#27306e", padding: "8px 40px", display: "flex", justifyContent: "space-between" }}>
        {[[s.doctorName, s.doctorDegree], [s.technicianName, s.technicianDegree]].map(([name, degree]) => (
          <div key={name} style={{ background: "#7a1f1f", border: "1px solid #fff", borderRadius: 4, padding: "3px 22px", textAlign: "center", color: "#ffe9a8", fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}>
            {name}
            <div style={{ fontSize: 12, color: "#fff" }}>{degree}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer({ s, height }) {
  return (
    <div style={{ height, background: "#27306e", color: "#fff", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
      <span>{s.footerNote}</span>
      <span>{s.labTime}</span>
    </div>
  );
}

function Row({ row }) {
  if (row.kind === "test") {
    return <div style={{ height: TEST_HEAD_H, lineHeight: `${TEST_HEAD_H}px`, fontWeight: 700, fontSize: 14, textAlign: "center", textDecoration: "underline" }}>{row.text}</div>;
  }
  if (row.kind === "note") {
    return (
      <div style={{ fontSize: 11, lineHeight: `${NOTE_LINE_H}px`, color: "#333", padding: "4px 0" }}>
        <b>{row.label}:</b> {row.text}
      </div>
    );
  }
  const p = row.param;
  const bold = p.bold || p.type === "heading";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 24px 1.3fr 1fr", height: ROW_H, lineHeight: `${ROW_H}px`, fontSize: 13, fontWeight: bold ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden" }}>
      <span style={{ paddingLeft: p.type === "heading" ? 0 : 6 }}>{p.name}</span>
      <span style={{ fontWeight: p.flag ? 700 : bold ? 700 : 400 }}>{p.result}</span>
      <span style={{ fontWeight: 700 }}>{p.flag === "H" ? "↑" : p.flag === "L" ? "↓" : ""}</span>
      <span>{p.rangeText}</span>
      <span>{p.unit}</span>
    </div>
  );
}

function PatientInfo({ report }) {
  const i = report.patientInfo;
  const fullName = [i.title, i.name].filter(Boolean).join(" ");
  const cell = { display: "flex", gap: 6 };
  return (
    <div style={{ height: INFO_H, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2px 24px", alignContent: "center", fontSize: 13.5, borderBottom: "1px solid #111" }}>
      <div style={cell}><b>Name:</b> {fullName}</div>
      <div style={cell}><b>Lab No:</b> {report.labNo}</div>
      <div style={cell}><b>Age / Gender:</b> {ageText(i)} / {i.gender}</div>
      <div style={cell}><b>Date:</b> {showDate(report.date)}</div>
      <div style={cell}><b>Refer By:</b> {report.doctorName}</div>
      <div style={cell}><b>Sample:</b> {report.sampleType}</div>
    </div>
  );
}

function BillTotal({ label, value, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 24, height: strong ? 26 : 22, lineHeight: strong ? "26px" : "22px", fontSize: strong ? 14.5 : 13, fontWeight: strong ? 700 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// What the patient receives: one Discount figure, never the doctor's commission
export function BillPage({ report, settings: s, rows, letterhead, pageNo, pageCount }) {
  const b = report.bill;
  const top = Math.round(s.topSpaceMm * MM);
  const bottom = Math.round(s.bottomSpaceMm * MM);
  const columns = { display: "grid", gridTemplateColumns: "48px 1fr 120px" };

  return (
    <div className="report-page" style={{ width: PAGE_W, height: PAGE_H, background: "#fff", color: "#111", fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 2px 12px rgb(0 0 0 / .15)" }}>
      {letterhead ? <Letterhead s={s} height={top} /> : <div style={{ height: top }} />}

      <div style={{ flex: 1, padding: "0 40px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <PatientInfo report={report} />
        <div style={{ height: BILL_TITLE_H, lineHeight: `${BILL_TITLE_H}px`, textAlign: "center", fontSize: 15, fontWeight: 700, textDecoration: "underline" }}>Customer Bill</div>
        <div style={{ ...columns, height: TABLE_HEAD_H, lineHeight: `${TABLE_HEAD_H}px`, fontSize: 13, fontWeight: 700, borderTop: "1px solid #111", borderBottom: "1px solid #111" }}>
          <span>No.</span>
          <span>Test</span>
          <span style={{ textAlign: "right" }}>Amount</span>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          {rows.map((row) => (
            <div key={row.no} style={{ ...columns, height: BILL_ROW_H, lineHeight: `${BILL_ROW_H}px`, fontSize: 13 }}>
              <span>{row.no}</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
              <span style={{ textAlign: "right" }}>{rupees(row.mrp)}</span>
            </div>
          ))}
        </div>

        {pageNo === pageCount && (
          <div style={{ height: BILL_TOTALS_H, display: "flex", justifyContent: "flex-end", borderTop: "1px solid #111", paddingTop: 6 }}>
            <div style={{ width: 300 }}>
              {b.extra > 0 && <BillTotal label="Basic Amount" value={rupees(b.basic)} />}
              {b.extra > 0 && <BillTotal label={b.extraNote || "Extra Charge"} value={rupees(b.extra)} />}
              <BillTotal label="Total" value={rupees(b.basic + b.extra)} strong />
              {b.discountAmount > 0 && <BillTotal label="Discount" value={`- ${rupees(b.discountAmount)}`} />}
              <BillTotal label="Amount Payable" value={rupees(b.net)} strong />
              <BillTotal label="Received" value={rupees(b.received)} />
              <BillTotal label="Balance" value={rupees(b.balance)} strong />
            </div>
          </div>
        )}

        <div style={{ height: SIGN_H, display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 6, fontSize: 13, fontStyle: "italic", fontWeight: 700 }}>
          <span>Thank you</span>
          {pageCount > 1 && <span style={{ fontStyle: "normal", fontWeight: 400, fontSize: 11 }}>Page {pageNo} / {pageCount}</span>}
          <span>Authorised Signatory</span>
        </div>
      </div>

      {letterhead ? <Footer s={s} height={bottom} /> : <div style={{ height: bottom }} />}
    </div>
  );
}

export function ReportPage({ report, settings: s, rows, letterhead, pageNo, pageCount }) {
  const top = Math.round(s.topSpaceMm * MM);
  const bottom = Math.round(s.bottomSpaceMm * MM);

  return (
    <div className="report-page" style={{ width: PAGE_W, height: PAGE_H, background: "#fff", color: "#111", fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 2px 12px rgb(0 0 0 / .15)" }}>
      {letterhead ? <Letterhead s={s} height={top} /> : <div style={{ height: top }} />}

      <div style={{ flex: 1, padding: "0 40px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <PatientInfo report={report} />

        <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 24px 1.3fr 1fr", height: TABLE_HEAD_H, lineHeight: `${TABLE_HEAD_H}px`, fontSize: 13, fontWeight: 700, borderBottom: "1px solid #111" }}>
          <span>Parameter</span>
          <span>Result</span>
          <span />
          <span>Ref. Range</span>
          <span>Unit</span>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          {rows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </div>

        <div style={{ height: SIGN_H, display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 6, fontSize: 13, fontStyle: "italic", fontWeight: 700 }}>
          <span>Technician</span>
          {pageCount > 1 && <span style={{ fontStyle: "normal", fontWeight: 400, fontSize: 11 }}>Page {pageNo} / {pageCount}</span>}
          <span>Incharge</span>
        </div>
      </div>

      {letterhead ? <Footer s={s} height={bottom} /> : <div style={{ height: bottom }} />}
    </div>
  );
}
