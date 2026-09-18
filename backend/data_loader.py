import json
import os
from typing import Dict, List, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

def load_patients() -> Dict[str, Dict[str, Any]]:
    path = os.path.join(DATA_DIR, "patients.json")
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        patients_list = json.load(f)
    return {p["patient_id"]: p for p in patients_list}

def load_doctors() -> Dict[str, Dict[str, Any]]:
    path = os.path.join(DATA_DIR, "doctors.json")
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        doctors_list = json.load(f)
    return {d["doctor_id"]: d for d in doctors_list}

def load_schedule() -> List[Dict[str, Any]]:
    path = os.path.join(DATA_DIR, "schedule.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_inventory() -> Dict[str, Dict[str, Any]]:
    path = os.path.join(DATA_DIR, "inventory.json")
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        inventory_list = json.load(f)
    return {item["drug_name"]: item for item in inventory_list}

# Load at module level on backend startup
patients = load_patients()
doctors = load_doctors()
schedule = load_schedule()
inventory = load_inventory()

if __name__ == "__main__":
    print(f"Loaded {len(patients)} patients: {list(patients.keys())}")
    print(f"Loaded {len(doctors)} doctors: {list(doctors.keys())}")
    print(f"Loaded {len(schedule)} appointments.")
    print(f"Loaded {len(inventory)} inventory drugs: {list(inventory.keys())[:5]}...")
