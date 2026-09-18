"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Mic } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

export default function VoiceQueryPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [patient, setPatient] = useState<any>(null);

  const handleMicClick = () => {
    const windowAuth = window as any;
    const SpeechRecognition = windowAuth.SpeechRecognition || windowAuth.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser does not support Web Speech API");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event: any) => {
      let currentText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);

      if (event.results[0].isFinal) {
        try {
          const res = await axios.get(`${API_BASE}/patients/search?q=${encodeURIComponent(currentText)}`);
          if (res.data && res.data.length > 0) {
            const p = res.data[0];
            setPatient(p);

            const summaryText = `${p.name}, age ${p.age}, is currently on ${p.medications.join(", ")}. Allergies: ${p.allergies.join(", ") || "None"}.`;
            const utterance = new SpeechSynthesisUtterance(summaryText);
            window.speechSynthesis.speak(utterance);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    recognition.start();
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center space-y-8">
      <h1 className="text-2xl font-bold text-white">Voice Query Assistant</h1>

      {/* Mic Button */}
      <button
        onClick={handleMicClick}
        className={`w-28 h-28 rounded-full flex items-center justify-center transition border-4 cursor-pointer ${
          isListening
            ? "bg-rose-600 border-rose-400 animate-pulse"
            : "bg-emerald-500 hover:bg-emerald-600 border-emerald-400"
        }`}
      >
        <Mic className="w-12 h-12 text-slate-950" />
      </button>

      {/* Transcript Area */}
      <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl min-h-[80px] text-center">
        <p className="text-xs uppercase font-bold text-slate-500 mb-1">Live Transcript</p>
        <p className="text-slate-200 text-lg">{transcript || "Click mic and state your query..."}</p>
      </div>

      {/* Patient Results Panel */}
      {patient && (
        <div className="w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-white">{patient.name}</h2>
              <p className="text-slate-400 text-sm">Age: {patient.age} • Blood Group: {patient.blood_group}</p>
            </div>
            {patient.allergies?.length > 0 && (
              <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs px-3 py-1.5 rounded-lg font-bold">
                ⚠️ Allergies: {patient.allergies.join(", ")}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Conditions</p>
            <div className="flex gap-2">
              {patient.conditions?.map((c: string) => (
                <span key={c} className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Current Medications</p>
            <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
              {patient.medications?.map((m: string) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Last Visit Notes</p>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">{patient.last_visit_notes}</p>
          </div>

          <p className="text-center text-xs text-slate-500 pt-2">Powered by Moss — sub-10ms retrieval</p>
        </div>
      )}
    </div>
  );
}