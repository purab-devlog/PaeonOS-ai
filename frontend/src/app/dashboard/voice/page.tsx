"use client";

import { useState } from "react";
import axios from "axios";
import { Mic, MicOff, Search, Terminal } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

type Mode = "lookup" | "command";

export default function VoiceQueryPage() {
  const [mode, setMode] = useState<Mode>("lookup");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [patient, setPatient] = useState<any>(null);
  const [commandResponse, setCommandResponse] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [useMoss, setUseMoss] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handlePatientLookup = async (transcript: string) => {
    const endpoint = useMoss
      ? `${API_BASE}/patients/search?q=${encodeURIComponent(transcript)}`
      : `${API_BASE}/patients/search/keyword?q=${encodeURIComponent(transcript)}`;

    const start = performance.now();
    const res = await axios.get(endpoint);
    setLatencyMs(Math.round(performance.now() - start));

    if (res.data?.length > 0) {
      const p = res.data[0];
      setPatient(p);
      speak(
        `${p.name}, age ${p.age}. ` +
        `Conditions: ${p.conditions.join(", ")}. ` +
        `Currently on ${p.current_medications.join(", ")}. ` +
        `${p.allergies.length > 0 ? "Allergies: " + p.allergies.join(", ") : "No known allergies."}`
      );
    } else {
      setError("No matching patient found.");
      speak("No matching patient found.");
    }
  };

  const handleVoiceCommand = async (transcript: string) => {
    const start = performance.now();
    const res = await axios.post(`${API_BASE}/voice/command`, {
      transcript,
    });
    setLatencyMs(Math.round(performance.now() - start));
    const responseText = res.data?.response || "No response received.";
    setCommandResponse(responseText);
    speak(responseText);
  };

  const handleMicClick = () => {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Web Speech API. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setPatient(null);
      setCommandResponse(null);
      setLatencyMs(null);
    };

    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event: any) => {
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);

      if (event.results[event.results.length - 1].isFinal) {
        try {
          if (mode === "lookup") {
            await handlePatientLookup(current);
          } else {
            await handleVoiceCommand(current);
          }
        } catch (e) {
          console.error(e);
          setError("Error connecting to backend.");
          speak("There was an error connecting to the backend.");
        }
      }
    };

    recognition.start();
  };

  const clearAll = () => {
    setPatient(null);
    setCommandResponse(null);
    setTranscript("");
    setLatencyMs(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center space-y-8 py-4">
      <h1 className="text-2xl font-bold text-white self-start">Voice Query Assistant</h1>

      {/* Mode Toggle */}
      <div className="self-start flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl w-full">
        <span className="text-sm text-slate-300 font-semibold mr-1">Mode:</span>
        <button
          onClick={() => { setMode("lookup"); clearAll(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            mode === "lookup"
              ? "bg-emerald-500 text-slate-950"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Search className="w-3 h-3" /> Patient Lookup
        </button>
        <button
          onClick={() => { setMode("command"); clearAll(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            mode === "command"
              ? "bg-violet-500 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Terminal className="w-3 h-3" /> Voice Commands
        </button>

        {mode === "lookup" && (
          <>
            <div className="w-px h-5 bg-slate-700 mx-1" />
            <button
              onClick={() => { setUseMoss(true); setLatencyMs(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                useMoss ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Moss
            </button>
            <button
              onClick={() => { setUseMoss(false); setLatencyMs(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                !useMoss ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Keyword
            </button>
          </>
        )}

        {latencyMs !== null && (
          <span className={`ml-auto text-xs font-mono font-bold px-3 py-1.5 rounded-lg border ${
            latencyMs < 200
              ? "text-emerald-400 bg-emerald-950 border-emerald-500/30"
              : "text-amber-400 bg-amber-950 border-amber-500/30"
          }`}>
            {latencyMs}ms
          </span>
        )}
      </div>

      {/* Mode description */}
      <div className="self-start -mt-4 text-xs text-slate-500">
        {mode === "lookup"
          ? "Speak a patient name or condition — record pulled instantly from local Moss index"
          : "Speak a command — e.g. \"book appointment with Dr Ramesh Gupta on September 20 at 10 AM\""
        }
      </div>

      {/* Mic Button */}
      <button
        onClick={handleMicClick}
        disabled={isListening}
        className={`w-28 h-28 rounded-full flex items-center justify-center transition border-4 ${
          isListening
            ? "bg-rose-600 border-rose-400 animate-pulse cursor-not-allowed"
            : mode === "command"
            ? "bg-violet-500 hover:bg-violet-600 border-violet-400 cursor-pointer"
            : "bg-emerald-500 hover:bg-emerald-600 border-emerald-400 cursor-pointer"
        }`}
      >
        {isListening
          ? <MicOff className="w-12 h-12 text-white" />
          : <Mic className="w-12 h-12 text-slate-950" />
        }
      </button>
      <p className="text-xs text-slate-500 -mt-4">
        {isListening ? "Listening..." : "Click mic and speak"}
      </p>

      {/* Live Transcript */}
      <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl min-h-[70px] text-center">
        <p className="text-xs uppercase font-bold text-slate-500 mb-1">Live Transcript</p>
        <p className="text-slate-200 text-lg">
          {transcript || "Click mic and state your query..."}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl text-center">
          <p className="text-rose-400 text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Command Response */}
      {mode === "command" && commandResponse && (
        <div className="w-full bg-violet-950/40 border border-violet-500/30 p-5 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-violet-400 uppercase">Response</p>
          <p className="text-slate-200 text-base leading-relaxed">{commandResponse}</p>
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-300 underline transition cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Patient Record — lookup mode only */}
      {mode === "lookup" && patient && (
        <div className="w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-white">{patient.name}</h2>
              <p className="text-slate-400 text-sm">
                Age: {patient.age} • Blood Group: {patient.blood_group} • ID: {patient.patient_id}
              </p>
            </div>
            {patient.allergies?.length > 0 && (
              <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs px-3 py-1.5 rounded-lg font-bold shrink-0">
                ⚠️ {patient.allergies.join(", ")}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Conditions</p>
            <div className="flex flex-wrap gap-2">
              {patient.conditions?.map((c: string) => (
                <span key={c} className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md">{c}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Current Medications</p>
            <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
              {patient.current_medications?.map((m: string) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Past Treatments</p>
            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
              {patient.past_treatments?.map((t: string, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Last Visit Notes</p>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {patient.last_visit_notes}
            </p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Follow-up: <span className="text-white font-semibold">{patient.follow_up_date || "N/A"}</span>
            </p>
            <p className="text-xs text-slate-500">
              {useMoss ? "⚡ Moss — semantic retrieval" : "🔤 Keyword — no semantic understanding"}
            </p>
          </div>

          <button
            onClick={clearAll}
            className="w-full text-xs text-slate-500 hover:text-slate-300 underline transition cursor-pointer pt-1"
          >
            Clear result
          </button>
        </div>
      )}
    </div>
  );
}