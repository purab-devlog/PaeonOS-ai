"use client";

import { useRouter } from "next/navigation";
import { Stethoscope, ClipboardList, ShieldCheck, Pill } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const handleSelectRole = (role: string) => {
    localStorage.setItem("role", role);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-5xl font-extrabold tracking-tight text-white">PaeonOS</h1>
        <p className="text-slate-400 text-lg font-medium">Hospital AI Operating System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Doctor Card */}
        <div
          onClick={() => handleSelectRole("doctor")}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition flex flex-col gap-3 group"
        >
          <Stethoscope className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div>
            <h2 className="text-xl font-bold text-white">Doctor</h2>
            <p className="text-slate-400 text-sm">Patient records and voice queries</p>
          </div>
        </div>

        {/* Nurse Station Card */}
        <div
          onClick={() => handleSelectRole("nurse")}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition flex flex-col gap-3 group"
        >
          <ClipboardList className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div>
            <h2 className="text-xl font-bold text-white">Nurse Station</h2>
            <p className="text-slate-400 text-sm">Appointments and scheduling</p>
          </div>
        </div>

        {/* Admin Card */}
        <div
          onClick={() => handleSelectRole("admin")}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition flex flex-col gap-3 group"
        >
          <ShieldCheck className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div>
            <h2 className="text-xl font-bold text-white">Admin</h2>
            <p className="text-slate-400 text-sm">System health and analytics</p>
          </div>
        </div>

        {/* Pharmacy Card (Disabled) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl opacity-40 cursor-not-allowed relative flex flex-col gap-3">
          <span className="absolute top-4 right-4 bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-700">
            Coming Soon
          </span>
          <Pill className="w-8 h-8 text-slate-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Pharmacy</h2>
            <p className="text-slate-400 text-sm">Inventory management</p>
          </div>
        </div>
      </div>
    </main>
  );
}