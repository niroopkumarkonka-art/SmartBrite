import React, { useState } from "react";
import {
  TrendingUp,
  Scale,
  DollarSign,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Plus,
  Package,
  Layers,
  BarChart3,
  Calendar,
  CloudRain,
  Flame,
  CheckCircle2,
  Cpu,
  Trash2,
  FileSpreadsheet,
  FileText,
  Download,
} from "lucide-react";
import {
  AnalyticsSummary,
  DemandAnalyticsItem,
  WasteAnalyticsItem,
  RevenueAnalyticsItem,
  MenuItem,
  InventoryItem,
  Order,
  WasteRecord,
} from "../types";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

interface AdminDashboardProps {
  summary: AnalyticsSummary | null;
  demandData: DemandAnalyticsItem[];
  wasteData: WasteAnalyticsItem[];
  revenueData: RevenueAnalyticsItem[];
  menuItems: MenuItem[];
  rawInventory: InventoryItem[];
  orders?: Order[];
  wasteRecords?: WasteRecord[];
  onRestockItem: (menuItemId: string, qty: number) => Promise<void>;
  onRefreshAnalytics: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  summary,
  demandData,
  wasteData,
  revenueData,
  menuItems,
  rawInventory,
  orders = [],
  wasteRecords = [],
  onRestockItem,
  onRefreshAnalytics,
}) => {
  // AI Forecast state
  const [dayOfWeek, setDayOfWeek] = useState<string>("Wednesday");
  const [weatherCondition, setWeatherCondition] = useState<string>("Chilly & Overcast (13°C)");
  const [campusEvent, setCampusEvent] = useState<string>("Midterm Exam Week + Career Fair");
  const [isGeneratingForecast, setIsGeneratingForecast] = useState<boolean>(false);
  const [aiForecastResult, setAiForecastResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportToExcel({
        summary,
        demandData,
        wasteData,
        menuItems,
        orders,
        wasteRecords,
        forecastResult: aiForecastResult,
      });
    } catch (err) {
      console.error("Export Excel error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportToPDF({
        summary,
        demandData,
        wasteData,
        menuItems,
        orders,
        wasteRecords,
        forecastResult: aiForecastResult,
      });
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateForecast = async () => {
    setIsGeneratingForecast(true);
    try {
      const res = await fetch("/api/ai/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          weather: weatherCondition,
          campusEvent,
        }),
      });
      const data = await res.json();
      setAiForecastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-xl bg-cyan-50 p-2 text-cyan-700 border border-cyan-200">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cafeteria Operations & Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales velocity, meal demand tracking, zero-waste monitoring & kitchen prep forecasting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export to Excel */}
          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition shadow-2xs"
            title="Export full analytics, orders, inventory and waste logs to Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Export to PDF */}
          <button
            id="export-pdf-btn"
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 hover:border-rose-300 transition shadow-2xs"
            title="Export executive summary and kitchen logs as formatted PDF document"
          >
            <FileText className="h-4 w-4 text-rose-600" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={onRefreshAnalytics}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Sales Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{summary ? summary.total_revenue.toFixed(2) : "11,420.00"}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
            <span>↑ 14.2%</span>
            <span className="text-slate-500 font-normal">from {summary ? summary.total_orders : 24} orders</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Leftovers Logged</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary ? summary.total_waste_kg : "6.2"} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-amber-800 font-medium">
            ₹{summary ? summary.total_cost_loss.toFixed(2) : "940.00"} est. raw food cost
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Food Saved from Waste</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary ? summary.organic_waste_diverted_pct : 78.4}%
          </div>
          <div className="text-[11px] text-cyan-800 font-medium">
            {summary ? summary.total_co2_kg : 16.0} kg CO₂ emissions prevented
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Dishes Low in Stock</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {summary ? summary.low_stock_items : 2} <span className="text-sm font-normal text-slate-500">dishes</span>
          </div>
          <div className="text-[11px] text-red-700 font-medium">Ready for kitchen restock</div>
        </div>
      </div>

      {/* AI Predictive Demand & Batching Engine */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/30 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>AI Meal Preparation Planner</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Smart Kitchen AI
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Predicts how many meals to cook tomorrow based on weather and campus schedules so food doesn&apos;t go to waste.
              </p>
            </div>
          </div>

          <button
            id="run-ai-forecast-btn"
            onClick={handleGenerateForecast}
            disabled={isGeneratingForecast}
            className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-sm shadow-emerald-600/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isGeneratingForecast ? "Calculating..." : "Plan Tomorrow's Cooking"}</span>
          </button>
        </div>

        {/* Input parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Campus Event / Exam Phase:</label>
            <input
              type="text"
              value={campusEvent}
              onChange={(e) => setCampusEvent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Weather Forecast:</label>
            <input
              type="text"
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Day of the Week:</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-2xs"
            >
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Forecast Result Box */}
        {aiForecastResult ? (
          <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-3 text-xs shadow-2xs">
            <div className="text-slate-800 leading-relaxed font-medium">
              💡 {aiForecastResult.forecast_summary}
            </div>

            {aiForecastResult.prep_recommendations && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                  Recommended Cooking Targets:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiForecastResult.prep_recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="font-bold text-slate-900">{rec.item}</div>
                      <div className="text-emerald-700 font-bold mt-0.5">
                        Target: {rec.recommended_batch} portions ({rec.adjustment})
                      </div>
                      {rec.reason && <div className="text-[11px] text-slate-500 mt-1">{rec.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiForecastResult.waste_mitigation_action && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 font-medium">
                <strong>Waste Prevention Tip: </strong>
                {aiForecastResult.waste_mitigation_action}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Click &quot;Plan Tomorrow&apos;s Cooking&quot; to generate chef prep targets based on tomorrow&apos;s weather and campus schedules.
          </div>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demand Popularity Rankings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Most Popular Dishes
              </h3>
              <p className="text-[11px] text-slate-500">
                Ranked by total student orders placed today
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Live Orders
            </span>
          </div>

          <div className="space-y-3.5">
            {demandData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No orders recorded yet</div>
            ) : (
              demandData.slice(0, 5).map((item, idx) => {
                const maxQty = demandData[0]?.total_qty_ordered || 1;
                const pct = Math.round((item.total_qty_ordered / maxQty) * 100);

                return (
                  <div key={item._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-400">#{idx + 1}</span>
                        <span className="font-semibold text-slate-800">{item._id}</span>
                      </div>
                      <div className="space-x-3 text-right">
                        <span className="font-bold text-slate-900">{item.total_qty_ordered} ordered</span>
                        <span className="text-slate-500">₹{item.total_revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Food Waste Breakdown by Reason & Item */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Food Leftovers by Reason</h3>
              <p className="text-[11px] text-slate-500">
                Where food leftovers are occurring across the cafeteria
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
              Waste Scales
            </span>
          </div>

          <div className="space-y-3.5">
            {wasteData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No waste logged yet</div>
            ) : (
              wasteData.slice(0, 5).map((w, idx) => {
                const maxWaste = wasteData[0]?.total_wasted || 1;
                const pct = Math.round((w.total_wasted / maxWaste) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{w.item_name}</span>
                        <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-slate-200">
                          {w.reason.replace("_", " ")}
                        </span>
                      </div>
                      <div className="space-x-2 text-right">
                        <span className="font-bold text-amber-800">{w.total_wasted} portions</span>
                        <span className="text-slate-500">({w.total_weight_kg.toFixed(1)} kg)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inventory & Supply Replenishment Station */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <span>Kitchen Stock & Quick Restock</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep eye on portions prepared in the kitchen. Add stock with a single click.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {menuItems.length} dishes tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const isLow = item.stock_qty <= 5;
            return (
              <div
                key={item._id}
                className={`rounded-xl border p-4 space-y-3 transition shadow-2xs ${
                  isLow
                    ? "border-red-200 bg-red-50/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{item.name}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      isLow
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {item.stock_qty} ready
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Price: ₹{item.price.toFixed(2)}</span>
                  <span>Category: {item.category}</span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => onRestockItem(item._id, 10)}
                    className="flex-1 rounded-lg bg-slate-100 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-emerald-600 hover:text-white transition shadow-2xs"
                  >
                    +10 Restock
                  </button>
                  <button
                    onClick={() => onRestockItem(item._id, 25)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-emerald-600 hover:text-white transition shadow-2xs"
                  >
                    +25
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
