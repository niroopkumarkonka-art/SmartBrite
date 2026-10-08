import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Theme, getInitialTheme, applyTheme } from "../../lib/theme";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);

    const onThemeChange = (e: any) => {
      if (e.detail) setTheme(e.detail);
    };
    window.addEventListener("smartbrite-theme-change", onThemeChange);
    return () => window.removeEventListener("smartbrite-theme-change", onThemeChange);
  }, []);

  const handleToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 border cursor-pointer ${
        theme === "dark"
          ? "bg-stone-800/80 border-stone-700 text-amber-400 hover:bg-stone-700 shadow-sm"
          : "bg-amber-50/80 border-amber-200/80 text-amber-800 hover:bg-amber-100 shadow-xs"
      } ${className}`}
      title={theme === "dark" ? "Switch to Warm Light Mode" : "Switch to Dusky Dark Mode"}
      aria-label="Toggle light and dark mode"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;
