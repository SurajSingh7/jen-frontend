"use client";

import { useParams } from "next/navigation";
import TestForm from "@/components/tests/TestForm";

export default function EditTestPage() {
  const { id } = useParams();
  return <TestForm key={id} id={id} />;
}
