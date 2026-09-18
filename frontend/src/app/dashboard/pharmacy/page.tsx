"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function PharmacyPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dispenseQty, setDispenseQty] = useState<{ [key: string]: number }>({});
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [invRes, alertRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory`),
        axios.get(`${API_BASE}/inventory/alerts`),
      ]);
      setInventory(invRes.data);
      setAlerts(alertRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispense = async (drugName: string) => {
    const qty = dispenseQty[drugName] || 1;
    try {
      const res = await axios.post(`${API_BASE}/inventory/dispense`, {
        drug_name: drugName,
        quantity: qty,
      });

      if (res.data.is_low) {
        setActiveAlert(`${drugName} below reorder threshold — ${res.data.current_stock} units remaining.`);
      }

      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Pharmacy Inventory</h1>

      {activeAlert && (
        <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 p-4 rounded-xl text-sm font-semibold">
          ⚠️ {activeAlert}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Drug Name</th>
              <th className="p-4">Unit</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Threshold</th>
              <th className="p-4">Dispense Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {inventory.map((item) => {
              const isLow = item.current_stock <= item.reorder_threshold;
              return (
                <tr key={item.drug_name}>
                  <td className="p-4 font-bold text-white">{item.drug_name}</td>
                  <td className="p-4 text-xs text-slate-400">{item.unit}</td>
                  <td className="p-4 w-48">
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{item.current_stock}</span>
                      <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isLow ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, (item.current_stock / (item.reorder_threshold * 2)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{item.reorder_threshold}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        defaultValue="1"
                        onChange={(e) =>
                          setDispenseQty({ ...dispenseQty, [item.drug_name]: parseInt(e.target.value) })
                        }
                        className="w-16 bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white"
                      />
                      <button
                        onClick={() => handleDispense(item.drug_name)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1 rounded text-xs transition cursor-pointer"
                      >
                        Dispense
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm">
        <summary className="font-bold text-white cursor-pointer">Alert History</summary>
        <div className="mt-4 space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="text-xs text-slate-400 border-b border-slate-800/50 pb-2">
              <span className="text-rose-400 font-semibold">{a.drug_name}</span> dropped to {a.current_stock} units on {a.timestamp}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}