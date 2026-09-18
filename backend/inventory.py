import datetime
from typing import List, Dict, Any
import data_loader

inventory_db: Dict[str, Dict[str, Any]] = data_loader.inventory
alerts_list: List[Dict[str, Any]] = []

def get_inventory() -> List[Dict[str, Any]]:
    return sorted(list(inventory_db.values()), key=lambda x: x["drug_name"])

def dispense(drug_name: str, quantity: int) -> Dict[str, Any]:
    item = inventory_db.get(drug_name)
    if not item:
        # Case insensitive match search
        for name, data in inventory_db.items():
            if drug_name.lower() in name.lower():
                item = data
                break

    if not item:
        return {"error": f"Drug '{drug_name}' not found in inventory."}

    item["current_stock"] -= quantity
    is_low = item["current_stock"] < item["reorder_threshold"]

    if is_low:
        alert_entry = {
            "drug_name": item["drug_name"],
            "current_stock": item["current_stock"],
            "reorder_threshold": item["reorder_threshold"],
            "timestamp": datetime.datetime.now().isoformat()
        }
        alerts_list.append(alert_entry)

    return {
        "drug_name": item["drug_name"],
        "new_stock": item["current_stock"],
        "is_low": is_low,
        "unit": item["unit"]
    }

def get_low_stock() -> List[Dict[str, Any]]:
    return [
        item for item in inventory_db.values()
        if item["current_stock"] < item["reorder_threshold"]
    ]

def get_alerts() -> List[Dict[str, Any]]:
    return alerts_list

if __name__ == "__main__":
    print("Testing Inventory module...")
    # Dispense Amoxicillin 250mg (starts at 8, so dispensing 3 drops it to 5 < 10)
    result = dispense("Amoxicillin 250mg", 3)
    print(f"Dispense Result: {result}")
    print(f"Is Low Flag Correct: {result.get('is_low') == True}")
    print(f"Current Alerts: {get_alerts()}")
