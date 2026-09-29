import React from "react";
import { Coffee, Scale, Leaf, Terminal, Sparkles, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="motion-logo-mark flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/20">
            <Coffee className="h-4 w-4" />
          </div>
          <div>
            <div className="motion-logo font-extrabold text-slate-900 text-sm">
              Smart<span>Brite</span> Campus Dining
            </div>
            <p className="text-xs text-slate-500">
              Demand Forecasting, Mobile Ordering & Food Waste Prevention
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 font-medium">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>AI Demand Forecasting</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Scale className="h-3.5 w-3.5 text-amber-600" />
            <span>Real-time IoT Kitchen Scales</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Leaf className="h-3.5 w-3.5 text-teal-600" />
            <span>EPA Zero-Waste Circular Kitchen</span>
          </span>
        </div>

        <div className="text-xs text-slate-400">
          Sustainable Dining for University Campuses & Corporates
        </div>
      </div>
    </footer>
  );
};
