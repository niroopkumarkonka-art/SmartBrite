import React, { useState } from "react";
import {
  Sparkles,
  X,
  Dumbbell,
  Brain,
  Leaf,
  Heart,
  Flame,
  Check,
  Plus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { MenuItem } from "../types";

interface AINutritionistModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export const AINutritionistModal: React.FC<AINutritionistModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onAddToCart,
}) => {
  const [goal, setGoal] = useState<string>("High Protein for Gym & Muscle Recovery");
  const [dietary, setDietary] = useState<string>("None");
  const [allergy, setAllergy] = useState<string>("None");
  const [targetCalories, setTargetCalories] = useState<number>(550);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleConsult = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          dietaryPreferences: dietary,
          allergies: allergy,
          targetCalories,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedItems = (): MenuItem[] => {
    if (!result) return [];
    if (result.recommended_items && Array.isArray(result.recommended_items) && result.recommended_items.length > 0) {
      return result.recommended_items;
    }
    if (result.recommended_item_ids && Array.isArray(result.recommended_item_ids)) {
      const found = menuItems.filter((m) => 
        result.recommended_item_ids.includes(m._id) || 
        result.recommended_item_ids.includes(m.name)
      );
      if (found.length > 0) return found;
    }
    if (result.recommendations && Array.isArray(result.recommendations)) {
      const found = result.recommendations.map((r: any) => {
        return menuItems.find((m) => m._id === r.id || m._id === r._id || m.name === r.name) || r;
      }).filter(Boolean);
      if (found.length > 0) return found;
    }

    // Smart fallback strictly matching goal, dietary preference, and allergies
    const diet = dietary.toLowerCase();
    const all = allergy.toLowerCase();

    let candidates = menuItems.filter((m) => {
      const tags = (m.dietary_tags || []).map((t) => t.toLowerCase());
      const name = m.name.toLowerCase();
      const ing = (m.ingredients || []).map((i) => i.toLowerCase()).join(" ");

      if (diet === "vegetarian" || diet === "veg") {
        if (!tags.some((t) => t.includes("veg") && !t.includes("non-veg")) || name.includes("chicken") || name.includes("meat")) return false;
      } else if (diet === "vegan") {
        if (!tags.some((t) => t.includes("vegan")) || name.includes("paneer") || name.includes("cheese") || name.includes("chicken")) return false;
      } else if (diet === "non-veg") {
        if (!tags.some((t) => t.includes("non-veg")) && !name.includes("chicken") && !name.includes("meat")) return false;
      }

      if (all.includes("dairy") && (ing.includes("milk") || ing.includes("cheese") || ing.includes("paneer") || name.includes("paneer") || name.includes("gelato"))) return false;
      if (all.includes("gluten") && (ing.includes("flour") || ing.includes("wheat") || name.includes("waffle") || name.includes("burger"))) return false;
      if (all.includes("nut") && (ing.includes("nut") || name.includes("nutella"))) return false;
      if (all.includes("egg") && (ing.includes("egg") || name.includes("egg"))) return false;

      return true;
    });

    if (candidates.length === 0) candidates = menuItems;

    // Rank according to user's goal
    candidates.sort((a, b) => {
      if (goal.includes("Protein")) return b.protein_g - a.protein_g;
      if (goal.includes("Low-Calorie")) return Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories);
      if (goal.includes("Brain") || goal.includes("Exam")) {
        const scoreB = b.category.includes("Coffee") || b.name.includes("Oat") ? 10 : 0;
        const scoreA = a.category.includes("Coffee") || a.name.includes("Oat") ? 10 : 0;
        return scoreB - scoreA;
      }
      return b.protein_g - a.protein_g;
    });

    return candidates.slice(0, 4);
  };

  const recommendedList = getRecommendedItems();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>AI Meal Guide</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Healthy Eating Helper
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tell us your goals, and we&apos;ll pick the healthiest, tastiest meals on today&apos;s menu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Preferences Form */}
        <div className="space-y-4 text-xs">
          {/* Health & Energy Goal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              What is your primary goal today?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "High Protein for Gym & Muscle Recovery", label: "High Protein & Workout Energy", icon: Dumbbell },
                { id: "Sustained Cognitive Energy for Exams", label: "Brain Power for Studying", icon: Brain },
                { id: "Clean Low-Calorie & High Fiber Cut", label: "Light & Low Calorie", icon: Flame },
                { id: "Plant-Based Anti-Inflammatory Wellness", label: "Plant-Based & Healthy Greens", icon: Leaf },
              ].map((g) => {
                const Icon = g.icon;
                const isSelected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-2xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-xs">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calorie Limit Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Target Calories:</label>
              <span className="font-bold text-emerald-700 text-sm">{targetCalories} kcal</span>
            </div>
            <input
              type="range"
              min="300"
              max="900"
              step="50"
              value={targetCalories}
              onChange={(e) => setTargetCalories(parseInt(e.target.value, 10))}
              className="accent-emerald-600 h-1.5 w-full bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Dietary & Allergy Exclusions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Diet Preference:</label>
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="None">No Preference</option>
                <option value="Non-Veg">Non-Veg (Chicken, Meat & Fish)</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan (Plant-Only)</option>
                <option value="Gluten-Free">Gluten-Free</option>
                <option value="Dairy-Free">Dairy-Free</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Allergies to Avoid:</label>
              <select
                value={allergy}
                onChange={(e) => setAllergy(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="None">None</option>
                <option value="Peanuts">Peanuts / Tree Nuts</option>
                <option value="Shellfish">Shellfish</option>
                <option value="Dairy">Dairy (Milk / Cheese)</option>
                <option value="Soy">Soy</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleConsult}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-600/20"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loading ? "Finding Your Best Meals..." : "Find My Recommended Meals"}</span>
          </button>
        </div>

        {/* AI Results Display */}
        {result && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4 text-xs shadow-2xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                Why These Meals Fit You
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                {result.macro_summary || (result.daily_macros ? `${result.daily_macros.calories} kcal · ${result.daily_macros.protein}g protein` : "")}
              </span>
            </div>

            <p className="text-slate-800 leading-relaxed font-medium">
              {result.reasoning || result.rationale || "Meals scientifically selected matching your dietary targets and allergen restrictions."}
            </p>

            {/* Recommended dishes from live menu with rich photos & macro details */}
            <div className="space-y-3 pt-2">
              <span className="text-slate-800 font-bold block text-sm">Recommended Dishes on Today&apos;s Menu:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {recommendedList.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 space-y-3 shadow-xs hover:border-emerald-400 hover:shadow-md transition group overflow-hidden"
                  >
                    {/* Dish Image & Category Badges */}
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                          {item.category}
                        </span>
                        {item.dietary_tags?.[0] && (
                          <span className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                            {item.dietary_tags[0]}
                          </span>
                        )}
                      </div>
                      <span className="absolute bottom-2 right-2 rounded-lg bg-black/85 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400 backdrop-blur-xs">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Dish Name & Macros */}
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-emerald-700 transition">
                        {item.name}
                      </h4>

                      {/* Macro Grid Pills */}
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Energy</span>
                          <span className="font-bold text-slate-800">{item.calories} <span className="text-[7px]">kcal</span></span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Protein</span>
                          <span className="font-bold text-emerald-600">{item.protein_g}g</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Carbs</span>
                          <span className="font-bold text-blue-600">{item.carbs_g}g</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">Fat</span>
                          <span className="font-bold text-amber-600">{item.fat_g}g</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(item);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 py-2 text-xs font-bold text-white transition active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add to Tray (₹{item.price.toFixed(2)})</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {result.tips && Array.isArray(result.tips) && (
              <div className="rounded-xl bg-white p-3 space-y-1 text-[11px] text-slate-600 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Helpful Health Tips:</span>
                {result.tips.map((tip: string, i: number) => (
                  <div key={i} className="flex items-start space-x-1.5">
                    <span className="text-emerald-600">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
