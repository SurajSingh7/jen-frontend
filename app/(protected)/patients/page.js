import PatientsView from "@/components/patients/PatientsView";

export const metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PatientsView />
    </div>
  );
}
