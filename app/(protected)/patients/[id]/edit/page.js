"use client";

import { useParams } from "next/navigation";
import PatientForm from "@/components/patients/PatientForm";

export default function EditPatientPage() {
  const { id } = useParams();
  return <PatientForm key={id} id={id} />;
}
