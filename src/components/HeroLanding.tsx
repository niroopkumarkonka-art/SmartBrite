import React from "react";
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  Scale,
  ShieldCheck,
  Leaf,
  Activity,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

interface HeroLandingProps {
  onExploreKiosk: () => void;
  onOpenKitchen: () => void;
  onOpenAnalytics: () => void;
  onOpenAINutrition: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onExploreKiosk,
  onOpenKitchen,
  onOpenAnalytics,
  onOpenAINutrition,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/90 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/60 py-12 sm:py-16">
      {/* Subtle background ambient circles */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-10 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Smart Campus Dining • Fresh Food & Less Waste</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Fast & Accurate Orders</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
            <Scale className="h-3.5 w-3.5 text-amber-600" />
            <span>Smart Waste Scales</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Fresh, Healthy Food. <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Zero Food Waste.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Order delicious chef-prepared meals in seconds, skip long lines, track your nutrition, and help our campus cafeteria stop food waste through smart kitchen planning.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-order-now-btn"
                onClick={onExploreKiosk}
                className="group flex items-center space-x-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-600/25"
              >
                <span>Order Food Now</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="hero-kitchen-scale-btn"
                onClick={onOpenKitchen}
                className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
              >
                <Scale className="h-4 w-4 text-amber-600" />
                <span>Kitchen & Scale</span>
              </button>

              <button
                id="hero-ai-nutrition-btn"
                onClick={onOpenAINutrition}
                className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>AI Meal Guide</span>
              </button>

              <button
                id="hero-analytics-btn"
                onClick={onOpenAnalytics}
                className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
              >
                <BarChart3 className="h-4 w-4 text-cyan-600" />
                <span>Analytics & Reports</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200/80 text-xs text-slate-500">
              <div>
                <span className="block font-bold text-slate-900 text-lg">38% Less</span>
                <span>Food wasted daily</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-lg">&lt; 7 mins</span>
                <span>Average pickup wait</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-lg">100% Fresh</span>
                <span>Cooked from scratch</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean White Dashboard Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Today&apos;s Live Campus Stats
                  </span>
                </div>
                <span className="text-[11px] rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-semibold text-emerald-700">
                  Live Updates
                </span>
              </div>

              {/* Live Metric Rows */}
              <div className="space-y-3">
                {/* Metric 1 */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Food Saved from Waste</div>
                      <div className="text-[11px] text-slate-500">Tracked by smart kitchen scales</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-700">142.8 kg</div>
                    <div className="text-[10px] font-semibold text-emerald-600">↓ 38% better</div>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-cyan-100 text-cyan-700">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Average Pickup Wait Time</div>
                      <div className="text-[11px] text-slate-500">Token board on wall</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-700">6.2 min</div>
                    <div className="text-[10px] font-semibold text-cyan-600">Quick pickup</div>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Carbon Footprint Saved</div>
                      <div className="text-[11px] text-slate-500">From less kitchen leftover</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-700">314.5 kg CO₂</div>
                    <div className="text-[10px] font-semibold text-amber-600">Eco-friendly</div>
                  </div>
                </div>

                {/* Quick Link into Dashboard */}
                <div
                  onClick={onOpenAnalytics}
                  className="group flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 cursor-pointer hover:bg-emerald-100/80 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Activity className="h-4 w-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-950 transition">
                      View Canteen Dashboard & Popular Meals
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-700 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
