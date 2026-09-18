import re
from typing import Dict, Any, Optional
import data_loader

PATIENT_NAMES = [p["name"] for p in data_loader.patients.values()]
DOCTOR_NAMES = [d["name"] for d in data_loader.doctors.values()]

def classify_intent(transcript: str) -> str:
    text = transcript.lower()

    # Patient query keywords or direct patient name mentions
    patient_keywords = ["history", "record", "medication", "allergy", "condition", "treatment", "patient"]
    if any(k in text for k in patient_keywords) or any(name.lower() in text for name in PATIENT_NAMES):
        return "PATIENT_QUERY"

    # Schedule Check keywords
    check_keywords = ["available", "slots", "when is", "what time", "is doctor free", "free time"]
    if any(k in text for k in check_keywords):
        return "SCHEDULE_CHECK"

    # Schedule Book keywords
    book_keywords = ["book", "appointment", "schedule", "see a doctor", "want to come", "visit"]
    if any(k in text for k in book_keywords):
        return "SCHEDULE_BOOK"

    # Pharmacy keywords
    pharmacy_keywords = ["medicine", "drug", "stock", "tablet", "pharmacy", "reorder", "inventory", "dispense"]
    if any(k in text for k in pharmacy_keywords):
        return "PHARMACY"

    return "UNKNOWN"

def extract_booking_entities(transcript: str) -> Dict[str, Optional[str]]:
    text = transcript.lower()
    
    matched_doc = None
    for doc in DOCTOR_NAMES:
        if doc.lower() in text or doc.split()[-1].lower() in text:
            matched_doc = doc
            break

    matched_patient = None
    for pat in PATIENT_NAMES:
        if pat.lower() in text or pat.split()[0].lower() in text:
            matched_patient = pat
            break

    # Date extraction (simplistic for Demo)
    date_match = "2026-09-19" # Default fallback for September dates
    if "18" in text:
        date_match = "2026-09-18"
    elif "20" in text:
        date_match = "2026-09-20"

    # Time extraction
    time_match = "10:00"
    if "09:00" in text or "9 am" in text:
        time_match = "09:00"
    elif "11:00" in text or "11 am" in text:
        time_match = "11:00"
    elif "14:00" in text or "2 pm" in text:
        time_match = "14:00"

    return {
        "doctor_name": matched_doc,
        "patient_name": matched_patient,
        "date": date_match,
        "time": time_match
    }

if __name__ == "__main__":
    tests = [
        "What is the medical history of Aarav Sharma?",
        "I want to book an appointment with Dr. Ramesh Gupta",
        "When is Dr. Anil Mehta available tomorrow?",
        "Do we have enough Amoxicillin in the pharmacy?",
        "Please dispense 5 tablets of Paracetamol",
        "Hello good morning"
    ]
    print("Testing Intent Classification:")
    for t in tests:
        print(f"'{t}' -> {classify_intent(t)}")
