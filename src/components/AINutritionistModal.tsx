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
    if (result.recommended_item_ids && Array.isArray(result.recommended_item_ids)) {
      return menuItems.filter((m) => result.recommended_item_ids.includes(m._id));
    }
    if (result.recommendations && Array.isArray(result.recommendations)) {
      return result.recommendations.map((r: any) => {
        return menuItems.find((m) => m._id === r.id) || r;
      }).filter(Boolean);
    }
    return menuItems.slice(0, 2);
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
              <span className="text-[11px] font-semibold text-emerald-800">{result.macro_summary}</span>
            </div>

            <p className="text-slate-800 leading-relaxed font-medium">
              {result.rationale}
            </p>

            {/* Recommended dishes from live menu */}
            <div className="space-y-3 pt-2">
              <span className="text-slate-700 font-bold block">Recommended Dishes on Today&apos;s Menu:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedList.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{item.price.toFixed(2)} • {item.calories} kcal • {item.protein_g}g Protein
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(item);
                        onClose();
                      }}
                      className="flex items-center justify-center space-x-1 rounded-lg bg-emerald-600 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add to Tray</span>
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
