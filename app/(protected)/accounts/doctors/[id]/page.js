"use client";

import { useParams } from "next/navigation";
import DoctorDetail from "@/components/accounts/DoctorDetail";

export default function DoctorDetailPage() {
  const { id } = useParams();
  return <DoctorDetail key={id} id={id} />;
}
