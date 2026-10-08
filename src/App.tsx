/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { SmoothScrollHero } from "./components/ui/modern-hero";
import { CustomerKiosk } from "./components/CustomerKiosk";
import { KitchenStation } from "./components/KitchenStation";
import { AdminDashboard } from "./components/AdminDashboard";
import { AINutritionistModal } from "./components/AINutritionistModal";
import { AuthModal } from "./components/AuthModal";
import { LoginPage } from "./components/LoginPage";
import { Footer } from "./components/Footer";
import { SmartBrite3DLogo } from "./components/ui/SmartBrite3DLogo";
import "./App.css";
import "./motion-overrides.css";
import {
  MenuItem,
  Order,
  WasteRecord,
  InventoryItem,
  AnalyticsSummary,
  DemandAnalyticsItem,
  WasteAnalyticsItem,
  RevenueAnalyticsItem,
  CartItem,
  Feedback,
  User,
} from "./types";
import {
  FALLBACK_MENU_ITEMS,
  FALLBACK_ORDERS,
  FALLBACK_SUMMARY,
  FALLBACK_DEMAND,
  FALLBACK_WASTE,
} from "./data/fallbackData";

export default function App() {
  const [activeTab, setActiveTab] = useState<"kiosk" | "kitchen" | "admin">("kiosk");
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("smartbite_campus_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userRole, setUserRole] = useState<"customer" | "staff" | "admin">(() => {
    try {
      const saved = localStorage.getItem("smartbite_campus_session");
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.role) return u.role;
      }
    } catch {}
    return "customer";
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [show3DSplash, setShow3DSplash] = useState<boolean>(true);

  // App data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [demandData, setDemandData] = useState<DemandAnalyticsItem[]>([]);
  const [wasteData, setWasteData] = useState<WasteAnalyticsItem[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsItem[]>([]);

  // Cart & UI Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAINutritionOpen, setIsAINutritionOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync all data from API
  const fetchData = useCallback(async () => {
    try {
      const [
        menuRes,
        ordersRes,
        wasteRes,
        invRes,
        summaryRes,
        demandRes,
        wasteAggRes,
        revRes,
      ] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/orders"),
        fetch("/api/waste"),
        fetch("/api/inventory"),
        fetch("/api/analytics/summary"),
        fetch("/api/analytics/demand"),
        fetch("/api/analytics/waste"),
        fetch("/api/analytics/revenue"),
      ]);

      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      } else {
        setMenuItems(FALLBACK_MENU_ITEMS);
      }

      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      } else {
        setOrders(FALLBACK_ORDERS);
      }

      if (wasteRes.ok) setWasteRecords(await wasteRes.json());
      if (invRes.ok) setInventory(await invRes.json());

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      } else {
        setSummary(FALLBACK_SUMMARY);
      }

      if (demandRes.ok) {
        setDemandData(await demandRes.json());
      } else {
        setDemandData(FALLBACK_DEMAND);
      }

      if (wasteAggRes.ok) {
        setWasteData(await wasteAggRes.json());
      } else {
        setWasteData(FALLBACK_WASTE);
      }

      if (revRes.ok) setRevenueData(await revRes.json());
    } catch (err) {
      console.warn("Using fallback campus dataset for static deployment:", err);
      setMenuItems(FALLBACK_MENU_ITEMS);
      setOrders(FALLBACK_ORDERS);
      setSummary(FALLBACK_SUMMARY);
      setDemandData(FALLBACK_DEMAND);
      setWasteData(FALLBACK_WASTE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-poll every 12 seconds for kitchen and orders updates
    const timer = setInterval(() => {
      fetchData();
    }, 12000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Handle Tab Switch by User Role if changed
  const handleRoleChange = (role: "customer" | "staff" | "admin") => {
    setUserRole(role);
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
    if (role === "customer") setActiveTab("kiosk");
    else if (role === "staff") setActiveTab("kitchen");
    else if (role === "admin") setActiveTab("admin");
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setUserRole(user.role);
    try {
      localStorage.setItem("smartbite_campus_session", JSON.stringify(user));
    } catch (e) {
      console.error("Failed to store campus session:", e);
    }
    // USER MANDATE: After logging or signing in redirect directly to the page in the second image (kiosk hero landing)
    setActiveTab("kiosk");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("smartbite_campus_session");
    } catch (e) {
      console.error("Failed to clear campus session:", e);
    }
    setCurrentUser(null);
    setUserRole("customer");
    setShow3DSplash(true);
    setActiveTab("kiosk");
  };

  // Place Order API call (ACID Transaction)
  const handlePlaceOrder = async (
    items: { menu_item_id: string; qty: number }[],
    paymentMethod: string
  ): Promise<Order> => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser ? currentUser._id : "u_demo_1",
        userName: currentUser ? currentUser.name : "Alex Chen (CS Dept)",
        items,
        paymentMethod,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to place order");
    }

    const newOrder: Order = await res.json();
    // Refresh local lists immediately
    fetchData();
    return newOrder;
  };

  // Update Order Status (Kitchen Queue)
  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status } : o))
        );
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Log Waste via IoT Scale
  const handleLogWaste = async (wasteData: {
    menu_item_id: string;
    wasted_qty: number;
    weight_kg: number;
    reason: string;
    station: string;
  }) => {
    const res = await fetch("/api/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wasteData),
    });

    if (!res.ok) {
      throw new Error("Failed to record waste to database");
    }

    fetchData();
  };

  // Restock Menu Item
  const handleRestockItem = async (menuItemId: string, qty: number) => {
    try {
      const res = await fetch(`/api/menu/${menuItemId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qtyToAdd: qty }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to restock:", err);
    }
  };

  // Submit Feedback
  const handleSubmitFeedback = async (
    orderId: string,
    rating: number,
    comment: string
  ): Promise<Feedback> => {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating, comment }),
    });
    return await res.json();
  };

  // Add Item to Tray
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item._id === item._id);
      if (existing) {
        return prev.map((ci) =>
          ci.item._id === item._id ? { ...ci, qty: ci.qty + 1 } : ci
        );
      }
      return [...prev, { item, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // USER MANDATE: The starting login page should come as first 3D Animated logo SmartBrite and display the login page redirecting
  if (show3DSplash) {
    return (
      <SmartBrite3DLogo
        size="splash"
        onCompleteSplash={() => setShow3DSplash(false)}
        showRedirectBanner={true}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onReplay3DLogo={() => setShow3DSplash(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#12100e] text-stone-900 dark:text-stone-100 flex flex-col selection:bg-amber-500 selection:text-white transition-colors duration-500">
      {/* Interactive Modern Hero Showcase (starts at scroll y=0) */}
      {activeTab === "kiosk" && (
        <SmoothScrollHero
          onStartOrder={() => {
            const el = document.getElementById("kiosk-app-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onOpenKitchen={() => setActiveTab("kitchen")}
          onOpenAnalytics={() => setActiveTab("admin")}
          onOpenNutrition={() => setIsAINutritionOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Main Campus Navigation (below the opening hero animation, y > 700) */}
      <div id="kiosk-app-section" className="sticky top-0 z-40">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAINutrition={() => setIsAINutritionOpen(true)}
          userRole={userRole}
          setUserRole={handleRoleChange}
          currentUser={currentUser}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Body */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <span className="text-xs font-medium text-slate-500">Loading Smart Canteen...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "kiosk" && (
              <CustomerKiosk
                menuItems={menuItems}
                orders={orders}
                onPlaceOrder={handlePlaceOrder}
                onSubmitFeedback={handleSubmitFeedback}
                cart={cart}
                setCart={setCart}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
                onOpenAINutrition={() => setIsAINutritionOpen(true)}
                currentUser={currentUser}
                onRequireLogin={() => setIsAuthModalOpen(true)}
              />
            )}

            {/* Kitchen & IoT Scale Station - Accessible ONLY to Staff/Admin */}
            {activeTab === "kitchen" && userRole !== "customer" && (
              <KitchenStation
                orders={orders}
                menuItems={menuItems}
                wasteRecords={wasteRecords}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onLogWaste={handleLogWaste}
              />
            )}

            {/* Admin & Sustainability Reports - Accessible STRICTLY ONLY to Admin (niroopkumarkonka@gmail.com) */}
            {activeTab === "admin" && userRole === "admin" && currentUser?.email === "niroopkumarkonka@gmail.com" && (
              <AdminDashboard
                summary={summary}
                demandData={demandData}
                wasteData={wasteData}
                revenueData={revenueData}
                menuItems={menuItems}
                rawInventory={inventory}
                orders={orders}
                wasteRecords={wasteRecords}
                onRestockItem={handleRestockItem}
                onRefreshAnalytics={fetchData}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {/* Strict Admin Protection Shield: No one can access admin page except admin */}
            {activeTab === "admin" && (userRole !== "admin" || currentUser?.email !== "niroopkumarkonka@gmail.com") && (
              <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-slate-900">Admin Access Strictly Restricted</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No one can access the Admin control dashboard except the designated administrator (<strong className="text-slate-900">niroopkumarkonka@gmail.com</strong>).
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab("kiosk")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Return to Food Menu
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Log In as Admin
                  </button>
                </div>
              </div>
            )}

            {/* Kitchen Station Access Restriction for Students */}
            {activeTab === "kitchen" && userRole === "customer" && (
              <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Restricted Staff Access</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The Kitchen Display System and Scales are accessible only to authorized kitchen chef staff.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab("kiosk")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Return to Food Menu
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* AI Clinical Nutritionist Modal */}
      <AINutritionistModal
        isOpen={isAINutritionOpen}
        onClose={() => setIsAINutritionOpen(false)}
        menuItems={menuItems}
        onAddToCart={handleAddToCart}
      />

      {/* Student & Staff Auth Modal (Sign In with Google) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        defaultRole={userRole}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
