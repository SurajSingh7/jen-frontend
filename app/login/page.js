import LoginForm from "./LoginForm";
import { DoctorsIcon, PatientsIcon, TestsIcon } from "@/components/Icons";

export const metadata = { title: "Login" };

const FEATURES = [
  { title: "Patients", Icon: PatientsIcon },
  { title: "Tests", Icon: TestsIcon },
  { title: "Doctors", Icon: DoctorsIcon },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50/60 p-4">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        <div className="space-y-8 text-center lg:text-left">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-black">Jen Pathology</h1>
            <p className="mt-2 text-lg leading-relaxed text-gray-600">Manage patients, tests, reports and doctor commission in one place.</p>
          </div>
          <div className="mx-auto hidden max-w-xl grid-cols-3 gap-4 sm:grid lg:mx-0">
            {FEATURES.map(({ title, Icon }) => (
              <div key={title} className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-lg">
                <Icon className="size-6 text-green-700" />
                <h2 className="text-sm font-semibold text-black">{title}</h2>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="-mx-8 -mt-8 mb-6 h-2 rounded-t-2xl bg-gradient-to-r from-green-600 to-green-700" />
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-black">Welcome Back</h2>
              <p className="text-base text-gray-600">Sign in to your Jen Pathology account</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
