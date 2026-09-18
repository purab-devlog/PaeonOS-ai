"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function AdminOverviewPage() {
  const [health, setHealth] = useState<{ status?: string; moss_ready?: boolean }>({});
  const [vapi, setVapi] = useState<{ connected?: boolean }>({});
  const [activeCalls, setActiveCalls] = useState<number>(0);
  const [calls, setCalls] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [healthRes, vapiRes, statsRes, callsRes, errorsRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/health`),
        axios.get(`${API_BASE}/vapi/status`),
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/calls`),
        axios.get(`${API_BASE}/errors`),
      ]);

      if (healthRes.status === "fulfilled") setHealth(healthRes.value.data);
      if (vapiRes.status === "fulfilled") setVapi(vapiRes.value.data);
      if (statsRes.status === "fulfilled") setActiveCalls(statsRes.value.data.active_calls ?? 0);
      if (callsRes.status === "fulfilled") setCalls(callsRes.value.data ?? []);
      if (errorsRes.status === "fulfilled") setErrors(errorsRes.value.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">System Status</h1>
      </div>

      {/* Section 1: System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">Backend API</span>
          <span className={`w-3 h-3 rounded-full ${health.status === "healthy" ? "bg-emerald-400" : "bg-rose-500"}`} />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">Moss Index</span>
          <span className={`w-3 h-3 rounded-full ${health.moss_ready ? "bg-emerald-400" : "bg-rose-500"}`} />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">VAPI Connection</span>
          <span className={`w-3 h-3 rounded-full ${vapi.connected ? "bg-emerald-400" : "bg-rose-500"}`} />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-300">Active Calls</p>
            <p className="text-2xl font-bold text-white">{activeCalls}</p>
          </div>
          <span className={`w-3 h-3 rounded-full bg-emerald-400 ${activeCalls > 0 ? "animate-ping" : ""}`} />
        </div>
      </div>

      {/* Section 2: Call Analytics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Call Analytics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Intent Detected</th>
                <th className="p-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">No call logs available</td>
                </tr>
              ) : (
                calls.map((c, i) => (
                  <tr key={i}>
                    <td className="p-3">{c.timestamp}</td>
                    <td className="p-3">{c.duration}</td>
                    <td className="p-3">{c.intent}</td>
                    <td className="p-3">{c.outcome}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Error Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">System Error Log</h2>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {errors.length === 0 ? (
            <p className="text-slate-500 text-sm">No recorded errors.</p>
          ) : (
            errors.map((err, i) => (
              <div key={i} className="flex justify-between items-start text-xs border-b border-slate-800/50 pb-2">
                <span className="text-rose-400 font-mono flex-1">{err.error}</span>
                <span className="text-slate-400 ml-4">{err.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}