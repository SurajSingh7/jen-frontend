"use client";

import { useParams } from "next/navigation";
import ResultEntry from "@/components/patients/ResultEntry";

export default function ResultPage() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-7xl">
      <ResultEntry key={id} id={id} />
    </div>
  );
}
