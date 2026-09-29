"""
SmartBite Campus OS - Python Central Microservice Dispatcher
Exposes all backend logic modules (Demand Forecasting, Nutrition Optimization,
Waste Analytics, Inventory EOQ, and Order Scheduling) to the Express web server.
"""

import sys
import json
import time

from demand_forecasting import calculate_demand_forecast
from nutrition_optimizer import optimize_nutrition
from waste_analytics import analyze_waste
from inventory_optimizer import calculate_eoq_and_reorder_points
from order_processor import estimate_order_dispatch

def handle_request(command: str, payload: dict) -> dict:
    start_time = time.time()
    result = {}

    if command == "forecast":
        result = calculate_demand_forecast(
            payload.get("dayOfWeek", "Wednesday"),
            payload.get("weather", "Sunny & Mild (20°C)"),
            payload.get("campusEvent", "Standard Academic Week"),
            payload.get("menuItems", [])
        )
    elif command == "nutrition":
        result = optimize_nutrition(
            payload.get("goal", "High Protein"),
            int(payload.get("targetCalories", 550)),
            payload.get("dietaryPreferences", "None"),
            payload.get("allergies", []),
            payload.get("availableItems", [])
        )
    elif command == "waste":
        result = analyze_waste(
            payload.get("wasteRecords", []),
            float(payload.get("totalPreparedKg", 650.0))
        )
    elif command == "inventory":
        result = calculate_eoq_and_reorder_points(
            payload.get("inventory", []),
            payload.get("orders", [])
        )
    elif command == "order_dispatch":
        result = estimate_order_dispatch(
            payload.get("activeOrders", []),
            payload.get("newOrderItems", [])
        )
    else:
        result = {"error": f"Unknown Python command: '{command}'"}

    duration_ms = round((time.time() - start_time) * 1000, 2)
    result["_python_execution_time_ms"] = duration_ms
    result["_python_runtime"] = f"Python {sys.version.split()[0]}"
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 main.py <command> [json_payload]"}))
        sys.exit(1)

    cmd = sys.argv[1]
    raw_payload = "{}"

    if len(sys.argv) > 2:
        raw_payload = sys.argv[2]
    else:
        # Check if stdin has data
        if not sys.stdin.isatty():
            raw_payload = sys.stdin.read()

    try:
        data = json.loads(raw_payload) if raw_payload.strip() else {}
    except Exception as err:
        print(json.dumps({"error": f"Invalid JSON payload: {err}"}))
        sys.exit(1)

    output = handle_request(cmd, data)
    print(json.dumps(output, indent=2))
