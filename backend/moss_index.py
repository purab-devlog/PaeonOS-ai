import asyncio
import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from moss import MossClient, DocumentInfo, QueryOptions
import data_loader

load_dotenv()

_client = None
_session = None
_ready = False

def is_ready() -> bool:
    return _ready

async def initialize_index():
    global _client, _session, _ready
    
    _client = MossClient(
        os.getenv("MOSS_PROJECT_ID"),
        os.getenv("MOSS_PROJECT_KEY")
    )
    
    _session = await _client.session(index_name="paeanos-patients")
    
    docs = []
    for p_id, patient in data_loader.patients.items():
        text_content = (
            f"{patient.get('name', '')} "
            f"{', '.join(patient.get('conditions', []))} "
            f"{', '.join(patient.get('current_medications', []))} "
            f"{', '.join(patient.get('allergies', []))} "
            f"{patient.get('last_visit_notes', '')} "
            f"{', '.join(patient.get('past_treatments', []))}"
        )
        docs.append(DocumentInfo(
            id=p_id,
            text=text_content,
            metadata={"patient_id": p_id, "name": patient.get("name")}
        ))
    
    await _session.add_docs(docs)
    _ready = True
    print(f"[Moss Index] Real Moss SessionIndex initialized with {len(docs)} patients.")

async def query_patient(query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
    global _session
    if _session is None:
        await initialize_index()
    
    results = await _session.query(query_text, QueryOptions(top_k=top_k))
    
    matched_patients = []
    for doc in results.docs:
        patient = data_loader.patients.get(doc.id)
        if patient:
            matched_patients.append({**patient, "score": doc.score})
    
    return matched_patients

if __name__ == '__main__':
    async def test():
        await initialize_index()
        results = await query_patient("diabetic patient on metformin")
        print("\n--- Search Results ---")
        for p in results:
            print(f"- {p['name']}: {p['conditions']} (score: {p['score']:.3f})")
    asyncio.run(test())
