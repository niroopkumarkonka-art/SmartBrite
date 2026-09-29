"""
SmartBite Campus OS - Python Order Processing & Kitchen Dispatch Logic
Computes dynamic kitchen queue scheduling, queue latency forecasting,
tray nutritional aggregation, and concurrency transaction validations.
"""

import sys
import json
import datetime
from typing import Dict, List, Any

# Station concurrency capacities (number of simultaneous meals prepared)
STATION_CONCURRENCY = {
    "Grill & Saute": 4,
    "Cold Assembly & Bowls": 6,
    "Panini Press & Wraps": 3,
    "Espresso & Beverage Bar": 2
}

ITEM_STATION_MAP = {
    "Grain Bowls": "Cold Assembly & Bowls",
    "Salads": "Cold Assembly & Bowls",
    "Main Entrees": "Grill & Saute",
    "Wraps & Paninis": "Panini Press & Wraps",
    "Breakfast": "Grill & Saute",
    "Beverages": "Espresso & Beverage Bar"
}

def estimate_order_dispatch(
    active_orders: List[Dict[str, Any]],
    new_order_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Simulates real-time kitchen queue dynamics:
    1. Tallies currently preparing/placed dishes by station.
    2. Calculates queue bottleneck station for new incoming order.
    3. Computes estimated ready-time with dynamic variance based on queue depth.
    4. Computes customer tray macro-nutrient totals and balance ratio.
    """
    # 1. Station queue tally
    station_queues: Dict[str, int] = {k: 0 for k in STATION_CONCURRENCY.keys()}
    for ord in active_orders:
        if ord.get("status") in ["placed", "preparing"]:
            for it in ord.get("items", []):
                # Approximation from category
                station = "Grill & Saute"
                name_low = it.get("name", "").lower()
                if "bowl" in name_low or "salad" in name_low:
                    station = "Cold Assembly & Bowls"
                elif "panini" in name_low or "wrap" in name_low:
                    station = "Panini Press & Wraps"
                elif "latte" in name_low or "juice" in name_low or "matcha" in name_low:
                    station = "Espresso & Beverage Bar"
                station_queues[station] += it.get("qty", 1)

    # 2. Analyze new order items
    total_prep_work_mins = 0
    max_station_delay = 0
    bottleneck_station = "Cold Assembly & Bowls"

    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0

    for it in new_order_items:
        prep_time = it.get("prep_time_minutes", 6)
        qty = it.get("qty", 1)
        total_prep_work_mins += (prep_time * qty)

        category = it.get("category", "Grain Bowls")
        station = ITEM_STATION_MAP.get(category, "Cold Assembly & Bowls")
        current_queue_depth = station_queues.get(station, 0)
        capacity = STATION_CONCURRENCY.get(station, 3)

        # Station wait time: (queue / capacity) * avg_prep
        wait_mins = (current_queue_depth / float(capacity)) * 4.5
        if wait_mins > max_station_delay:
            max_station_delay = wait_mins
            bottleneck_station = station

        total_calories += it.get("calories", 0) * qty
        total_protein += it.get("protein_g", 0) * qty
        total_carbs += it.get("carbs_g", 0) * qty
        total_fat += it.get("fat_g", 0) * qty

    # Estimated completion in minutes
    base_item_prep = max(4.0, (total_prep_work_mins / max(len(new_order_items), 1)) * 0.75)
    estimated_mins = int(round(base_item_prep + max_station_delay + 2.0))
    estimated_mins = max(4, min(estimated_mins, 25))

    now = datetime.datetime.now()
    ready_time_obj = now + datetime.timedelta(minutes=estimated_mins)
    ready_time_str = ready_time_obj.strftime("%I:%M %p").lstrip("0")

    # Tray Macro health balance rating
    macro_balance_score = 85
    if total_protein > 30 and total_calories < 800:
        macro_balance_score = 95
    elif total_calories > 1100:
        macro_balance_score = 70

    return {
        "engine": "SmartBite Python Kitchen Queue & Order Dispatch Engine v1.8",
        "estimated_wait_minutes": estimated_mins,
        "estimated_pickup_time": ready_time_str,
        "bottleneck_station": bottleneck_station,
        "active_kitchen_load": {
            "total_pending_dishes": sum(station_queues.values()),
            "station_breakdown": station_queues
        },
        "tray_nutrition_aggregate": {
            "total_calories": total_calories,
            "total_protein_g": total_protein,
            "total_carbs_g": total_carbs,
            "total_fat_g": total_fat,
            "macro_balance_score": macro_balance_score,
            "dietary_rating": "Optimal Nutrition" if macro_balance_score >= 85 else "Standard Dining"
        }
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
            res = estimate_order_dispatch(
                payload.get("activeOrders", []),
                payload.get("newOrderItems", [])
            )
            print(json.dumps(res, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)
    else:
        sample_active = [
            {"status": "preparing", "items": [{"name": "Salmon Bowl", "qty": 2}]},
            {"status": "placed", "items": [{"name": "Herb Chicken", "qty": 1}]}
        ]
        sample_items = [
            {"name": "Mediterranean Falafel", "category": "Grain Bowls", "prep_time_minutes": 6, "qty": 1, "calories": 490, "protein_g": 19, "carbs_g": 64, "fat_g": 14}
        ]
        res = estimate_order_dispatch(sample_active, sample_items)
        print(json.dumps(res, indent=2))
