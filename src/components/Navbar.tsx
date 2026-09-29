import React from "react";
import {
  UtensilsCrossed,
  Coffee,
  LayoutDashboard,
  ChefHat,
  ShoppingBag,
  Sparkles,
  Scale,
  UserCheck,
  Terminal,
  LogOut,
} from "lucide-react";

interface NavbarProps {
  activeTab: "kiosk" | "kitchen" | "admin";
  setActiveTab: (tab: "kiosk" | "kitchen" | "admin") => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAINutrition: () => void;
  userRole: "customer" | "staff" | "admin";
  setUserRole: (role: "customer" | "staff" | "admin") => void;
  currentUser?: { name: string; email: string; role: "customer" | "staff" | "admin"; avatar_url?: string; student_id?: string } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  onOpenAINutrition,
  userRole,
  setUserRole,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs"
      data-testid="main-navigation"
    >
      {/* Top micro ticker */}
      <div className="hidden border-b border-slate-200/70 bg-slate-50/90 px-4 py-1.5 sm:flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-emerald-700 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Campus Dining: Open & Serving</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center space-x-1 text-slate-600">
            <Scale className="h-3 w-3 text-amber-600" />
            <span>Smart Food Scales Active</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">
            Average Wait Time: <strong className="text-slate-900 font-semibold">~6 mins</strong>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-500">Zero-Waste Campus Kitchen</span>
          <span className="flex items-center space-x-1 rounded-md px-2 py-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium text-[11px]">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span>AI Powered</span>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab("kiosk")}
          data-testid="brand-logo"
        >
          <div className="motion-logo-mark flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <div className="motion-logo flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-lg">
                Smart<span>Brite</span>
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                CAMPUS CAFE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5">Fresh Food & Zero Waste</p>
          </div>
        </div>

        {/* Navigation Tabs - STRICT ROLE RESTRICTION: Reports/Dashboard ONLY visible to Kitchen & Admin */}
        <nav className="flex items-center rounded-xl border border-slate-200/90 bg-slate-100/90 p-1 text-sm shadow-inner">
          <button
            id="tab-kiosk-btn"
            onClick={() => setActiveTab("kiosk")}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 font-medium transition cursor-pointer ${
              activeTab === "kiosk"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
            <span>Order Food</span>
          </button>

          {/* Kitchen Scale Station: Visible to Kitchen Staff & Admin */}
          {(userRole === "staff" || userRole === "admin") && (
            <button
              id="tab-kitchen-btn"
              onClick={() => setActiveTab("kitchen")}
              className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 font-medium transition cursor-pointer ${
                activeTab === "kitchen"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ChefHat className="h-4 w-4 text-amber-600" />
              <span>Kitchen & Scale</span>
            </button>
          )}

          {/* Dashboard & Reports: STRICTLY RESTRICTED to authenticated Admin (niroopkumarkonka@gmail.com) */}
          {userRole === "admin" && currentUser?.email === "niroopkumarkonka@gmail.com" && (
            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab("admin")}
              className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 font-medium transition cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-cyan-600" />
              <span>Admin Reports</span>
            </button>
          )}
        </nav>

        {/* Actions & Role Switcher */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* AI Nutrition Button */}
          <button
            id="open-ai-nutrition-btn"
            onClick={onOpenAINutrition}
            className="hidden md:flex items-center space-x-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>AI Meal Guide</span>
          </button>

          {/* Role indicator & switcher with strict Admin security */}
          <div className="hidden lg:flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400 font-medium">Role:</span>
            {currentUser?.email === "niroopkumarkonka@gmail.com" ? (
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="customer" className="bg-white">Student (Diner)</option>
                <option value="staff" className="bg-white">Kitchen Staff</option>
                <option value="admin" className="bg-white">Administrator</option>
              </select>
            ) : (
              <span className="font-semibold text-slate-800">
                {userRole === "staff" ? "Kitchen Staff" : "Student (Diner)"}
              </span>
            )}
          </div>

          {/* User Auth Section (Login with Google / Account Badge) */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 pr-3 text-xs">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-emerald-500"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <span className="font-bold text-slate-900 block truncate max-w-[90px] leading-tight">
                    {currentUser.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider block">
                    {currentUser.role === "customer" ? "Student" : currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition cursor-pointer shadow-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              id="login-trigger-btn"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 transition shadow-xs cursor-pointer"
            >
              {/* Google G Logo icon */}
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            id="open-cart-btn"
            onClick={onOpenCart}
            className="relative flex items-center space-x-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Tray</span>
            {cartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-700 shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
