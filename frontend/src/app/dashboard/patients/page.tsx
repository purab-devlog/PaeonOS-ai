"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("DR003");
  const [patients, setPatients] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const searchPatients = async (q: string) => {
    try {
      const res = await axios.get(`${API_BASE}/patients/search?q=${encodeURIComponent(q)}`);
      setPatients(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      searchPatients(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const filteredPatients = doctorFilter === "ALL" 
    ? patients 
    : patients.filter((p) => p.doctor_id === doctorFilter);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Patient Records</h1>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search patients by name or condition..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
        />

        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="DR003">My Patients (DR003)</option>
          <option value="ALL">All Patients</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredPatients.map((p) => {
          const isExpanded = expandedId === p.patient_id;
          return (
            <div
              key={p.patient_id}
              onClick={() => setExpandedId(isExpanded ? null : p.patient_id)}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">{p.name}</h2>
                  <p className="text-xs text-slate-400">ID: {p.patient_id} • Age: {p.age}</p>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">{isExpanded ? "Collapse ▲" : "Expand ▼"}</span>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 text-sm" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Treatments History</p>
                    <ul className="list-disc list-inside text-slate-300">
                      {p.treatments?.map((t: any, i: number) => (
                        <li key={i}>{t.date}: {t.treatment}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                    <span>Follow-up Date: <strong className="text-white">{p.followup_date || "N/A"}</strong></span>
                    <span>Doctor ID: <strong className="text-white">{p.doctor_id}</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}