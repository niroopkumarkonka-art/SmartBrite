import React, { useState } from "react";
import {
  ChefHat,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ArrowRight,
  TrendingDown,
  Layers,
  Leaf,
  DollarSign,
  Cpu,
  Wifi,
} from "lucide-react";
import { Order, MenuItem, WasteRecord } from "../types";

interface KitchenStationProps {
  orders: Order[];
  menuItems: MenuItem[];
  wasteRecords: WasteRecord[];
  onUpdateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  onLogWaste: (data: {
    menu_item_id: string;
    wasted_qty: number;
    weight_kg: number;
    reason: string;
    station: string;
  }) => Promise<void>;
}

export const KitchenStation: React.FC<KitchenStationProps> = ({
  orders,
  menuItems,
  wasteRecords,
  onUpdateOrderStatus,
  onLogWaste,
}) => {
  // Scale hardware simulator state
  const [scaleWeightKg, setScaleWeightKg] = useState<number>(1.25);
  const [isTare, setIsTare] = useState<boolean>(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>(
    menuItems[0]?._id || ""
  );
  const [wasteReason, setWasteReason] = useState<"overproduction" | "expired" | "plate_scrapings" | "prep_trimmings">(
    "overproduction"
  );
  const [stationName, setStationName] = useState<string>("Student Tray Return Scale #2");
  const [isSubmittingWaste, setIsSubmittingWaste] = useState<boolean>(false);
  const [wasteFeedbackMsg, setWasteFeedbackMsg] = useState<string | null>(null);

  // Filter orders by active stages
  const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const completedOrders = orders.filter((o) => o.status === "completed");

  const selectedItem = menuItems.find((m) => m._id === selectedMenuItemId) || menuItems[0];
  const estimatedCost = selectedItem ? Math.round(selectedItem.price * 0.45 * (scaleWeightKg / 0.35) * 100) / 100 : 4.5;
  const estimatedCo2 = Math.round(scaleWeightKg * 2.1 * 100) / 100;

  const handleTare = () => {
    setIsTare(true);
    setScaleWeightKg(0.0);
    setTimeout(() => setIsTare(false), 500);
  };

  const handleAddSampleWeight = (delta: number) => {
    setScaleWeightKg((prev) => Math.max(0.05, Math.round((prev + delta) * 100) / 100));
  };

  const handleRecordWaste = async () => {
    if (!selectedMenuItemId || scaleWeightKg <= 0) return;
    setIsSubmittingWaste(true);
    try {
      const estimatedUnits = Math.max(1, Math.round(scaleWeightKg / 0.35));
      await onLogWaste({
        menu_item_id: selectedMenuItemId,
        wasted_qty: estimatedUnits,
        weight_kg: scaleWeightKg,
        reason: wasteReason,
        station: stationName,
      });

      setWasteFeedbackMsg(`Recorded ${scaleWeightKg} kg of ${selectedItem?.name || "food"} (${wasteReason.replace("_", " ")}).`);
      // Reset scale to a realistic small test weight
      setScaleWeightKg(0.45);
      setTimeout(() => setWasteFeedbackMsg(null), 3500);
    } catch (err: any) {
      alert("Failed to log waste: " + err.message);
    } finally {
      setIsSubmittingWaste(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-xl bg-amber-50 p-2 text-amber-700 border border-amber-200">
              <ChefHat className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Kitchen Orders & Smart Food Scale
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cook orders for hungry students and weigh kitchen leftovers to stop food waste.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800 font-medium">
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
            <span>Kiosks Connected</span>
          </div>
          <div className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 font-medium shadow-2xs">
            <Cpu className="h-3.5 w-3.5 text-cyan-600" />
            <span>Scale Connected</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders Queue on Left (7 cols), IoT Waste Scale on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Kitchen Orders Queue */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">Orders to Cook</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                {activeOrders.length} Pending
              </span>
            </div>
            <span className="text-xs text-slate-400">Ordered by arrival time</span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <p className="text-sm font-bold text-slate-900">All caught up!</p>
              <p className="text-xs text-slate-500 mt-0.5">No pending orders right now. Ready for the next customer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const isPlaced = order.status === "placed";
                const isPreparing = order.status === "preparing";
                const isReady = order.status === "ready";

                return (
                  <div
                    key={order._id}
                    className={`rounded-2xl border p-5 transition shadow-xs ${
                      isReady
                        ? "border-emerald-300 bg-emerald-50/60"
                        : isPreparing
                        ? "border-amber-300 bg-amber-50/60"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-extrabold text-slate-900 tracking-wider">
                          {order.token_number}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            isReady
                              ? "bg-emerald-600 text-white"
                              : isPreparing
                              ? "bg-amber-500 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {isReady ? "Ready for Pickup" : isPreparing ? "Cooking Now" : "New Order"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-800 font-semibold">{order.user_name || "Campus Diner"}</span>
                      </div>
                    </div>

                    {/* Items to prepare */}
                    <div className="py-3 space-y-2">
                      {order.items.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 font-bold text-slate-900 text-[11px] border border-slate-200">
                              {line.qty}x
                            </span>
                            <span className="font-semibold text-slate-800">{line.name}</span>
                          </div>
                          <span className="text-slate-600 font-semibold">₹{line.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-slate-500">
                        Paid via: <strong className="text-slate-800">{order.payment_method}</strong>
                      </span>

                      <div className="flex items-center space-x-2">
                        {isPlaced && (
                          <button
                            onClick={() => onUpdateOrderStatus(order._id, "preparing")}
                            className="rounded-xl bg-amber-500 px-3.5 py-2 font-bold text-slate-950 hover:bg-amber-400 transition shadow-xs"
                          >
                            Start Cooking
                          </button>
                        )}
                        {isPreparing && (
                          <button
                            onClick={() => onUpdateOrderStatus(order._id, "ready")}
                            className="rounded-xl bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                          >
                            Mark Ready
                          </button>
                        )}
                        {isReady && (
                          <button
                            onClick={() => onUpdateOrderStatus(order._id, "completed")}
                            className="rounded-xl bg-slate-800 px-3.5 py-2 font-bold text-white hover:bg-slate-900 transition shadow-xs"
                          >
                            Picked Up
                          </button>
                        )}
                        <button
                          onClick={() => onUpdateOrderStatus(order._id, "cancelled")}
                          className="rounded-xl border border-red-200 px-2.5 py-2 text-[11px] text-red-600 hover:bg-red-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fulfilled Orders History summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-2xs">
            <span className="font-bold text-slate-800">Recently Picked Up Orders: </span>
            {completedOrders.length === 0 ? (
              <span className="text-slate-400">None yet during this shift</span>
            ) : (
              <span className="space-x-2">
                {completedOrders.slice(0, 5).map((co) => (
                  <span key={co._id} className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-700 font-bold">
                    {co.token_number}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Smart Food Waste Scale Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Smart Food Waste Scale</h3>
              </div>
              <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Scale Online</span>
              </span>
            </div>

            {/* Scale LCD Display */}
            <div className="relative rounded-2xl border border-emerald-300 bg-gradient-to-b from-emerald-50/80 to-teal-50/50 p-6 font-mono text-center shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
                <span>DIGITAL FOOD SCALE</span>
                <span className={isTare ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                  {isTare ? "RESETTING TO ZERO..." : "CALIBRATED (0.00)"}
                </span>
              </div>

              {/* Readout */}
              <div className="text-5xl font-black tracking-wider text-emerald-900">
                {scaleWeightKg.toFixed(2)} <span className="text-xl text-slate-500">kg</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {(scaleWeightKg * 1000).toFixed(0)} grams leftover weight
              </div>

              {/* Hardware buttons */}
              <div className="flex items-center justify-center space-x-2 mt-4 pt-3 border-t border-emerald-200/80">
                <button
                  onClick={handleTare}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 shadow-2xs"
                >
                  Reset (Tare)
                </button>
                <button
                  onClick={() => handleAddSampleWeight(0.25)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 active:scale-95 shadow-2xs font-semibold"
                >
                  +0.25 kg
                </button>
                <button
                  onClick={() => handleAddSampleWeight(0.5)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 active:scale-95 shadow-2xs font-semibold"
                >
                  +0.50 kg
                </button>
                <button
                  onClick={() => handleAddSampleWeight(1.0)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 active:scale-95 shadow-2xs font-semibold"
                >
                  +1.00 kg
                </button>
              </div>
            </div>

            {/* Waste Classification Form */}
            <div className="space-y-4 text-xs">
              {/* Dish Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Which dish was left over?
                </label>
                <select
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {menuItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (₹{item.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Waste Reason Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Why was it left over?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "overproduction", label: "Cooked Too Much", desc: "Excess unsold portions" },
                    { id: "plate_scrapings", label: "Plate Leftovers", desc: "Student didn't finish meal" },
                    { id: "expired", label: "Expired Food", desc: "Past freshness date" },
                    { id: "prep_trimmings", label: "Prep Scraps", desc: "Vegetable peels & cuts" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setWasteReason(cat.id as any)}
                      className={`rounded-xl p-2.5 text-left border transition ${
                        wasteReason === cat.id
                          ? "border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-2xs"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-[11px] text-slate-800">{cat.label}</div>
                      <div className="text-[10px] text-slate-500">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Station Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Collection Station:
                </label>
                <select
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="Student Tray Return Scale #2">Student Tray Return (East Hall)</option>
                  <option value="Hot Buffet Table">Central Hot Wells & Buffet</option>
                  <option value="Kitchen Prep Station">Prep Kitchen & Salad Bar</option>
                  <option value="Grab & Go Station">Grab & Go Refrigerated Counter</option>
                </select>
              </div>

              {/* Real-time Loss Impact Calculation */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <div>
                    <span className="block text-[10px] text-slate-500">Estimated Cost</span>
                    <span className="font-bold text-red-600">₹{estimatedCost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Leaf className="h-4 w-4 text-amber-600" />
                  <div>
                    <span className="block text-[10px] text-slate-500">Carbon Impact</span>
                    <span className="font-bold text-amber-700">{estimatedCo2.toFixed(2)} kg CO₂</span>
                  </div>
                </div>
              </div>

              {/* Submit to Backend DB */}
              <button
                id="log-waste-btn"
                onClick={handleRecordWaste}
                disabled={isSubmittingWaste || scaleWeightKg <= 0}
                className="w-full rounded-xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition active:scale-95 disabled:opacity-40 shadow-sm"
              >
                {isSubmittingWaste ? "Saving Leftover Record..." : "Save Leftover Record"}
              </button>

              {wasteFeedbackMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-center text-xs text-emerald-800 font-semibold">
                  ✓ {wasteFeedbackMsg}
                </div>
              )}
            </div>
          </div>

          {/* Recent Waste Stream Logs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Recent Leftover Records
            </h4>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {wasteRecords.slice(0, 5).map((w) => (
                <div key={w._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{w.item_name || "Food Dish"}</div>
                    <div className="text-[11px] text-slate-500">
                      {w.station} • <span className="capitalize text-amber-700 font-semibold">{w.reason.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{w.weight_kg.toFixed(2)} kg</span>
                    <div className="text-[10px] font-semibold text-red-600">-₹{w.estimated_cost_loss.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
