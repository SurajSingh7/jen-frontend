"use client";

import { useParams } from "next/navigation";
import WhatsappSend from "@/components/patients/WhatsappSend";

export default function WhatsappPage() {
  const { id } = useParams();
  return <WhatsappSend key={id} id={id} />;
}
