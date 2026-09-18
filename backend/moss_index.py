import asyncio
from typing import List, Dict, Any, Tuple
import data_loader

class MossSessionIndex:
    """Local-first fallback in-memory search vector store simulating Moss SessionIndex."""
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []

    def add_docs(self, docs: List[Dict[str, Any]]):
        self.documents.extend(docs)

    def query(self, query_text: str, top_k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
        query_words = set(query_text.lower().split())
        scored_results = []

        for doc in self.documents:
            text = doc["text"].lower()
            score = 0.0
            for word in query_words:
                if len(word) > 2 and word in text:
                    score += 1.0
            
            # Additional exact name match boost
            patient_name = doc["metadata"].get("name", "").lower()
            if any(w in patient_name for w in query_words if len(w) > 2):
                score += 3.0

            if score > 0:
                scored_results.append((doc["metadata"], score))

        scored_results.sort(key=lambda x: x[1], reverse=True)
        return scored_results[:top_k]

session = None

async def initialize_index():
    global session
    session = MossSessionIndex()
    docs = []
    
    for p_id, patient in data_loader.patients.items():
        text_content = f"{patient.get('name', '')} " \
                       f"{', '.join(patient.get('conditions', []))} " \
                       f"{', '.join(patient.get('current_medications', []))} " \
                       f"{', '.join(patient.get('allergies', []))} " \
                       f"{patient.get('last_visit_notes', '')} " \
                       f"{', '.join(patient.get('past_treatments', []))}"
        
        docs.append({
            "id": p_id,
            "text": text_content,
            "metadata": patient
        })
        
    session.add_docs(docs)
    print(f"[Moss Index] Initialized in-memory index with {len(docs)} patient documents.")

async def query_patient(query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
    global session
    if session is None:
        await initialize_index()
    results = session.query(query_text, top_k=top_k)
    return [match[0] for match in results]

if __name__ == '__main__':
    async def test():
        await initialize_index()
        results = await query_patient("diabetic patient on metformin")
        print("\n--- Search Results for 'diabetic patient on metformin' ---")
        for p in results:
            print(f"- {p['name']} (ID: {p['patient_id']}): {p['conditions']}")
            
    asyncio.run(test())
