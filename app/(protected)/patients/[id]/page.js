"use client";

import { useParams } from "next/navigation";
import PatientDetail from "@/components/patients/PatientDetail";

export default function PatientDetailPage() {
  const { id } = useParams();
  return <PatientDetail key={id} id={id} />;
}
