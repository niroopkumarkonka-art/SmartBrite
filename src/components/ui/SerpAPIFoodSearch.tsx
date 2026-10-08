import React, { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  ExternalLink,
  Flame,
  Clock,
  Star,
  CheckCircle2,
  ChevronRight,
  Globe,
  Loader2,
  Info,
} from "lucide-react";

interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  thumbnail?: string;
}

interface RecipeResult {
  title: string;
  link: string;
  source?: string;
  rating?: number;
  reviews?: number;
  totalTime?: string;
  ingredients?: string[];
  thumbnail?: string;
}

export const SerpAPIFoodSearch: React.FC = () => {
  const [query, setQuery] = useState("Hyderabadi Dum Biryani nutrition calories");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    organic: SerpResult[];
    knowledgeGraph?: any;
    recipes?: RecipeResult[];
    totalResults?: number;
    timeTaken?: number;
  } | null>(null);
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);

  // Initial fetch for popular search
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/serp/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!data.error) {
        setResults(data);
      }
    } catch (err) {
      console.error("SerpAPI search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check account quota on mount
  useEffect(() => {
    fetch("/api/serp/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.searchesRemaining !== undefined) {
          setSearchesLeft(d.searchesRemaining);
        }
      })
      .catch(() => {});

    // Initial search
    performSearch(query);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const QUICK_TAGS = [
    "Hyderabadi Biryani Calories",
    "High-Protein Quinoa Bowl",
    "Avocado Toast Benedict Recipe",
    "Iced Caramel Macchiato Nutrition",
    "Low Carbon Smart Dining",
  ];

  return (
    <div className="relative w-full rounded-3xl border border-white/10 bg-slate-900/90 text-white backdrop-blur-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
      {/* Background radial gradient beam */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
            <Globe className="h-3 w-3 text-cyan-400 animate-spin" />
            <span>Live Google Search Powered by SerpAPI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Cult Food Directory & Web Nutritional Engine
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time web verification, macro breakdowns, and recipe intelligence for all cafeteria meals.
          </p>
        </div>

        {searchesLeft !== null && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SerpAPI Active: <strong>{searchesLeft} Searches</strong> remaining</span>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleFormSubmit} className="relative z-10 mt-6">
        <div className="relative flex items-center">
          <Search className="absolute left-4.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any food item, calories, allergens, or culinary recipe..."
            className="w-full rounded-2xl border border-white/15 bg-white/5 py-4 pl-12 pr-28 text-sm text-white placeholder-slate-400 shadow-inner backdrop-blur-md outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:opacity-95 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>Search</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Trending:
          </span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag);
                performSearch(tag);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-300 transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </form>

      {/* Results Content */}
      <div className="relative z-10 mt-6 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="text-xs text-slate-400">Fetching live Google insights via SerpAPI...</span>
          </div>
        )}

        {!isLoading && results && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Knowledge Graph / Recipes */}
            {results.knowledgeGraph && (
              <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Flame className="h-4 w-4" />
                  <span>Google Knowledge Card</span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {results.knowledgeGraph.title}
                </h4>
                {results.knowledgeGraph.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {results.knowledgeGraph.description}
                  </p>
                )}
                {results.knowledgeGraph.thumbnail && (
                  <img
                    src={results.knowledgeGraph.thumbnail}
                    alt={results.knowledgeGraph.title}
                    className="w-full h-36 object-cover rounded-xl border border-white/10"
                  />
                )}
              </div>
            )}

            {/* Right Column / Full Width: Organic Web Results */}
            <div className={`${results.knowledgeGraph ? "lg:col-span-7" : "lg:col-span-12"} space-y-3`}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified Google Results</span>
                {results.timeTaken && (
                  <span>Query completed in {results.timeTaken}s</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.organic.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-cyan-400/40 hover:bg-white/10 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-cyan-400 truncate max-w-[180px]">
                          {item.source || "Google Search"}
                        </span>
                        <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition" />
                      </div>
                      <h5 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition line-clamp-1">
                        {item.title}
                      </h5>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.snippet}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-medium">Read on Google</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SerpAPIFoodSearch;
