import datetime
import json
import os
from contextlib import asynccontextmanager
from typing import Dict, Any, Set, Optional
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import data_loader
import moss_index
import schedule
import inventory
import vapi_handler

active_calls: Set[str] = set()
error_log = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Moss Local Index
    await moss_index.initialize_index()
    yield

app = FastAPI(title="Paeon OS Local AI Hospital System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BookingRequest(BaseModel):
    patient_name: str
    doctor_id: str
    date: str
    time: str

class DispenseRequest(BaseModel):
    drug_name: str
    quantity: int

@app.get("/")
def read_root():
    return {"status": "ok", "system": "Paeon OS"}

@app.get("/health")
async def health():
    return {"status": "healthy", "moss_ready": moss_index.is_ready()}

@app.get("/vapi/status")
async def vapi_status():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.vapi.ai/assistant",
                headers={"Authorization": f"Bearer {os.getenv('VAPI_API_KEY')}"}
            )
            return {"connected": response.status_code == 200}
    except Exception:
        return {"connected": False}

@app.get("/errors")
async def get_errors():
    return error_log

@app.post("/vapi/webhook")
async def vapi_webhook(request: Request):
    try:
        payload = await request.json()
        message = payload.get("message", {})
        msg_type = message.get("type")
        call = message.get("call", {})
        call_id = call.get("id", "")

        if msg_type == "call-start":
            if call_id:
                active_calls.add(call_id)
            return {"status": "started"}

        elif msg_type == "end-of-call-report":
            if call_id in active_calls:
                active_calls.remove(call_id)
            return {"status": "ended"}

        # Handles both 'tool-calls' (Vapi standard) and 'function-call' (legacy)
        elif msg_type in ["tool-calls", "function-call"]:
            tool_call_id = None
            query = ""

            # Format 1: Vapi Tool Calls Array
            tool_call_list = message.get("toolCallList", [])
            if tool_call_list:
                tool_call = tool_call_list[0]
                tool_call_id = tool_call.get("id")
                function_data = tool_call.get("function", {})
                arguments = function_data.get("arguments", {})
                
                # Handle arguments whether Vapi sends them as a dict or JSON string
                if isinstance(arguments, str):
                    try:
                        arguments = json.loads(arguments)
                    except Exception:
                        arguments = {}

                query = arguments.get("query", "")

            # Format 2: Direct Tool Calls Array
            elif "toolCalls" in message:
                tool_call = message["toolCalls"][0]
                tool_call_id = tool_call.get("id")
                function_data = tool_call.get("function", {})
                arguments = function_data.get("arguments", {})
                if isinstance(arguments, str):
                    try:
                        arguments = json.loads(arguments)
                    except Exception:
                        arguments = {}
                query = arguments.get("query", "")

            # Format 3: Legacy Function Call
            else:
                function_call = message.get("functionCall", {})
                tool_call_id = function_call.get("id")
                parameters = function_call.get("parameters", {})
                query = parameters.get("query", parameters.get("transcript", ""))

            # Execute business logic
            spoken_response = await vapi_handler.handle_message(query, call_id)

            return {
                "results": [
                    {
                        "toolCallId": tool_call_id,
                        "result": spoken_response
                    }
                ]
            }

        return {"status": "ignored"}
    except Exception as e:
        error_log.append({
            "timestamp": datetime.datetime.now().isoformat(),
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail="Webhook processing error")

@app.get("/appointments")
def get_appointments_endpoint(date: Optional[str] = None):
    target_date = date or datetime.date.today().strftime("%Y-%m-%d")
    return schedule.get_appointments(target_date)

@app.post("/appointments/book")
def book_appointment_endpoint(req: BookingRequest):
    return schedule.book_appointment(req.patient_name, req.doctor_id, req.date, req.time)

@app.post("/appointments/checkin/{appointment_id}")
def checkin_endpoint(appointment_id: str):
    res = schedule.check_in(appointment_id)
    if not res:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return res

@app.get("/inventory")
def get_inventory_endpoint():
    return inventory.get_inventory()

@app.post("/inventory/dispense")
def dispense_endpoint(req: DispenseRequest):
    return inventory.dispense(req.drug_name, req.quantity)

@app.get("/inventory/alerts")
def get_alerts_endpoint():
    return inventory.get_alerts()

@app.get("/patients/search")
async def search_patients_endpoint(q: str):
    return await moss_index.query_patient(q)

@app.get("/stats")
def get_stats_endpoint():
    today_appts = schedule.get_appointments("2026-09-18")
    missed_followups = schedule.get_missed_followups()
    low_stock_items = inventory.get_low_stock()

    return {
        "today_appointments_count": len(today_appts),
        "missed_followups_count": len(missed_followups),
        "low_stock_drugs_count": len(low_stock_items),
        "active_calls_count": len(active_calls)
    }

@app.get("/doctors")
def get_doctors():
    return list(data_loader.doctors.values())

@app.get("/docotrs/{doctor_id}/availability")
def get_availability(doctor_id: str, date:str):
    returnschedule.get_doctor_availability(doctor_id, date)
