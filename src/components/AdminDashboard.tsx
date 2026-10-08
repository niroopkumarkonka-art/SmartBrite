import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Scale,
  Sparkles,
  RefreshCw,
  Package,
  BarChart3,
  Search,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Clock,
  Utensils,
  Leaf,
  Receipt,
  Eye,
  PlusCircle,
  X,
  CreditCard,
  User as UserIcon,
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
import { BillReceiptModal } from "./BillReceiptModal";

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
  onUpdateOrderStatus?: (orderId: string, status: Order["status"]) => Promise<void>;
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
  onUpdateOrderStatus,
}) => {
  // Navigation Tabs: Overview, Orders & Bills, Stock & Restock, AI Kitchen Prep Planner
  const [activeTab, setActiveTab] = useState<"overview" | "orders-bills" | "inventory" | "ai-planner">("overview");

  // Live Database Status
  const [dbInfo, setDbInfo] = useState<{ connected: boolean; engine: string; database: string } | null>(null);

  // Search & Filters for Stock tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [restockingId, setRestockingId] = useState<string | null>(null);

  // Orders & Bills state
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Add Item Modal state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Biryani & Meals",
    price: "220",
    stock_qty: "25",
    prep_time_minutes: "8",
    calories: "520",
    protein_g: "28",
    carbs_g: "55",
    fat_g: "16",
    dietary_tags: "Non-Veg, High Protein",
    ingredients: "Spiced Chicken, Basmati Rice, Desi Ghee",
    image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  });

  // AI Meal Prep Forecast State
  const [dayOfWeek, setDayOfWeek] = useState<string>("Wednesday");
  const [weatherCondition, setWeatherCondition] = useState<string>("Rainy & Chilly (13°C)");
  const [campusEvent, setCampusEvent] = useState<string>("Midterm Exam Week");
  const [isGeneratingForecast, setIsGeneratingForecast] = useState<boolean>(false);
  const [aiForecastResult, setAiForecastResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Fetch live DB connection state
  useEffect(() => {
    fetch("/api/db-status")
      .then((res) => res.json())
      .then((data) => setDbInfo(data))
      .catch(() => setDbInfo({ connected: false, engine: "In-Memory", database: "smartbrite" }));
  }, []);

  // Filtered menu items for the Inventory tab
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesLowStock = !showLowStockOnly || item.stock_qty <= 5;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [menuItems, searchQuery, selectedCategory, showLowStockOnly]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((m) => set.add(m.category));
    return ["all", ...Array.from(set)];
  }, [menuItems]);

  const lowStockCount = useMemo(() => {
    return menuItems.filter((m) => m.stock_qty <= 5).length;
  }, [menuItems]);

  // Filtered orders for Orders & Bills tab
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = orderSearchQuery.toLowerCase();
      const matchesSearch =
        order.token_number.toLowerCase().includes(query) ||
        (order.user_name || "").toLowerCase().includes(query) ||
        order.items.some((i) => i.name.toLowerCase().includes(query));
      const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  // Total Billed Revenue from orders
  const totalOrderRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total_amount, 0);
  }, [orders]);

  // Restock handler
  const handleRestock = async (itemId: string, qty: number) => {
    setRestockingId(itemId);
    try {
      await onRestockItem(itemId, qty);
    } finally {
      setRestockingId(null);
    }
  };

  // Add Item Handler
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    setIsSubmittingItem(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItem.name,
          category: newItem.category,
          price: parseFloat(newItem.price),
          stock_qty: parseInt(newItem.stock_qty, 10),
          prep_time_minutes: parseInt(newItem.prep_time_minutes, 10),
          calories: parseInt(newItem.calories, 10),
          protein_g: parseInt(newItem.protein_g, 10),
          carbs_g: parseInt(newItem.carbs_g, 10),
          fat_g: parseInt(newItem.fat_g, 10),
          dietary_tags: newItem.dietary_tags.split(",").map((s) => s.trim()),
          ingredients: newItem.ingredients.split(",").map((s) => s.trim()),
          image_url: newItem.image_url,
        }),
      });

      if (res.ok) {
        setIsAddItemModalOpen(false);
        onRefreshAnalytics();
        setNewItem({
          name: "",
          category: "Biryani & Meals",
          price: "220",
          stock_qty: "25",
          prep_time_minutes: "8",
          calories: "520",
          protein_g: "28",
          carbs_g: "55",
          fat_g: "16",
          dietary_tags: "Non-Veg, High Protein",
          ingredients: "Spiced Chicken, Basmati Rice, Desi Ghee",
          image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        });
      }
    } catch (err) {
      console.error("Failed to add menu item:", err);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Update order status handler
  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    if (onUpdateOrderStatus) {
      await onUpdateOrderStatus(orderId, newStatus);
    } else {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefreshAnalytics();
    }
  };

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
      }, "SmartBrite_Canteen_Report.xlsx");
      setDownloadNotice("Downloaded SmartBrite_Canteen_Report.xlsx successfully!");
      setTimeout(() => setDownloadNotice(null), 5000);
    } catch (err) {
      console.error("Export Excel error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setDownloadNotice(null);
    try {
      exportToPDF({
        summary,
        demandData,
        wasteData,
        menuItems,
        orders,
        wasteRecords,
        forecastResult: aiForecastResult,
      }, "SmartBrite_Canteen_Report.pdf");
      setDownloadNotice("Downloaded SmartBrite_Canteen_Report.pdf successfully!");
      setTimeout(() => setDownloadNotice(null), 5000);
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Sleek Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 border border-emerald-500/20">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Cafeteria Management Hub
                </h1>
                {/* MongoDB Connection Status Pill */}
                <div
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    dbInfo?.connected
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                  title={
                    dbInfo?.connected
                      ? `Connected to MongoDB Atlas: ${dbInfo.database}`
                      : "Running in local storage fallback mode"
                  }
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      dbInfo?.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <Database className="h-3 w-3" />
                  <span>{dbInfo?.connected ? "MongoDB Atlas Live" : "Local Storage"}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time sales revenue, live order tracking, stock replenishment, and smart kitchen forecasts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Add Dish Button */}
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New Dish</span>
          </button>

          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center space-x-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
            title="Download full analytics as Excel spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            id="export-pdf-btn"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
            title="Download executive summary as PDF document"
          >
            <FileText className="h-4 w-4 text-rose-600" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <a
            href="/api/database/sql/order_bills_data.sql"
            download="order_bills_data.sql"
            className="flex items-center space-x-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
            title="Direct download synchronized SQL database file (database/order_bills_data.sql)"
          >
            <Database className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Export SQL</span>
          </a>

          <button
            onClick={onRefreshAnalytics}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Download Feedback Banner */}
      {downloadNotice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Overview & Sales</span>
        </button>

        {/* Dedicated Orders & Bills Tab */}
        <button
          onClick={() => setActiveTab("orders-bills")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "orders-bills"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Receipt className="h-4 w-4 text-emerald-600" />
          <span>Orders & Bills</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap relative ${
            activeTab === "inventory"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Stock & Quick Restock</span>
          {lowStockCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ai-planner")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "ai-planner"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span>AI Kitchen Prep Planner</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & SALES                                                   */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Total Revenue</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold">₹</div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{summary ? summary.total_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : totalOrderRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>From {orders.length} customer bills</span>
              </div>
            </div>

            {/* Total Orders */}
            <div
              onClick={() => setActiveTab("orders-bills")}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 hover:border-emerald-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Orders Handled</span>
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {orders.length} <span className="text-xs font-normal text-slate-500">tickets</span>
              </div>
              <div className="text-[11px] text-sky-700 font-medium flex items-center justify-between">
                <span>{orders.filter((o) => ["placed", "preparing"].includes(o.status)).length} active in kitchen</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Food Leftovers & Diversion */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Waste Diverted</span>
                <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                  <Leaf className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {summary ? summary.organic_waste_diverted_pct : 78.4}%
              </div>
              <div className="text-[11px] text-teal-700 font-medium">
                {summary ? summary.total_co2_kg : 16.0} kg CO₂ prevented
              </div>
            </div>

            {/* Low Stock Dishes */}
            <div
              onClick={() => {
                setShowLowStockOnly(true);
                setActiveTab("inventory");
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 hover:border-red-300 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Low Stock Alert</span>
                <div className="p-1.5 rounded-lg bg-red-50 text-red-700 group-hover:scale-110 transition">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {lowStockCount} <span className="text-xs font-normal text-slate-500">dishes</span>
              </div>
              <div className="text-[11px] text-red-600 font-bold flex items-center justify-between">
                <span>View & Restock dishes</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Two-Column Analytics: Most Popular Dishes & Waste Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Most Popular Dishes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Most Popular Dishes</h2>
                  <p className="text-[11px] text-slate-500">Ranked by quantities ordered today</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  Live Demand
                </span>
              </div>

              <div className="space-y-3">
                {demandData.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No orders recorded yet today</div>
                ) : (
                  demandData.slice(0, 5).map((item, idx) => {
                    const maxQty = demandData[0]?.total_qty_ordered || 1;
                    const pct = Math.round((item.total_qty_ordered / maxQty) * 100);

                    return (
                      <div key={item._id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-600">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">{item._id}</span>
                          </div>
                          <div className="space-x-3 text-right">
                            <span className="font-bold text-slate-900">{item.total_qty_ordered} sold</span>
                            <span className="text-slate-500">₹{item.total_revenue.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Food Leftovers & Waste Logs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Food Leftovers & Scrapings</h2>
                  <p className="text-[11px] text-slate-500">Monitored via IoT kitchen smart scales</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                  Zero-Waste Log
                </span>
              </div>

              <div className="space-y-3">
                {wasteData.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Zero leftovers recorded today! 🎉</div>
                ) : (
                  wasteData.slice(0, 5).map((w, idx) => {
                    const maxWaste = wasteData[0]?.total_wasted || 1;
                    const pct = Math.round((w.total_wasted / maxWaste) * 100);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-800">{w.item_name}</span>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              {w.reason.replace("_", " ")}
                            </span>
                          </div>
                          <div className="space-x-2 text-right">
                            <span className="font-bold text-amber-800">{w.total_wasted} portions</span>
                            <span className="text-slate-500">({w.total_weight_kg.toFixed(1)} kg)</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-500"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEDICATED ORDERS & BILLS SECTION                                   */}
      {/* ========================================================================= */}
      {activeTab === "orders-bills" && (
        <div className="space-y-4">
          {/* Header Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold">Total Orders</span>
              <div className="text-lg font-black text-slate-900">{orders.length}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold">Billed Revenue</span>
              <div className="text-lg font-black text-emerald-700">₹{totalOrderRevenue.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold">Active in Queue</span>
              <div className="text-lg font-black text-amber-700">
                {orders.filter((o) => ["placed", "preparing"].includes(o.status)).length}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold">Completed Orders</span>
              <div className="text-lg font-black text-slate-900">
                {orders.filter((o) => o.status === "completed").length}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders by token (e.g. A-101), customer name, or dish..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "placed", "preparing", "ready", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer border ${
                    orderStatusFilter === status
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Database Synced (Backend & SQL)</span>
            </div>
          </div>

          {/* Orders & Bills Feed */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                No orders match your filter criteria.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isPaid = order.status !== "cancelled";

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold text-sm tracking-tight">
                          {order.token_number}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">
                              {order.user_name || "Campus Diner"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                              {order.payment_method}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span>ID: {order._id}</span>
                            <span>•</span>
                            <span>{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">₹{order.total_amount.toFixed(2)}</div>
                          <div className="text-[10px] font-bold text-emerald-700">
                            {isPaid ? "Paid / Receipt Issued" : "Cancelled"}
                          </div>
                        </div>

                        {/* Status Dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value as Order["status"])}
                          className={`rounded-xl px-2.5 py-1.5 text-xs font-bold border cursor-pointer focus:outline-none ${
                            order.status === "completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : order.status === "ready"
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : order.status === "preparing"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : order.status === "cancelled"
                              ? "bg-red-50 text-red-800 border-red-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          <option value="placed">Placed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* View & Print Bill Receipt Button */}
                        <button
                          onClick={() => {
                            setSelectedBillOrder(order);
                            setIsBillModalOpen(true);
                          }}
                          className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View Bill</span>
                        </button>
                      </div>
                    </div>

                    {/* Itemized Order Line Breakdown */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Billed Items ({order.items.reduce((s, i) => s + i.qty, 0)} portions):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {order.items.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-800 truncate mr-2">
                              {line.qty}x {line.name}
                            </span>
                            <span className="font-bold text-slate-900 shrink-0">₹{line.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STOCK & QUICK RESTOCK                                              */}
      {/* ========================================================================= */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          {/* Search, Filter & Add Item Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search dishes by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                  showLowStockOnly
                    ? "bg-red-50 text-red-700 border-red-300"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Low Stock Only ({lowStockCount})</span>
              </button>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Dish</span>
              </button>
            </div>
          </div>

          {/* Clean Stock Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMenuItems.map((item) => {
              const isLow = item.stock_qty <= 5;
              const isRestocking = restockingId === item._id;

              return (
                <div
                  key={item._id}
                  className={`rounded-2xl border p-4 space-y-3 bg-white transition shadow-2xs hover:shadow-xs ${
                    isLow ? "border-red-200 bg-red-50/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.category}</p>
                    </div>

                    <div
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${
                        isLow
                          ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <span>{item.stock_qty} in stock</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="font-extrabold text-slate-900">₹{item.price.toFixed(2)}</span>
                    <span className="text-[11px] text-slate-500">{item.calories} kcal</span>
                  </div>

                  {/* Restock Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleRestock(item._id, 10)}
                      disabled={isRestocking}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isRestocking ? "Updating..." : "Restock +10"}</span>
                    </button>

                    <button
                      onClick={() => handleRestock(item._id, 25)}
                      disabled={isRestocking}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      +25
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              No dishes found matching your search.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI KITCHEN PREP PLANNER                                            */}
      {/* ========================================================================= */}
      {activeTab === "ai-planner" && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/30 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <span>AI Meal Preparation Planner</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Computes optimal cooking targets based on tomorrow&apos;s campus schedule and weather to prevent excess leftover waste.
              </p>
            </div>

            <button
              id="run-ai-forecast-btn"
              onClick={handleGenerateForecast}
              disabled={isGeneratingForecast}
              className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isGeneratingForecast ? "Calculating..." : "Generate Tomorrow's Targets"}</span>
            </button>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Campus Event / Exam Phase</label>
              <input
                type="text"
                value={campusEvent}
                onChange={(e) => setCampusEvent(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Weather Forecast</label>
              <input
                type="text"
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Day of the Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-2xs"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Output Card */}
          {aiForecastResult ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 space-y-4 text-xs shadow-2xs">
              <div className="flex items-start space-x-2.5 text-slate-800 font-semibold bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{aiForecastResult.forecast_summary}</span>
              </div>

              {aiForecastResult.prep_recommendations && (
                <div className="space-y-2 pt-2">
                  <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">
                    Recommended Cooking Quantities:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {aiForecastResult.prep_recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                        <div className="font-bold text-slate-900">{rec.item}</div>
                        <div className="text-emerald-700 font-extrabold text-xs">
                          Cook: {rec.recommended_batch} portions ({rec.adjustment})
                        </div>
                        {rec.reason && <div className="text-[11px] text-slate-500 mt-1">{rec.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              Click &quot;Generate Tomorrow&apos;s Targets&quot; to calculate optimal meal prep targets.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW DISH                                                       */}
      {/* ========================================================================= */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <PlusCircle className="h-4 w-4" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900">Add New Dish to Catalog</h3>
              </div>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Chicken Tikka Biryani"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Biryani & Meals">Biryani & Meals</option>
                    <option value="Cafe & Fast Food">Cafe & Fast Food</option>
                    <option value="Wraps & Paninis">Wraps & Paninis</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts & Waffles">Desserts & Waffles</option>
                    <option value="Ice Creams & Chocolates">Ice Creams & Chocolates</option>
                    <option value="Salads">Salads</option>
                    <option value="Main Entrees">Main Entrees</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newItem.stock_qty}
                    onChange={(e) => setNewItem({ ...newItem, stock_qty: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.prep_time_minutes}
                    onChange={(e) => setNewItem({ ...newItem, prep_time_minutes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={newItem.calories}
                    onChange={(e) => setNewItem({ ...newItem, calories: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={newItem.protein_g}
                    onChange={(e) => setNewItem({ ...newItem, protein_g: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Dietary Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newItem.dietary_tags}
                    onChange={(e) => setNewItem({ ...newItem, dietary_tags: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Ingredients</label>
                  <input
                    type="text"
                    value={newItem.ingredients}
                    onChange={(e) => setNewItem({ ...newItem, ingredients: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newItem.image_url}
                    onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingItem ? "Adding Dish..." : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill & Receipt Modal */}
      {selectedBillOrder && (
        <BillReceiptModal
          order={selectedBillOrder}
          isOpen={isBillModalOpen}
          onClose={() => {
            setIsBillModalOpen(false);
            setSelectedBillOrder(null);
          }}
        />
      )}

    </div>
  );
};
