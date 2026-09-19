"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function SchedulePage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);

  const fetchAppointments = async (selectedDate: string) => {
    try {
      const res = await axios.get(`${API_BASE}/appointments?date=${selectedDate}`);
      setAppointments(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCalls = async () => {
    try {
      const res = await axios.get(`${API_BASE}/calls`);
      setCalls(res.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppointments(date);
    fetchCalls();
    const timer = setInterval(() => {
      fetchAppointments(date);
      fetchCalls();
    }, 10000);
    return () => clearInterval(timer);
  }, [date]);

  const handleCheckIn = async (aptId: string) => {
    try {
      await axios.post(`${API_BASE}/appointments/checkin/${aptId}`);
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointment_id === aptId ? { ...a, status: "checked-in" } : a
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Schedule Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Daily Schedule</h1>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No appointments for selected date.
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.appointment_id}>
                    <td className="p-4 font-mono">{a.time}</td>
                    <td className="p-4 font-semibold text-white">{a.patient_name}</td>
                    <td className="p-4">{a.doctor_name}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                          a.status === "confirmed"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : a.status === "pending"
                            ? "bg-amber-950 text-amber-400 border border-amber-500/30"
                            : a.status === "checked-in"
                            ? "bg-cyan-950 text-cyan-400 border border-cyan-500/30"
                            : "bg-rose-950 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {a.status === "confirmed" && (
                        <button
                          onClick={() => handleCheckIn(a.appointment_id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Log Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Call Log</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Duration (s)</th>
                <th className="p-4">Intent</th>
                <th className="p-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    No call logs yet.
                  </td>
                </tr>
              ) : (
                calls.map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="p-4">{c.timestamp}</td>
                    <td className="p-4">{c.duration}</td>
                    <td className="p-4">{c.intent}</td>
                    <td className="p-4">{c.outcome}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}