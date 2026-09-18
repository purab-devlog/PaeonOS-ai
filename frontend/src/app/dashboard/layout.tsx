"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Mic, Calendar, CalendarPlus, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (!savedRole) {
      router.push("/");
    } else {
      setRole(savedRole);
    }
  }, [router]);

  const handleExit = () => {
    localStorage.removeItem("role");
    router.push("/");
  };

  if (!role) return null;

  const linksByRole: Record<string, { label: string; href: string; icon: any }[]> = {
    admin: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
    doctor: [
      { label: "My Patients", href: "/dashboard/patients", icon: Users },
      { label: "Voice Query", href: "/dashboard/voice", icon: Mic },
    ],
    nurse: [
      { label: "Schedule", href: "/dashboard/schedule", icon: Calendar },
      { label: "Book Appointment", href: "/dashboard/appointments", icon: CalendarPlus },
    ],
  };

  const currentLinks = linksByRole[role] || [];

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Bar - Fixed Height 52px */}
      <header className="h-[52px] border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <span className="text-lg font-bold text-white tracking-wide">PaeonOS</span>

        <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-0.5 rounded-full text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          System Active
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-wider bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded border border-slate-700">
            {role}
          </span>
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed Width 220px */}
        <aside className="w-[220px] border-r border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-2 shrink-0">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </aside>

        {/* Content Area - Independent Scroll */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}