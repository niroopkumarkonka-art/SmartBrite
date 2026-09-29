"""
SmartBite Campus OS - Python Inventory Optimization & Economic Order Quantity (EOQ) Engine
Implements Wilson's classical lot-sizing model, safety stock variance buffers,
reorder point (ROP) calculations, and ingredient depletion forecasting based on active orders.
"""

import sys
import json
import math
from typing import Dict, List, Any

# Recipe bill-of-materials (BOM) mapping meal items to raw ingredient kilograms
RECIPE_BOM = {
    "Teriyaki Glazed Salmon Bowl": {
        "Atlantic Salmon": 0.18,
        "Jasmine Brown Rice": 0.12,
        "Edamame": 0.05
    },
    "Char-Grilled Herb Chicken Breast": {
        "Free-range Chicken Breast": 0.22,
        "Roasted Sweet Potatoes": 0.15
    },
    "Mediterranean Falafel & Quinoa Mezze": {
        "Organic Quinoa": 0.14,
        "Cucumber": 0.08,
        "Cherry Tomatoes": 0.08
    },
    "Artisan Avocado & Poached Egg Sourdough": {
        "Haas Avocado": 0.10,
        "Rustic Sourdough": 0.09
    },
    "Crispy Tofu & Sesame Rice Noodle Wrap": {
        "Pressed Tofu": 0.16,
        "Rice Vermicelli": 0.10
    }
}

def calculate_eoq_and_reorder_points(
    inventory_items: List[Dict[str, Any]],
    recent_orders: List[Dict[str, Any]],
    ordering_cost_s: float = 24.0,   # Fixed procurement cost per purchase order
    holding_cost_rate_h: float = 0.18 # 18% annual inventory carrying cost
) -> Dict[str, Any]:
    """
    Computes for each raw ingredient:
    1. Daily consumption rate (d) based on BOM decomposition of recent sales.
    2. Annualized demand (D = d * 365).
    3. Optimal batch replenishment size (EOQ).
    4. Safety stock buffer: Z * sigma_L (assuming 95% cycle-service level Z=1.65).
    5. Reorder Point (ROP = d * LeadTime + SafetyStock).
    6. Days of supply remaining before stockout.
    """
    # 1. Compute consumption from recent orders
    usage_map: Dict[str, float] = {}
    for ord in recent_orders:
        for line in ord.get("items", []):
            item_name = line.get("name", "")
            qty = line.get("qty", 1)
            bom = RECIPE_BOM.get(item_name, {})
            for ing, kg_per_portion in bom.items():
                usage_map[ing] = usage_map.get(ing, 0.0) + (kg_per_portion * qty)

    results = []
    restock_alerts = []

    lead_time_days = 2.0 # 2-day delivery from regional campus food supplier

    for ing in inventory_items:
        name = ing.get("ingredient_name", "")
        current_stock = float(ing.get("current_stock_kg", 5.0))
        unit_cost = 8.50 # Average $/kg baseline

        # Daily usage rate estimate (if no recent orders, fallback to standard consumption)
        recent_usage = usage_map.get(name, 0.0)
        daily_usage = max(recent_usage * 1.5, 1.8) # Min 1.8 kg/day campus baseline
        annual_demand = daily_usage * 300 # 300 academic operating days

        holding_cost_unit = max(unit_cost * holding_cost_rate_h, 0.50)

        # Wilson's EOQ Formula: sqrt((2 * D * S) / H)
        eoq = math.sqrt((2.0 * annual_demand * ordering_cost_s) / holding_cost_unit)
        eoq = round(eoq, 1)

        # Safety stock buffer (Z = 1.645 for 95% service level)
        demand_std_dev = daily_usage * 0.25
        safety_stock = round(1.645 * math.sqrt(lead_time_days) * demand_std_dev, 2)

        # Reorder Point (ROP) = (daily_usage * lead_time) + safety_stock
        lead_time_demand = daily_usage * lead_time_days
        rop = round(lead_time_demand + safety_stock, 1)

        days_remaining = round(current_stock / max(daily_usage, 0.1), 1)
        is_critical = current_stock <= rop

        if is_critical:
            restock_alerts.append({
                "ingredient": name,
                "current_stock_kg": current_stock,
                "rop_threshold_kg": rop,
                "recommended_order_kg": eoq,
                "urgency": "IMMEDIATE" if current_stock < (rop * 0.5) else "SOON",
                "days_to_stockout": days_remaining
            })

        results.append({
            "id": ing.get("_id", ""),
            "ingredient": name,
            "category": ing.get("category", "General"),
            "current_stock_kg": current_stock,
            "daily_burn_rate_kg": round(daily_usage, 2),
            "safety_stock_kg": safety_stock,
            "reorder_point_kg": rop,
            "economic_order_qty_kg": eoq,
            "days_of_supply": days_remaining,
            "status": "Critical Low" if current_stock <= rop else ("Adequate" if days_remaining > 4 else "Moderate")
        })

    # Sort results so low-stock items appear first
    results.sort(key=lambda x: x["days_of_supply"])

    return {
        "engine": "SmartBite Python EOQ & Inventory Optimization Engine v2.1",
        "lead_time_days": lead_time_days,
        "service_level": "95.0% (Z=1.65)",
        "ordering_cost_per_po": ordering_cost_s,
        "holding_cost_annual_rate": f"{int(holding_cost_rate_h * 100)}%",
        "critical_alerts_count": len(restock_alerts),
        "restock_alerts": restock_alerts,
        "inventory_optimization_table": results
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
            res = calculate_eoq_and_reorder_points(
                payload.get("inventory", []),
                payload.get("orders", [])
            )
            print(json.dumps(res, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)
    else:
        sample_inv = [
            {"_id": "inv_01", "ingredient_name": "Atlantic Salmon", "category": "Proteins", "current_stock_kg": 4.5},
            {"_id": "inv_02", "ingredient_name": "Free-range Chicken Breast", "category": "Proteins", "current_stock_kg": 12.0},
            {"_id": "inv_03", "ingredient_name": "Dinosaur Kale", "category": "Produce", "current_stock_kg": 1.8},
            {"_id": "inv_04", "ingredient_name": "Organic Quinoa", "category": "Grains", "current_stock_kg": 16.0}
        ]
        sample_ord = [
            {"items": [{"name": "Teriyaki Glazed Salmon Bowl", "qty": 3}]}
        ]
        res = calculate_eoq_and_reorder_points(sample_inv, sample_ord)
        print(json.dumps(res, indent=2))
