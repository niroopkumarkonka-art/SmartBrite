import React, { useState } from "react";
import {
  Coffee,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Star,
  Clock,
  Flame,
  Check,
  Plus,
  Leaf,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export interface HeroProduct {
  id: string;
  name: string;
  category: "coffee" | "meals" | "dessert";
  categoryLabel: string;
  price: number;
  rating: number;
  reviewsCount: number;
  prepTime: string;
  calories: number;
  tag: string;
  image: string;
  description: string;
}

const DEFAULT_HERO_PRODUCTS: HeroProduct[] = [
  {
    id: "hero_prod_01",
    name: "Artisanal Pour-Over & Cold Foam",
    category: "coffee",
    categoryLabel: "Specialty Brew",
    price: 130,
    rating: 4.9,
    reviewsCount: 148,
    prepTime: "3 mins",
    calories: 120,
    tag: "Barista Special",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    description: "Single-origin Ethiopian roast with hand-frothed vanilla oat cold foam.",
  },
  {
    id: "hero_prod_02",
    name: "Hyderabadi Chicken Dum Biryani",
    category: "meals",
    categoryLabel: "Chef Entree",
    price: 260,
    rating: 5.0,
    reviewsCount: 312,
    prepTime: "8 mins",
    calories: 610,
    tag: "Top Campus Pick",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    description: "Slow-dum fragrant basmati with whole saffron, organic ghee & cooling mint raita.",
  },
  {
    id: "hero_prod_03",
    name: "Char-Grilled Herb Chicken Bowl",
    category: "meals",
    categoryLabel: "High Protein",
    price: 220,
    rating: 4.8,
    reviewsCount: 184,
    prepTime: "7 mins",
    calories: 520,
    tag: "Fitness Fuel",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    description: "Lean rosemary-marinated breast on quinoa with steamed farm greens.",
  },
  {
    id: "hero_prod_04",
    name: "Belgian Dark Chocolate Gelato",
    category: "dessert",
    categoryLabel: "Handcrafted Treat",
    price: 130,
    rating: 4.9,
    reviewsCount: 96,
    prepTime: "2 mins",
    calories: 240,
    tag: "Artisan Dessert",
    image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80",
    description: "70% Single-origin cocoa slow-churned with pure dairy cream & sea salt.",
  },
];

interface Hero17Props {
  onStartOrder?: () => void;
  onExploreMenu?: () => void;
  onAddToCart?: (product: HeroProduct) => void;
}

/**
 * Hero 17: Ecommerce hero with a product grid
 * React Bits Pro Block - adapted to SmartBrite's dusky cafe & lighter aesthetics.
 */
export const Hero17: React.FC<Hero17Props> = ({
  onStartOrder,
  onExploreMenu,
  onAddToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const filteredProducts = DEFAULT_HERO_PRODUCTS.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  const handleAdd = (product: HeroProduct) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  return (
    <section className="relative overflow-hidden bg-[#faf8f5] dark:bg-[#181513] text-stone-900 dark:text-stone-100 transition-colors duration-500 border-b border-stone-200/70 dark:border-stone-800">
      {/* Warm Dusky Ambient Background Glows */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-amber-400/15 dark:bg-amber-600/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-orange-400/15 dark:bg-orange-700/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
        {/* Top Header Strip: Status & Theme Switcher */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-200/80 dark:border-stone-800">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/40 text-amber-900 dark:text-amber-200 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Campus Kitchen Live • Freshly Brewed & Cooked-to-Order</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 hidden sm:inline">
              Mode:
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Hero Copy & CTA Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
          <div className="lg:col-span-7 space-y-5">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800 border border-stone-300/80 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              <Coffee className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>SmartBrite Signature Cafe & Kitchen</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-serif text-stone-900 dark:text-[#f7f3ec] leading-[1.1]">
              Artisanal Coffee &{" "}
              <span className="text-amber-600 dark:text-amber-500 underline decoration-amber-400/50 decoration-wavy decoration-2">
                Chef-Crafted
              </span>{" "}
              Bowls.
            </h1>

            {/* Narrative Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-stone-600 dark:text-stone-300 font-normal max-w-xl leading-relaxed">
              Order farm-fresh campus meals and signature roasted coffee in seconds.
              Powered by zero-waste kitchen prep, smart IoT scales, and automated queue tracking.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartOrder}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Order Fresh Tray</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={onExploreMenu}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/80 text-stone-800 dark:text-stone-200 font-bold text-sm transition-all duration-200 cursor-pointer shadow-xs"
              >
                <span>Browse Full Menu</span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </button>
            </div>

            {/* Metric Highlights Strip */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200/80 dark:border-stone-800/80 max-w-lg">
              <div>
                <div className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400">
                  ~6 mins
                </div>
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  Average Prep Time
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">
                  78.4%
                </div>
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  Waste Prevented
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <span>4.9</span>
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 inline" />
                </div>
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  Verified Reviews
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-white/90 to-amber-50/60 dark:from-stone-800/90 dark:to-stone-900/90 border border-stone-200/90 dark:border-stone-700/80 shadow-xl backdrop-blur-md">
              {/* Top Banner on visual card */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Today&apos;s Highlight Selection
                </span>
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  Limited Daily Batch
                </span>
              </div>

              {/* Main Visual Image (Steaming Cafe Roast) */}
              <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-stone-900 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
                  alt="Artisanal Campus Coffee"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">Signature Campus Roast</h4>
                    <p className="text-xs text-amber-200">Fresh Brewed • Fair Trade Beans</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/90 backdrop-blur-md text-stone-950 font-black text-xs">
                    ₹130
                  </span>
                </div>
              </div>

              {/* Quick Perks Pill */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200/60 dark:border-stone-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>100% Organic Milk & Beans</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-stone-800/80 border border-emerald-200/60 dark:border-stone-700">
                  <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Zero Single-Use Plastic</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid Section Header & Category Filter Tabs */}
        <div className="mt-8 pt-8 border-t border-stone-200/80 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Featured Campus Catalog</span>
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                  {filteredProducts.length} Items
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Quick add items to your live food tray
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700 text-xs font-bold self-start">
              {[
                { id: "all", label: "All Items" },
                { id: "coffee", label: "Brews & Coffee" },
                { id: "meals", label: "Entrees & Meals" },
                { id: "dessert", label: "Desserts & Sweets" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProducts.map((prod) => {
              const isAdded = !!addedIds[prod.id];
              return (
                <div
                  key={prod.id}
                  className="group relative flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-stone-800/90 border border-stone-200/90 dark:border-stone-700/80 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  {/* Product Card Image Container */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Tag Badge */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-stone-900/80 backdrop-blur-md text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                      {prod.tag}
                    </span>

                    {/* Price Badge */}
                    <span className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-xl bg-amber-600 text-white font-black text-xs shadow-md">
                      ₹{prod.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Product Card Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                    <div>
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                        <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          {prod.categoryLabel}
                        </span>
                        <div className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{prod.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-stone-400">({prod.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {prod.name}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {/* Prep & Calories Metadata */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-100 dark:border-stone-700/60">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-stone-400" />
                        {prod.prepTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-amber-500" />
                        {prod.calories} kcal
                      </span>
                    </div>

                    {/* Add to Tray Button */}
                    <button
                      onClick={() => handleAdd(prod)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isAdded
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-stone-900 hover:bg-amber-600 dark:bg-stone-700 dark:hover:bg-amber-600 text-white shadow-xs"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span>Added to Tray</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to Tray</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero17;
