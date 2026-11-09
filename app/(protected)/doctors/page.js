import DoctorsView from "@/components/doctors/DoctorsView";

export const metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <DoctorsView />
    </div>
  );
}
