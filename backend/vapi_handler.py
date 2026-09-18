import moss_index
import schedule
import inventory
import intent

async def handle_message(transcript: str, call_id: str = "") -> str:
    user_intent = intent.classify_intent(transcript)

    if user_intent == "PATIENT_QUERY":
        results = await moss_index.query_patient(transcript, top_k=1)
        if results:
            p = results[0]
            conds = ", ".join(p.get("conditions", []))
            meds = ", ".join(p.get("current_medications", []))
            allergies = ", ".join(p.get("allergies", [])) or "no known allergies"
            return f"{p['name']} is {p['age']} years old with {conds}. Current medications include {meds}, with {allergies}."
        return "I could not locate a matching patient record in the local database."

    elif user_intent == "SCHEDULE_BOOK":
        entities = intent.extract_booking_entities(transcript)
        patient_name = entities["patient_name"] or "Inbound Patient"
        doc_id = "DR003" # Default Dr. Ramesh Gupta
        if entities["doctor_name"]:
            for d_id, doc in schedule.doctors_db.items():
                if doc["name"].lower() == entities["doctor_name"].lower():
                    doc_id = d_id
                    break
        
        appt = schedule.book_appointment(patient_name, doc_id, entities["date"], entities["time"])
        doc_name = schedule.doctors_db.get(doc_id, {}).get("name", "the doctor")
        return f"Successfully booked an appointment for {patient_name} with {doc_name} on {appt['date']} at {appt['time']}."

    elif user_intent == "SCHEDULE_CHECK":
        entities = intent.extract_booking_entities(transcript)
        doc_id = "DR001"
        slots = schedule.get_doctor_availability(doc_id, "2026-09-18")
        slots_str = ", ".join(slots[:3]) if slots else "no slots available"
        return f"Dr. Anil Mehta is available on September 18th at {slots_str}."

    elif user_intent == "PHARMACY":
        low_stock = inventory.get_low_stock()
        if low_stock:
            item = low_stock[0]
            return f"Warning: {item['drug_name']} is below the reorder threshold with only {item['current_stock']} {item['unit']} remaining."
        return "Pharmacy inventory levels are currently sufficient across all essential medications."

    return "Thank you for contacting Paeon OS Hospital Management. How may I assist with patient lookup or appointments today?"

if __name__ == "__main__":
    import asyncio
    async def run_tests():
        await moss_index.initialize_index()
        print("\n--- Spoken Voice Agent Responses ---")
        print(await handle_message("What are the conditions for Aarav Sharma?"))
        print(await handle_message("Book an appointment for Priya Patel with Dr Ramesh Gupta"))
        print(await handle_message("Are there any low stock drugs in pharmacy?"))

    asyncio.run(run_tests())
