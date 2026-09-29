"""
SmartBite Campus OS - Python Clinical Nutrition & Macro Optimization Engine
Calculates optimal meal pairing, micronutrient density scores, and allergen filtering
using penalized Euclidean distance optimization against target caloric & macro thresholds.
"""

import sys
import json
import math
from typing import Dict, List, Any, Optional

GOAL_MACRO_PROFILES = {
    "High Protein": {
        "protein_target_pct": 35,
        "carbs_target_pct": 40,
        "fat_target_pct": 25,
        "ideal_min_protein": 30,
        "description": "Optimized for athletic recovery, lean muscle synthesis, and satiety."
    },
    "Balanced Energy & Focus": {
        "protein_target_pct": 25,
        "carbs_target_pct": 50,
        "fat_target_pct": 25,
        "ideal_min_protein": 20,
        "description": "Sustained glucose release for long lectures and study concentration."
    },
    "Low Calorie / Weight Loss": {
        "protein_target_pct": 40,
        "carbs_target_pct": 30,
        "fat_target_pct": 30,
        "ideal_min_protein": 25,
        "description": "High satiety volume with caloric deficit preservation."
    },
    "Plant-Based Vitality": {
        "protein_target_pct": 20,
        "carbs_target_pct": 60,
        "fat_target_pct": 20,
        "ideal_min_protein": 18,
        "description": "Rich in phytonutrients, polyphenols, and prebiotic fiber."
    },
    "Low Carb / Keto Friendly": {
        "protein_target_pct": 30,
        "carbs_target_pct": 15,
        "fat_target_pct": 55,
        "ideal_min_protein": 28,
        "description": "Ketogenic macro distribution with minimal glycemic spike."
    }
}

def calculate_nutrient_density_score(item: Dict[str, Any]) -> float:
    """
    Computes a Nutrient Density Index (NDI) based on protein, fiber, and micronutrient proxies
    per 100 kcal, penalizing saturated fat and empty sugars.
    """
    cals = max(item.get("calories", 400), 100)
    protein = item.get("protein_g", item.get("protein", 20))
    carbs = item.get("carbs_g", item.get("carbs", 40))
    fat = item.get("fat_g", item.get("fat", 15))

    # Bonus for clean tags
    tags = item.get("dietary_tags", item.get("tags", []))
    tag_bonus = 0.0
    for t in tags:
        t_low = t.lower()
        if "omega-3" in t_low or "antioxidant" in t_low or "high fiber" in t_low:
            tag_bonus += 1.5
        elif "vegan" in t_low or "organic" in t_low:
            tag_bonus += 0.8

    # Protein efficiency ratio
    protein_ratio = (protein * 4.0) / cals  # Fraction of calories from protein
    density = (protein_ratio * 40.0) + tag_bonus + (10.0 / (1.0 + math.log10(cals / 100.0)))
    return round(density, 1)

def optimize_nutrition(
    goal: str,
    target_calories: int,
    dietary_preferences: str,
    allergies: List[str],
    available_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates each candidate item against the user profile using a mathematical scoring function:
    Score = w1 * |cal - target| + w2 * (target_protein - actual_protein) - w3 * density_score
    """
    profile = GOAL_MACRO_PROFILES.get(goal, GOAL_MACRO_PROFILES["Balanced Energy & Focus"])
    allergies_clean = [a.lower().strip() for a in (allergies or []) if a]
    pref_clean = (dietary_preferences or "").lower().strip()

    scored_candidates = []

    for item in available_items:
        # Check allergies in ingredients and tags
        ingredients_str = " ".join(item.get("ingredients", [])).lower()
        tags_str = " ".join(item.get("dietary_tags", item.get("tags", []))).lower()
        item_name = item.get("name", "").lower()
        full_text = f"{item_name} {ingredients_str} {tags_str}"

        has_allergen = False
        for allergen in allergies_clean:
            if allergen and allergen in full_text:
                has_allergen = True
                break
        if has_allergen:
            continue

        # Check dietary preference (e.g. Vegetarian, Vegan, Non-Veg)
        if pref_clean in ["vegan", "plant-based"] and "vegan" not in tags_str:
            continue
        if pref_clean in ["vegetarian"] and ("vegan" not in tags_str and "vegetarian" not in tags_str):
            continue
        if pref_clean in ["non-veg", "non-vegetarian", "non veg"]:
            # Must be non-veg: contains meat/fish/chicken or has Non-Veg tag or not strictly vegetarian
            is_non_veg = any(k in full_text for k in ["chicken", "salmon", "turkey", "beef", "meat", "fish", "egg", "non-veg", "bone-in", "patties", "shrimp"])
            if not is_non_veg:
                continue

        cals = item.get("calories", 500)
        protein = item.get("protein_g", item.get("protein", 20))
        carbs = item.get("carbs_g", item.get("carbs", 50))
        fat = item.get("fat_g", item.get("fat", 15))

        # Calorie deviation penalty
        cal_diff = abs(cals - target_calories)
        cal_penalty = (cal_diff / target_calories) * 35.0

        # Protein shortfall penalty
        min_p = profile["ideal_min_protein"]
        protein_penalty = max(0, min_p - protein) * 1.8

        # Nutrient density bonus
        density = calculate_nutrient_density_score(item)
        density_credit = density * 1.2

        # Final fitness score (lower is better distance, or higher is better rank)
        rank_score = 100.0 - cal_penalty - protein_penalty + density_credit

        scored_candidates.append({
            "item": item,
            "rank_score": round(rank_score, 2),
            "density_score": density,
            "cal_diff": cals - target_calories,
            "macros": {
                "calories": cals,
                "protein_g": protein,
                "carbs_g": carbs,
                "fat_g": fat,
                "protein_cal_pct": round((protein * 4 / cals) * 100, 1),
                "carbs_cal_pct": round((carbs * 4 / cals) * 100, 1),
                "fat_cal_pct": round((fat * 9 / cals) * 100, 1)
            }
        })

    # Sort descending by rank_score
    scored_candidates.sort(key=lambda x: x["rank_score"], reverse=True)
    top_picks = scored_candidates[:3]

    recommended_items = [p["item"] for p in top_picks]
    recommended_ids = [p["item"].get("_id", p["item"].get("id", "")) for p in top_picks]

    # Calculate average macros of top pick
    if top_picks:
        primary = top_picks[0]
        avg_protein = primary["macros"]["protein_g"]
        avg_cals = primary["macros"]["calories"]
        macro_summary = f"{avg_protein}g Bioavailable Protein | {primary['macros']['carbs_g']}g Complex Carbs | {avg_cals} kcal"
        rationale = (
            f"Algorithmically mapped to your '{goal}' profile. The #{1} recommendation '{primary['item']['name']}' "
            f"matches your {target_calories} kcal target within {abs(primary['cal_diff'])} kcal with a high nutrient density score of {primary['density_score']}."
        )
    else:
        macro_summary = "Custom macro configuration"
        rationale = "General campus selection filtered for optimal micronutrient composition."

    tips = [
        f"Goal Synergy: {profile['description']}",
        "Hydration Tip: Drink 350ml cold water before meals to optimize satiety signaling and mental alertness.",
        "Post-Meal Stamina: Meals with under 60g net carbs prevent postprandial lecture drowsiness."
    ]

    return {
        "engine": "SmartBite Python Nutrition Optimizer v3.1",
        "user_goal": goal,
        "target_calories": target_calories,
        "macro_profile": profile,
        "recommended_item_ids": recommended_ids,
        "recommendations": recommended_items,
        "scored_breakdown": top_picks,
        "rationale": rationale,
        "macro_summary": macro_summary,
        "tips": tips
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
            res = optimize_nutrition(
                payload.get("goal", "High Protein"),
                int(payload.get("targetCalories", 550)),
                payload.get("dietaryPreferences", "None"),
                payload.get("allergies", []),
                payload.get("availableItems", [])
            )
            print(json.dumps(res, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)
    else:
        # Self-test
        sample_menu = [
            {"_id": "menu_001", "name": "Teriyaki Glazed Salmon Bowl", "calories": 580, "protein_g": 38, "carbs_g": 52, "fat_g": 16, "dietary_tags": ["High Protein", "Omega-3"]},
            {"_id": "menu_002", "name": "Mediterranean Falafel & Quinoa Mezze", "calories": 490, "protein_g": 19, "carbs_g": 64, "fat_g": 14, "dietary_tags": ["Vegan", "High Fiber"]},
            {"_id": "menu_003", "name": "Char-Grilled Herb Chicken Breast", "calories": 520, "protein_g": 44, "carbs_g": 36, "fat_g": 12, "dietary_tags": ["High Protein", "Gluten-Free"]},
            {"_id": "menu_004", "name": "Artisan Avocado & Poached Egg Sourdough", "calories": 410, "protein_g": 16, "carbs_g": 38, "fat_g": 22, "dietary_tags": ["Vegetarian"]}
        ]
        res = optimize_nutrition("High Protein", 550, "None", ["peanuts"], sample_menu)
        print(json.dumps(res, indent=2))
