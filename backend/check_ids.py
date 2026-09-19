import json

with open('data/schedule.json') as f:
    schedule = json.load(f)

# Check what patient_ids are referenced
ids = set(a['patient_id'] for a in schedule)
print('Schedule references these patient IDs:', ids)

with open('data/patients.json') as f:
    patients = json.load(f)

patient_ids = set(p['patient_id'] for p in patients)
print('Patients file has these IDs (first 15):', list(patient_ids)[:15])

missing = ids - patient_ids
print('IDs in schedule but missing from patients:', missing)
