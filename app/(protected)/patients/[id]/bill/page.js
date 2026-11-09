"use client";

import { useParams } from "next/navigation";
import ReportView from "@/components/patients/ReportView";

export default function BillPage() {
  const { id } = useParams();
  return <ReportView key={id} id={id} kind="bill" />;
}
