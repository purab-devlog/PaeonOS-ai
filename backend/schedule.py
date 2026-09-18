import datetime
from typing import List, Dict, Any, Optional
import data_loader

schedule_db: List[Dict[str, Any]] = data_loader.schedule
doctors_db: Dict[str, Dict[str, Any]] = data_loader.doctors
patients_db: Dict[str, Dict[str, Any]] = data_loader.patients

def get_appointments(date_str: str) -> List[Dict[str, Any]]:
    enriched = []
    for appt in schedule_db:
        if appt.get("date") == date_str:
            p = patients_db.get(appt.get("patient_id"), {})
            d = doctors_db.get(appt.get("doctor_id"), {})
            enriched_item = appt.copy()
            enriched_item["patient_name"] = p.get("name", "Unknown Patient")
            enriched_item["doctor_name"] = d.get("name", "Unknown Doctor")
            enriched.append(enriched_item)
    return enriched

def get_doctor_availability(doctor_id: str, date_str: str) -> List[str]:
    doc = doctors_db.get(doctor_id)
    if not doc:
        return []
    
    dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
    weekday_name = dt.strftime("%A")
    
    if weekday_name not in doc.get("available_days", []):
        return []
    
    all_slots = set(doc.get("available_slots", []))
    booked_slots = set()
    
    for appt in schedule_db:
        if appt.get("doctor_id") == doctor_id and appt.get("date") == date_str and appt.get("status") != "cancelled":
            booked_slots.add(appt.get("time"))
            
    free_slots = sorted(list(all_slots - booked_slots))
    return free_slots

def book_appointment(patient_name: str, doctor_id: str, date_str: str, time_str: str) -> Dict[str, Any]:
    # Resolve or create patient_id
    matched_p_id = "P999"
    for p_id, p in patients_db.items():
        if patient_name.lower() in p.get("name", "").lower():
            matched_p_id = p_id
            break
            
    appt_id = f"APT{int(datetime.datetime.now().timestamp())}"
    new_appt = {
        "appointment_id": appt_id,
        "patient_id": matched_p_id,
        "doctor_id": doctor_id,
        "date": date_str,
        "time": time_str,
        "status": "confirmed",
        "checked_in": False
    }
    schedule_db.append(new_appt)
    return new_appt

def get_missed_followups() -> List[Dict[str, Any]]:
    return [
        appt for appt in schedule_db 
        if appt.get("status") == "missed" and not appt.get("checked_in", False)
    ]

def check_in(appointment_id: str) -> Optional[Dict[str, Any]]:
    for appt in schedule_db:
        if appt.get("appointment_id") == appointment_id:
            appt["checked_in"] = True
            appt["status"] = "confirmed"
            return appt
    return None

if __name__ == "__main__":
    print("Testing Schedule module...")
    new_apt = book_appointment("Aarav Sharma", "DR001", "2026-09-19", "10:00")
    print(f"Booked: {new_apt}")
    
    appts = get_appointments("2026-09-19")
    print(f"Appointments for 2026-09-19: {len(appts)}")
    
    res = check_in(new_apt["appointment_id"])
    print(f"Checked in: {res}")
    
    missed = get_missed_followups()
    print(f"Missed follow-ups count: {len(missed)}")
