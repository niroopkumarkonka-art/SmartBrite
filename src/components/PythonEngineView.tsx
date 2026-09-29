import React, { useState, useEffect } from "react";
import {
  Terminal,
  Cpu,
  Sparkles,
  BarChart2,
  Scale,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Play,
  Copy,
  Check,
  Flame,
  CloudRain,
  Sun,
  Calendar,
  Zap,
  Leaf,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { MenuItem, InventoryItem, Order, WasteRecord } from "../types";

interface PythonEngineViewProps {
  menuItems: MenuItem[];
  rawInventory: InventoryItem[];
  orders: Order[];
  wasteRecords: WasteRecord[];
  onRestockItem?: (menuItemId: string, qty: number) => Promise<void>;
}

export const PythonEngineView: React.FC<PythonEngineViewProps> = ({
  menuItems,
  rawInventory,
  orders,
  wasteRecords,
}) => {
  const [activeModule, setActiveModule] = useState<
    "forecast" | "nutrition" | "waste" | "inventory" | "code"
  >("forecast");

  // State for Forecast Module
  const [forecastDay, setForecastDay] = useState<string>("Wednesday");
  const [forecastWeather, setForecastWeather] = useState<string>("Rainy & Chilly (13°C)");
  const [forecastEvent, setForecastEvent] = useState<string>("Midterm Exam Week");
  const [isExecutingForecast, setIsExecutingForecast] = useState<boolean>(false);
  const [forecastResult, setForecastResult] = useState<any>(null);

  // State for Nutrition Module
  const [nutritionGoal, setNutritionGoal] = useState<string>("High Protein");
  const [targetCalories, setTargetCalories] = useState<number>(550);
  const [allergyFilter, setAllergyFilter] = useState<string>("peanuts");
  const [isExecutingNutrition, setIsExecutingNutrition] = useState<boolean>(false);
  const [nutritionResult, setNutritionResult] = useState<any>(null);

  // State for Waste Analytics Module
  const [wasteWeightKg, setWasteWeightKg] = useState<number>(4.5);
  const [wasteCause, setWasteCause] = useState<string>("overproduction");
  const [isExecutingWaste, setIsExecutingWaste] = useState<boolean>(false);
  const [wasteResult, setWasteResult] = useState<any>(null);

  // State for Inventory EOQ Module
  const [isExecutingInventory, setIsExecutingInventory] = useState<boolean>(false);
  const [inventoryResult, setInventoryResult] = useState<any>(null);

  // State for Source Code tab
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>("demand_forecasting.py");
  const [sourceCodes, setSourceCodes] = useState<Record<string, string>>({});
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Initial auto-runs
  useEffect(() => {
    handleRunForecast();
    handleRunNutrition();
    handleRunWaste();
    handleRunInventory();
  }, []);

  // Fetch Python Source Code for Code Viewer
  useEffect(() => {
    if (activeModule === "code" && Object.keys(sourceCodes).length === 0) {
      setIsLoadingCode(true);
      fetch("/api/python/source")
        .then((res) => res.json())
        .then((data) => {
          setSourceCodes(data);
        })
        .catch((err) => console.error("Error loading python code:", err))
        .finally(() => setIsLoadingCode(false));
    }
  }, [activeModule]);

  // Execute Python Demand Forecasting
  const handleRunForecast = async () => {
    setIsExecutingForecast(true);
    try {
      const res = await fetch("/api/python/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "forecast",
          payload: {
            dayOfWeek: forecastDay,
            weather: forecastWeather,
            campusEvent: forecastEvent,
            menuItems,
          },
        }),
      });
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecutingForecast(false);
    }
  };

  // Execute Python Nutrition Optimizer
  const handleRunNutrition = async () => {
    setIsExecutingNutrition(true);
    try {
      const res = await fetch("/api/python/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "nutrition",
          payload: {
            goal: nutritionGoal,
            targetCalories,
            allergies: allergyFilter ? [allergyFilter] : [],
            availableItems: menuItems,
          },
        }),
      });
      const data = await res.json();
      setNutritionResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecutingNutrition(false);
    }
  };

  // Execute Python Waste Impact Engine
  const handleRunWaste = async () => {
    setIsExecutingWaste(true);
    try {
      const res = await fetch("/api/python/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "waste",
          payload: {
            wasteRecords: [
              ...wasteRecords,
              {
                item_name: "Tuscan Kale & Roast Chickpea Salad",
                weight_kg: wasteWeightKg,
                reason: wasteCause,
                station: "Salad Deli Line",
              },
            ],
            totalPreparedKg: 650.0,
          },
        }),
      });
      const data = await res.json();
      setWasteResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecutingWaste(false);
    }
  };

  // Execute Python Inventory EOQ
  const handleRunInventory = async () => {
    setIsExecutingInventory(true);
    try {
      const res = await fetch("/api/python/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "inventory",
          payload: {
            inventory: rawInventory,
            orders,
          },
        }),
      });
      const data = await res.json();
      setInventoryResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecutingInventory(false);
    }
  };

  const copyCurrentCode = () => {
    const code = sourceCodes[selectedCodeFile] || "";
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Python 3.10 Microservices Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Python AI & Analytics Backend
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              50% of the platform&apos;s computational intelligence runs on modular Python services:
              statistical demand forecasting, clinical macro balancing, EPA greenhouse gas conversion, and Wilson&apos;s EOQ lot-sizing.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3.5 backdrop-blur-sm">
              <div className="text-[11px] text-slate-400 font-medium">Execution Latency</div>
              <div className="text-xl font-black text-emerald-400">
                {forecastResult?._python_execution_time_ms
                  ? `${forecastResult._python_execution_time_ms} ms`
                  : "< 1 ms"}
              </div>
              <div className="text-[10px] text-slate-400">Sub-millisecond CLI runtime</div>
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3.5 backdrop-blur-sm">
              <div className="text-[11px] text-slate-400 font-medium">Python Modules</div>
              <div className="text-xl font-black text-cyan-400">5 Engines</div>
              <div className="text-[10px] text-slate-400">Pure Python 3 standard lib</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-2 border-t border-slate-700/80 pt-5">
          <button
            onClick={() => setActiveModule("forecast")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeModule === "forecast"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Demand Forecasting</span>
          </button>

          <button
            onClick={() => setActiveModule("nutrition")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeModule === "nutrition"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nutrition & Macros</span>
          </button>

          <button
            onClick={() => setActiveModule("waste")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeModule === "waste"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Waste & CO₂ Analytics</span>
          </button>

          <button
            onClick={() => setActiveModule("inventory")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeModule === "inventory"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Inventory EOQ Model</span>
          </button>

          <button
            onClick={() => setActiveModule("code")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeModule === "code"
                ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>View Python Source Code</span>
          </button>
        </div>
      </div>

      {/* MODULE 1: DEMAND FORECASTING */}
      {activeModule === "forecast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Forecasting Parameters
                </span>
                <span className="text-[10px] rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                  demand_forecasting.py
                </span>
              </div>

              {/* Day Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Day of the Week</span>
                </label>
                <select
                  value={forecastDay}
                  onChange={(e) => setForecastDay(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="Monday">Monday (Post-Weekend Rush)</option>
                  <option value="Tuesday">Tuesday (Heavy Lecture Attendance)</option>
                  <option value="Wednesday">Wednesday (Mid-Week Peak Traffic)</option>
                  <option value="Thursday">Thursday (High Dining Volume)</option>
                  <option value="Friday">Friday (Early Departures)</option>
                  <option value="Saturday">Saturday (Campus Residents Only)</option>
                  <option value="Sunday">Sunday (Evening Meal Prep)</option>
                </select>
              </div>

              {/* Weather Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                  <CloudRain className="h-3.5 w-3.5 text-slate-500" />
                  <span>Forecasted Weather</span>
                </label>
                <select
                  value={forecastWeather}
                  onChange={(e) => setForecastWeather(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="Rainy & Chilly (13°C)">Rainy & Chilly (13°C) — Thermal soup surge</option>
                  <option value="Sunny & Warm (26°C)">Sunny & Warm (26°C) — Crisp salads & iced drinks</option>
                  <option value="Cold & Snow (1°C)">Cold & Snow (1°C) — Heavy comfort entrees</option>
                  <option value="Mild & Overcast (19°C)">Mild & Overcast (19°C) — Normalized traffic</option>
                </select>
              </div>

              {/* Academic Event Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                  <Zap className="h-3.5 w-3.5 text-slate-500" />
                  <span>Campus Academic Calendar Event</span>
                </label>
                <select
                  value={forecastEvent}
                  onChange={(e) => setForecastEvent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="Midterm Exam Week">Midterm Exam Week (+28% traffic, grab-and-go focus)</option>
                  <option value="Campus Career Fair">Campus Career Fair (+35% external lunch visitors)</option>
                  <option value="Home Football Game">Home Football Game (+45% stadium crowd)</option>
                  <option value="Standard Academic Week">Standard Academic Week (Normal baseline)</option>
                </select>
              </div>

              <button
                onClick={handleRunForecast}
                disabled={isExecutingForecast}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-98 shadow-md shadow-emerald-600/20 disabled:opacity-60"
              >
                {isExecutingForecast ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-white" />
                )}
                <span>Execute Python Forecast Algorithm</span>
              </button>
            </div>

            {/* Algorithm details card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Cpu className="h-3.5 w-3.5 text-emerald-600" />
                <span>Under the Hood: Python Statistical Model</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Applies Multi-Variable Exponential Smoothing weighted against academic calendar event multipliers and category-specific weather elasticities.
              </p>
              <div className="text-[10px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-200">
                P_batch = ceil(Base_Velocity * D_mult * W_cat * E_boost * (1 + Safety_Buffer))
              </div>
            </div>
          </div>

          {/* Results Output */}
          <div className="lg:col-span-8 space-y-4">
            {forecastResult ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      {forecastResult.engine}
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Predictive Batch Schedule
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-200">
                      Traffic Index: {forecastResult.traffic_index}x
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                      Latency: {forecastResult._python_execution_time_ms} ms
                    </span>
                  </div>
                </div>

                {/* Summary text */}
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-xs text-emerald-950 leading-relaxed font-medium">
                  {forecastResult.forecast_summary}
                </div>

                {/* Batch Recommendations Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    Recommended Kitchen Batch Portions:
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold">
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-center">Batch Target</th>
                          <th className="py-2.5 px-3 text-center">95% Range</th>
                          <th className="py-2.5 px-3 text-center">Adjustment</th>
                          <th className="py-2.5 px-3">Waste Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {forecastResult.prep_recommendations?.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {item.item}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                            <td className="py-2.5 px-3 text-center font-extrabold text-emerald-700">
                              {item.recommended_batch}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600">
                              {item.confidence_range}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 text-[11px]">
                                {item.adjustment}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {item.waste_risk}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Waste Mitigation Advice */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-1.5">
                  <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <Leaf className="h-4 w-4 text-amber-600" />
                    <span>Python Waste Mitigation Advisory</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {forecastResult.waste_mitigation_action}
                  </p>
                  <div className="text-[11px] font-bold text-amber-900 pt-1">
                    Projected Food Saved: ~{forecastResult.estimated_waste_savings_kg} kg
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500">Press Execute to run forecast...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 2: NUTRITION & MACROS */}
      {activeModule === "nutrition" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nutrition Parameters
                </span>
                <span className="text-[10px] rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                  nutrition_optimizer.py
                </span>
              </div>

              {/* User Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Dietary Fitness Goal</label>
                <select
                  value={nutritionGoal}
                  onChange={(e) => setNutritionGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="High Protein">High Protein (Athletic repair & lean muscle)</option>
                  <option value="Balanced Energy & Focus">Balanced Energy & Focus (Sustained exam stamina)</option>
                  <option value="Low Calorie / Weight Loss">Low Calorie / Weight Loss (High satiety volume)</option>
                  <option value="Plant-Based Vitality">Plant-Based Vitality (Polyphenols & fiber)</option>
                  <option value="Low Carb / Keto Friendly">Low Carb / Keto Friendly (Minimal glycemic spike)</option>
                </select>
              </div>

              {/* Target Calories */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-medium text-slate-700">Target Calories per Meal</label>
                  <span className="font-bold text-emerald-700">{targetCalories} kcal</span>
                </div>
                <input
                  type="range"
                  min="350"
                  max="950"
                  step="25"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Allergies */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Allergen to Filter</label>
                <input
                  type="text"
                  placeholder="e.g. peanuts, dairy, gluten"
                  value={allergyFilter}
                  onChange={(e) => setAllergyFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              <button
                onClick={handleRunNutrition}
                disabled={isExecutingNutrition}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-98 shadow-md shadow-emerald-600/20 disabled:opacity-60"
              >
                {isExecutingNutrition ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-white" />
                )}
                <span>Execute Python Macro Optimizer</span>
              </button>
            </div>

            {/* Algorithm info */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Nutrient Density Index (NDI)</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Python evaluates candidate dishes using penalized Euclidean distance against the user&apos;s macro ratio profile, weighting bioavailable protein and antioxidant density.
              </p>
            </div>
          </div>

          {/* Results Output */}
          <div className="lg:col-span-8 space-y-4">
            {nutritionResult ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      {nutritionResult.engine}
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Optimal Meal Recommendations
                    </h3>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Latency: {nutritionResult._python_execution_time_ms} ms
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-xs text-emerald-950 font-medium leading-relaxed">
                  {nutritionResult.rationale}
                </div>

                {/* Candidate Dishes Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nutritionResult.scored_breakdown?.map((entry: any, idx: number) => {
                    const it = entry.item;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50 hover:border-emerald-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">
                              Rank #{idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{it.name}</h4>
                          </div>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                            NDI: {entry.density_score}
                          </span>
                        </div>

                        {/* Macros breakdown */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                            <span className="block text-[10px] text-slate-400">Calories</span>
                            <span className="font-extrabold text-slate-900">
                              {entry.macros.calories}
                            </span>
                          </div>
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                            <span className="block text-[10px] text-slate-400">Protein</span>
                            <span className="font-extrabold text-emerald-700">
                              {entry.macros.protein_g}g
                            </span>
                          </div>
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                            <span className="block text-[10px] text-slate-400">Carbs</span>
                            <span className="font-extrabold text-cyan-700">
                              {entry.macros.carbs_g}g
                            </span>
                          </div>
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                            <span className="block text-[10px] text-slate-400">Fat</span>
                            <span className="font-extrabold text-amber-700">
                              {entry.macros.fat_g}g
                            </span>
                          </div>
                        </div>

                        {/* Progress Macro Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                            <span>Protein: {entry.macros.protein_cal_pct}%</span>
                            <span>Carbs: {entry.macros.carbs_cal_pct}%</span>
                            <span>Fat: {entry.macros.fat_cal_pct}%</span>
                          </div>
                          <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              style={{ width: `${entry.macros.protein_cal_pct}%` }}
                              className="bg-emerald-500"
                            />
                            <div
                              style={{ width: `${entry.macros.carbs_cal_pct}%` }}
                              className="bg-cyan-500"
                            />
                            <div
                              style={{ width: `${entry.macros.fat_cal_pct}%` }}
                              className="bg-amber-400"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Practical Tips */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Python Nutritionist Tips:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {nutritionResult.tips?.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500">Press Execute to optimize nutrition...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 3: WASTE & CO2 ANALYTICS */}
      {activeModule === "waste" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  EPA Impact Parameters
                </span>
                <span className="text-[10px] rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                  waste_analytics.py
                </span>
              </div>

              {/* Waste Weight Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-medium text-slate-700">Waste Batch Weight</label>
                  <span className="font-bold text-amber-700">{wasteWeightKg} kg</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={wasteWeightKg}
                  onChange={(e) => setWasteWeightKg(parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              {/* Waste Cause */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Discard Cause</label>
                <select
                  value={wasteCause}
                  onChange={(e) => setWasteCause(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="overproduction">Overproduction (Unsold buffet batches)</option>
                  <option value="plate_scrapings">Plate Scrapings (Customer tray leftovers)</option>
                  <option value="expired">Expired / Spoilage (Cold deli holding limit)</option>
                  <option value="prep_trimmings">Prep Trimmings (Kitchen butchery / peels)</option>
                </select>
              </div>

              <button
                onClick={handleRunWaste}
                disabled={isExecutingWaste}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition active:scale-98 shadow-md shadow-amber-600/20 disabled:opacity-60"
              >
                {isExecutingWaste ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-white" />
                )}
                <span>Run Python Environmental Impact Audit</span>
              </button>
            </div>

            {/* EPA conversion note */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                <span>EPA Food Waste Matrix</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Applies lifecycle greenhouse gas coefficients: 28.5 kg CO₂e/kg for ruminant meats, 6.8 for poultry, 2.6 for grains, and 1.2 for greens.
              </p>
            </div>
          </div>

          {/* Results Output */}
          <div className="lg:col-span-8 space-y-4">
            {wasteResult ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      {wasteResult.engine}
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      GHG & Financial Loss Assessment
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-800">
                      Grade: {wasteResult.sustainability_grade}
                    </span>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-1">
                    <div className="text-[11px] font-medium text-amber-800">Total Carbon Impact</div>
                    <div className="text-2xl font-black text-amber-900">
                      {wasteResult.total_co2e_kg} kg CO₂e
                    </div>
                    <div className="text-[10px] text-amber-700">
                      Equivalent to {wasteResult.trees_offset_equivalent} tree-years
                    </div>
                  </div>

                  <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 space-y-1">
                    <div className="text-[11px] font-medium text-red-800">Direct Cost Loss</div>
                    <div className="text-2xl font-black text-red-900">
                      ₹{wasteResult.total_cost_loss_usd}
                    </div>
                    <div className="text-[10px] text-red-700">Calculated on ingredient BOM</div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1">
                    <div className="text-[11px] font-medium text-emerald-800">Compost Diversion</div>
                    <div className="text-2xl font-black text-emerald-900">
                      {wasteResult.diversion_rate_pct}%
                    </div>
                    <div className="text-[10px] text-emerald-700">Saved from municipal landfill</div>
                  </div>
                </div>

                {/* Station Performance Audit */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">Kitchen Station Performance:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wasteResult.station_performance?.map((st: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{st.station_name}</div>
                          <div className="text-[11px] text-slate-500">{st.incidents} logs recorded</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-slate-800">{st.total_kg} kg</div>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              st.status === "Green"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {st.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500">Press Execute to audit waste impact...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 4: INVENTORY EOQ MODEL */}
      {activeModule === "inventory" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                inventory_optimizer.py
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Wilson&apos;s Economic Order Quantity (EOQ) & Safety Stock
              </h3>
            </div>
            <button
              onClick={handleRunInventory}
              disabled={isExecutingInventory}
              className="flex items-center space-x-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <Play className="h-3 w-3 fill-white" />
              <span>Recalculate EOQ in Python</span>
            </button>
          </div>

          {/* Explanation */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900">Operations Research Formula:</div>
            <p className="leading-relaxed">
              <span className="font-mono text-emerald-700 font-bold">EOQ = √((2 × D × S) / H)</span> |
              Minimizes total annual cost by balancing procurement ordering costs (₹450/order) against warehouse carrying costs (18%/yr).
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Current Stock</th>
                  <th className="py-2.5 px-3 text-center">Safety Stock</th>
                  <th className="py-2.5 px-3 text-center">Reorder Point (ROP)</th>
                  <th className="py-2.5 px-3 text-center">Optimal EOQ Order</th>
                  <th className="py-2.5 px-3 text-center">Days Remaining</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryResult?.inventory_optimization_table?.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{row.ingredient}</td>
                    <td className="py-2.5 px-3 text-slate-500">{row.category}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-slate-800">
                      {row.current_stock_kg} kg
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {row.safety_stock_kg} kg
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                      {row.reorder_point_kg} kg
                    </td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-emerald-700">
                      {row.economic_order_qty_kg} kg
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">
                      {row.days_of_supply} days
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          row.status === "Critical Low"
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 5: PYTHON SOURCE CODE VIEWER */}
      {activeModule === "code" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Python Backend Source Architecture
                </h3>
                <p className="text-xs text-slate-400">
                  Clean, production-ready Python 3 modules powering the system logic
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyCurrentCode}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* File selector pills */}
          <div className="flex flex-wrap gap-2">
            {[
              "demand_forecasting.py",
              "nutrition_optimizer.py",
              "waste_analytics.py",
              "inventory_optimizer.py",
              "order_processor.py",
              "main.py",
            ].map((filename) => (
              <button
                key={filename}
                onClick={() => setSelectedCodeFile(filename)}
                className={`rounded-lg px-3 py-1 text-xs font-mono transition ${
                  selectedCodeFile === filename
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {filename}
              </button>
            ))}
          </div>

          {/* Code Viewer Box */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto max-h-[500px]">
            {isLoadingCode ? (
              <div className="flex h-48 items-center justify-center text-slate-500">
                Loading Python source code...
              </div>
            ) : (
              <pre className="text-emerald-300 leading-relaxed">
                <code>{sourceCodes[selectedCodeFile] || "# Select a file above to view"}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
