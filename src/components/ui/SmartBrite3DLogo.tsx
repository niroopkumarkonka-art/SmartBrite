import React, { useState, useEffect } from "react";
import { Coffee, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface SmartBrite3DLogoProps {
  size?: "sm" | "md" | "lg" | "splash";
  onCompleteSplash?: () => void;
  showRedirectBanner?: boolean;
}

export const SmartBrite3DLogo: React.FC<SmartBrite3DLogoProps> = ({
  size = "md",
  onCompleteSplash,
  showRedirectBanner = false,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [isHovered, setIsHovered] = useState(false);

  // Safe countdown effect preventing setState during render
  useEffect(() => {
    if (size !== "splash" || !onCompleteSplash) return;
    if (countdown <= 0) {
      const timer = setTimeout(() => {
        onCompleteSplash();
      }, 50);
      return () => clearTimeout(timer);
    }
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [size, onCompleteSplash, countdown]);

  const isSplash = size === "splash";
  const isLarge = size === "lg" || isSplash;

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${
        isSplash
          ? "min-h-screen w-full bg-[#faf8f5] dark:bg-[#181512] text-stone-900 dark:text-stone-100 p-6 overflow-hidden transition-colors duration-500"
          : ""
      }`}
    >
      {/* Light / Dark Mode Switcher in Top Right for Splash View */}
      {isSplash && (
        <div className="absolute top-6 right-6 z-30 flex items-center gap-2 rounded-full border border-stone-300 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/80 px-3.5 py-1.5 shadow-md backdrop-blur-md">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">Theme:</span>
          <ThemeToggle />
        </div>
      )}

      {/* Warm Ambient Dusky Glows */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="h-[520px] w-[520px] -top-24 rounded-full opacity-40 dark:opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(217, 119, 6, 0.35) 0%, rgba(180, 83, 9, 0.2) 40%, rgba(120, 53, 15, 0.08) 70%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#78350f_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Main Coffee Visual Stage */}
      <div
        className="relative z-10 flex flex-col items-center cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Warm Rising Steam Aroma Rings */}
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute rounded-full border border-amber-500/25 dark:border-amber-400/20 pointer-events-none animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] ${
              isLarge ? "h-64 w-64" : "h-36 w-36"
            }`}
          />
          <div
            className={`absolute rounded-full border border-orange-500/20 pointer-events-none animate-[spin_20s_linear_infinite] ${
              isLarge ? "h-72 w-72" : "h-40 w-40"
            }`}
          />

          {/* Steaming Coffee Cup Visual */}
          <div
            className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
              isLarge ? "h-48 w-48 sm:h-56 sm:w-56 my-5" : "h-24 w-24 my-2"
            } ${
              isHovered ? "scale-105 shadow-amber-900/30" : "scale-100"
            } border-2 border-amber-300/60 dark:border-amber-700/60 bg-stone-900`}
          >
            <img
              src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
              alt="Artisanal Steaming Coffee Cup"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Ambient Dusky Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/20 to-transparent" />

            {/* Steaming Aroma Badge */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white">
              <Coffee className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
              <span className="text-[10px] sm:text-xs font-bold tracking-tight">
                Freshly Brewed Latte
              </span>
            </div>
          </div>
        </div>

        {/* Brand Dusky Cafe Typography */}
        <div className="text-center mt-3 space-y-1.5 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-300/60 dark:border-amber-800/60 bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
            <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-bold tracking-wide uppercase">
               Fresh Dining
            </span>
          </div>

          <h2
            className={`font-black font-serif tracking-tight ${
              isSplash
                ? "text-4xl sm:text-5xl lg:text-6xl text-stone-900 dark:text-[#f8f5ee]"
                : "text-2xl text-stone-900 dark:text-white"
            }`}
          >
            Smart<span className="text-amber-600 dark:text-amber-500">Brite</span>
          </h2>

          <p
            className={`font-medium ${
              isSplash
                ? "text-stone-600 dark:text-stone-400 text-sm sm:text-base"
                : "text-xs text-stone-500"
            }`}
          >
            Intelligent Campus Dining, AI-Zero Waste & Artisanal Cafe Experience
          </p>
        </div>
      </div>

      {/* Splash Redirect Controls */}
      {isSplash && onCompleteSplash && (
        <div className="mt-8 flex flex-col items-center gap-4 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onCompleteSplash}
              className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-extrabold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <span>Launch SmartBrite Portal</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {countdown > 0 && (
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <RefreshCw className="h-3 w-3 animate-spin text-amber-600 dark:text-amber-400" />
              <span>
                Redirecting to secure login in{" "}
                <strong className="text-stone-900 dark:text-stone-200">{countdown}s</strong>...
              </span>
            </div>
          )}

          {showRedirectBanner && (
            <div className="text-[11px] text-stone-500 dark:text-stone-400 text-center max-w-sm">
              Artisan Campus Dining & Coffee Roastery
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartBrite3DLogo;
