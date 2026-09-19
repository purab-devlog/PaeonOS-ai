"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function BookAppointmentPage() {
  const [patientName, setPatientName] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/doctors`).then((res) => setDoctors(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDoctor && date) {
      axios
        .get(`${API_BASE}/doctors/${selectedDoctor}/availability?date=${date}`)
        .then((res) => setTimeSlots(Array.isArray(res.data) ? res.data : []))
        .catch(console.error);
    }
  }, [selectedDoctor, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/appointments/book`, {
        patient_name: patientName,
        doctor_id: selectedDoctor,
        date,
        time: selectedTime,
      });

      setConfirmation(`Appointment booked successfully! ID: ${res.data.appointment_id}`);
      setPatientName("");
      setSelectedDoctor("");
      setDate("");
      setSelectedTime("");
      setTimeSlots([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Book Appointment</h1>

      {confirmation && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-sm font-semibold">
          {confirmation}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Patient Name</label>
          <input
            type="text"
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Doctor</label>
          <select
            required
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Select Doctor</option>
            {doctors.map((doc) => (
              <option key={doc.doctor_id} value={doc.doctor_id}>
                Dr. {doc.name} - {doc.specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Time Slot</label>
          <select
            required
            disabled={timeSlots.length === 0}
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            <option value="">Select Slot</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-lg text-sm transition mt-2 cursor-pointer"
        >
          Book Appointment
        </button>
      </form>
    </div>
  );
}