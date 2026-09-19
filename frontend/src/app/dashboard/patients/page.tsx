"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

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
      if (query.trim()) searchPatients(query);
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
          placeholder="Search by name, condition, or medication..."
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

      <p className="text-xs text-slate-500 -mt-2">
        ⚡ Semantic search powered by Moss — sub-10ms retrieval
      </p>

      <div className="space-y-4">
        {filteredPatients.length === 0 && query.trim() && (
          <p className="text-slate-500 text-sm">No patients found for "{query}"</p>
        )}
        {filteredPatients.length === 0 && !query.trim() && (
          <p className="text-slate-500 text-sm">Start typing to search patients.</p>
        )}

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
                  <p className="text-xs text-slate-400">
                    ID: {p.patient_id} • Age: {p.age} • {p.blood_group}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.conditions?.map((c: string) => (
                      <span key={c} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-semibold shrink-0 ml-4">
                  {isExpanded ? "Collapse ▲" : "Expand ▼"}
                </span>
              </div>

              {isExpanded && (
                <div
                  className="mt-4 pt-4 border-t border-slate-800 space-y-4 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Medications */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Current Medications</p>
                    <ul className="list-disc list-inside text-slate-200 space-y-0.5">
                      {p.current_medications?.map((m: string) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Allergies */}
                  {p.allergies?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Allergies</p>
                      <p className="text-rose-400 font-semibold text-xs">⚠️ {p.allergies.join(", ")}</p>
                    </div>
                  )}

                  {/* Past Treatments */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Treatment History</p>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                      {p.past_treatments?.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Last Visit Notes */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Last Visit Notes</p>
                    <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                      {p.last_visit_notes}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                    <span>
                      Follow-up: <strong className="text-white">{p.follow_up_date || "N/A"}</strong>
                    </span>
                    <span>
                      Doctor ID: <strong className="text-white">{p.doctor_id}</strong>
                    </span>
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