import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Flame,
  Dumbbell,
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ShoppingBag,
  Heart,
  Star,
  Receipt,
  X,
  CreditCard,
  QrCode,
  ChevronRight,
  IceCream,
  Cookie,
} from "lucide-react";
import confetti from "canvas-confetti";
import { MenuItem, Order, CartItem, Feedback, User } from "../types";
import { BillReceiptModal } from "./BillReceiptModal";
import { FamXPaymentQR } from "./FamXPaymentQR";

interface CustomerKioskProps {
  menuItems: MenuItem[];
  orders: Order[];
  onPlaceOrder: (items: { menu_item_id: string; qty: number }[], paymentMethod: string) => Promise<Order>;
  onSubmitFeedback: (orderId: string, rating: number, comment: string) => Promise<Feedback>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  onOpenAINutrition: () => void;
  currentUser?: User | null;
  onRequireLogin: () => void;
}

export const CustomerKiosk: React.FC<CustomerKioskProps> = ({
  menuItems,
  orders,
  onPlaceOrder,
  onSubmitFeedback,
  cart,
  setCart,
  isCartOpen,
  setIsCartOpen,
  onOpenAINutrition,
  currentUser,
  onRequireLogin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDietaryTag, setSelectedDietaryTag] = useState<string>("All");
  const [maxCalories, setMaxCalories] = useState<number>(800);
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [isBillOpen, setIsBillOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("UPI / QR Code");
  const [billEmail, setBillEmail] = useState<string>(currentUser?.email || "niroopkumarkonka@gmail.com");
  const [billPhone, setBillPhone] = useState<string>("9390962020");

  // Feedback state
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  const categories = [
    "All",
    "Ice Creams & Chocolates",
    "Desserts & Waffles",
    "Cafe & Fast Food",
    "Biryani & Meals",
    "Grain Bowls",
    "Main Entrees",
    "Breakfast",
    "Wraps & Paninis",
    "Salads",
    "Beverages",
  ];
  const dietaryFilters = ["All", "Sweet Treat", "Vegetarian", "Non-Veg", "High Protein", "Vegan", "Gluten-Free", "Low Carb"];

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (selectedDietaryTag !== "All") {
      if (selectedDietaryTag === "Sweet Treat") {
        const isSweet =
          item.category === "Ice Creams & Chocolates" ||
          item.category === "Desserts & Waffles" ||
          item.dietary_tags.some((t) => t.toLowerCase().includes("sweet") || t.toLowerCase().includes("dessert"));
        if (!isSweet) return false;
      } else if (!item.dietary_tags.includes(selectedDietaryTag)) {
        return false;
      }
    }
    if (item.calories > maxCalories) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchIngr = item.ingredients.some((ing) => ing.toLowerCase().includes(q));
      const matchCat = item.category.toLowerCase().includes(q);
      const matchTags = item.dietary_tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchIngr && !matchCat && !matchTags) return false;
    }
    return true;
  });

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item._id === item._id);
      if (existing) {
        if (existing.qty >= item.stock_qty) {
          alert(`Sorry, only ${item.stock_qty} currently available in the kitchen.`);
          return prev;
        }
        return prev.map((ci) =>
          ci.item._id === item._id ? { ...ci, qty: ci.qty + 1 } : ci
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.item._id === itemId) {
            const newQty = ci.qty + delta;
            if (newQty > ci.item.stock_qty) {
              alert(`Maximum kitchen quantity available: ${ci.item.stock_qty}`);
              return ci;
            }
            return newQty > 0 ? { ...ci, qty: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartTotal = cart.reduce((acc, ci) => acc + ci.item.price * ci.qty, 0);
  const cartTotalCalories = cart.reduce((acc, ci) => acc + ci.item.calories * ci.qty, 0);
  const cartTotalProtein = cart.reduce((acc, ci) => acc + ci.item.protein_g * ci.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Check if user is logged in
    if (!currentUser) {
      setIsCartOpen(false);
      onRequireLogin();
      return;
    }

    setIsOrdering(true);
    setOrderError(null);

    try {
      const itemsPayload = cart.map((ci) => ({
        menu_item_id: ci.item._id,
        qty: ci.qty,
      }));

      const newOrder = await onPlaceOrder(itemsPayload, selectedPaymentMethod);
      setCart([]);
      setLatestOrder(newOrder);
      setIsBillOpen(true);
      setIsCartOpen(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#38bdf8"],
      });
    } catch (err: any) {
      setOrderError(err.message || "Unable to place order due to limited kitchen stock.");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackOrderId) return;
    await onSubmitFeedback(feedbackOrderId, feedbackRating, feedbackComment);
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackOrderId(null);
      setFeedbackSuccess(false);
      setFeedbackComment("");
    }, 2000);
  };

  return (
    <div id="kiosk-menu-section" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 scroll-mt-20">
      {/* Search & Filter Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Today&apos;s Fresh Menu</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Kitchen Synced
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse healthy campus dining choices with live stock and clear nutrition details.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food or ingredient..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* AI Nutrition Assistant trigger */}
            <button
              onClick={onOpenAINutrition}
              className="flex items-center space-x-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition whitespace-nowrap shadow-2xs"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>AI Meal Guide</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-2">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dietary and Calorie Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 mr-1">Diet Preference:</span>
            {dietaryFilters.map((diet) => (
              <button
                key={diet}
                onClick={() => setSelectedDietaryTag(diet)}
                className={`rounded-full px-3 py-1 transition ${
                  selectedDietaryTag === diet
                    ? "border border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {diet}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-slate-600">
              Max Calories: <strong className="text-slate-900">{maxCalories} kcal</strong>
            </span>
            <input
              type="range"
              min="200"
              max="1000"
              step="50"
              value={maxCalories}
              onChange={(e) => setMaxCalories(parseInt(e.target.value, 10))}
              className="accent-emerald-600 h-1.5 w-28 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Featured Biryani & Meals Spotlight Banner (21st.dev / modern e-commerce inspired) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-zinc-900 to-amber-950 text-white shadow-xl border border-amber-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>CHEF&apos;S SIGNATURE BIRYANI & DELUXE MEALS</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hyderabadi Chicken Dum Biryani & Traditional Meals
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Authentic slow-dum cooked Royal Basmati with tender marinated chicken, Kashmiri saffron, fried birista onions, and Mirchi Ka Salan — plus classic South & North Indian Deluxe Thali Meals.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => setSelectedCategory("Biryani & Meals")}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Explore Biryani & Meals</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {(() => {
                const hydItem = menuItems.find((m) => m._id === "menu_biryani_01");
                if (!hydItem) return null;
                return (
                  <button
                    onClick={() => addToCart(hydItem)}
                    className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-4 py-2 text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-amber-400" />
                    <span>Quick Add Hyderabadi Dum (₹260)</span>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Mini Cards of Featured Biryani & Meals */}
          <div className="grid grid-cols-2 gap-3 shrink-0 w-full sm:w-auto">
            <div
              onClick={() => setSelectedCategory("Biryani & Meals")}
              className="cursor-pointer group relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 hover:border-amber-400/50 transition p-2 flex flex-col w-36 sm:w-40"
            >
              <img
                src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80"
                alt="Hyderabadi Chicken Dum Biryani"
                className="h-24 w-full object-cover rounded-xl group-hover:scale-105 transition"
              />
              <span className="text-xs font-bold text-white mt-2 truncate">Chicken Dum Biryani</span>
              <span className="text-[11px] font-mono text-amber-300">₹260 · Saffron Dum</span>
            </div>
            <div
              onClick={() => setSelectedCategory("Biryani & Meals")}
              className="cursor-pointer group relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 hover:border-amber-400/50 transition p-2 flex flex-col w-36 sm:w-40"
            >
              <img
                src="https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=400&q=80"
                alt="South Indian Deluxe Meal Thali"
                className="h-24 w-full object-cover rounded-xl group-hover:scale-105 transition"
              />
              <span className="text-xs font-bold text-white mt-2 truncate">South Indian Thali</span>
              <span className="text-[11px] font-mono text-amber-300">₹190 · Full Meal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Desserts, Waffles & Ice Creams Showcase */}
      {(selectedCategory === "All" ||
        selectedCategory === "Ice Creams & Chocolates" ||
        selectedCategory === "Desserts & Waffles" ||
        selectedDietaryTag === "Sweet Treat") && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-neutral-900 to-amber-950 text-white shadow-xl border border-rose-500/20">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-300">
                <IceCream className="h-3.5 w-3.5" />
                <span>ARTISANAL ICE CREAMS, CHOCOLATES, CRISP WAFFLES & DESSERTS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Sweet Cravings, Belgian Waffles & Gelato Bar
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Handcrafted 70% Belgian dark chocolate gelato, Ratnagiri Alphonso mango kulfi, freshly pressed golden waffles with Nutella & Biscoff, hand-rolled hazelnut Rocher pralines, and warm molten lava cakes.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedCategory("Ice Creams & Chocolates")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === "Ice Creams & Chocolates"
                      ? "bg-rose-500 text-white shadow-md"
                      : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  }`}
                >
                  <IceCream className="h-3.5 w-3.5 text-rose-400" />
                  <span>Ice Creams & Chocolates</span>
                </button>
                <button
                  onClick={() => setSelectedCategory("Desserts & Waffles")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === "Desserts & Waffles"
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  }`}
                >
                  <Cookie className="h-3.5 w-3.5 text-amber-400" />
                  <span>Waffles & Desserts</span>
                </button>
              </div>
            </div>

            {/* Quick-Pick Sweet Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0 w-full sm:w-auto">
              <div
                onClick={() => setSelectedCategory("Ice Creams & Chocolates")}
                className="cursor-pointer group relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 hover:border-rose-400/50 transition p-2 flex flex-col w-32 sm:w-36"
              >
                <img
                  src="https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80"
                  alt="Belgian 70% Dark Chocolate Gelato"
                  className="h-20 sm:h-24 w-full object-cover rounded-xl group-hover:scale-105 transition"
                />
                <span className="text-xs font-bold text-white mt-2 truncate">Belgian Gelato</span>
                <span className="text-[11px] font-mono text-rose-300">₹130 · 70% Dark</span>
              </div>

              <div
                onClick={() => setSelectedCategory("Desserts & Waffles")}
                className="cursor-pointer group relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 hover:border-amber-400/50 transition p-2 flex flex-col w-32 sm:w-36"
              >
                <img
                  src="https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80"
                  alt="Belgian Waffle with Nutella & Banana"
                  className="h-20 sm:h-24 w-full object-cover rounded-xl group-hover:scale-105 transition"
                />
                <span className="text-xs font-bold text-white mt-2 truncate">Nutella Waffle</span>
                <span className="text-[11px] font-mono text-amber-300">₹185 · Fresh Crisp</span>
              </div>

              <div
                onClick={() => setSelectedCategory("Ice Creams & Chocolates")}
                className="cursor-pointer group relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 hover:border-rose-400/50 transition p-2 flex flex-col w-32 sm:w-36 hidden sm:flex"
              >
                <img
                  src="https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80"
                  alt="Artisanal Dark Chocolate Truffles"
                  className="h-20 sm:h-24 w-full object-cover rounded-xl group-hover:scale-105 transition"
                />
                <span className="text-xs font-bold text-white mt-2 truncate">Cocoa Truffles</span>
                <span className="text-[11px] font-mono text-rose-300">₹160 · Box of 4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Info className="mx-auto h-8 w-8 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No matching dishes found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search or picking a different category.</p>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSelectedDietaryTag("All");
              setSearchQuery("");
              setMaxCalories(800);
            }}
            className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const inCart = cart.find((ci) => ci.item._id === item._id);
            const isLowStock = item.stock_qty <= 5;
            const isOutOfStock = item.stock_qty <= 0;

            return (
              <div
                key={item._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md hover:border-slate-300"
              >
                {/* Image Container with Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-white/90 backdrop-blur-md px-2 py-1 text-[11px] font-semibold text-slate-800 border border-slate-200 shadow-xs">
                      {item.category}
                    </span>
                    {item.dietary_tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-emerald-50/95 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 shadow-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stock Availability Pill */}
                  <div className="absolute top-3 right-3">
                    {isOutOfStock ? (
                      <span className="rounded-md bg-red-50/95 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700 shadow-xs">
                        Sold Out
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center space-x-1 rounded-md bg-amber-50/95 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-800 animate-pulse shadow-xs">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Only {item.stock_qty} left</span>
                      </span>
                    ) : (
                      <span className="rounded-md bg-white/90 border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-xs">
                        {item.stock_qty} ready
                      </span>
                    )}
                  </div>

                  {/* Prep time badge bottom left */}
                  <div className="absolute bottom-3 left-3 flex items-center space-x-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-800 border border-slate-200 shadow-xs">
                    <Clock className="h-3 w-3 text-cyan-600" />
                    <span>~{item.prep_time_minutes} min prep</span>
                  </div>

                  {/* Price bottom right */}
                  <div className="absolute bottom-3 right-3 text-lg font-extrabold text-white drop-shadow-md">
                    ₹{item.price.toFixed(2)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {item.name}
                    </h3>

                    {/* Ingredients summary */}
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.ingredients.join(" • ")}
                    </p>
                  </div>

                  {/* Macro Nutrient Grid */}
                  <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs border border-slate-200/80">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Energy</span>
                      <span className="font-bold text-slate-800">{item.calories}</span>
                      <span className="text-[10px] text-slate-500"> kcal</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Protein</span>
                      <span className="font-bold text-emerald-700">{item.protein_g}</span>
                      <span className="text-[10px] text-slate-500"> g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Carbs</span>
                      <span className="font-bold text-cyan-700">{item.carbs_g}</span>
                      <span className="text-[10px] text-slate-500"> g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Fat</span>
                      <span className="font-bold text-amber-700">{item.fat_g}</span>
                      <span className="text-[10px] text-slate-500"> g</span>
                    </div>
                  </div>

                  {/* Action Button: Add or Adjust */}
                  <div className="pt-1">
                    {inCart ? (
                      <div className="flex items-center justify-between rounded-xl bg-slate-100 p-1 border border-slate-200">
                        <button
                          onClick={() => updateCartQty(item._id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-800 hover:bg-slate-200 transition shadow-2xs"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold text-sm text-emerald-800">
                          {inCart.qty} in tray
                        </span>
                        <button
                          onClick={() => updateCartQty(item._id, 1)}
                          disabled={inCart.qty >= item.stock_qty}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-40 transition shadow-2xs"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        disabled={isOutOfStock}
                        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add to Tray</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Order Pickup Board */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              <span>Live Order Status & Pickup</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Watch for your order number. Pick up your tray when your number turns green!
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Updates automatically</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {orders.slice(0, 4).map((order) => {
            const isReady = order.status === "ready";
            const isPreparing = order.status === "preparing";
            const isCompleted = order.status === "completed";

            return (
              <div
                key={order._id}
                className={`rounded-xl border p-4 space-y-2.5 transition ${
                  isReady
                    ? "border-emerald-300 bg-emerald-50/70"
                    : isPreparing
                    ? "border-amber-300 bg-amber-50/60"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-slate-900 tracking-wider">
                    {order.token_number}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isReady
                        ? "bg-emerald-600 text-white"
                        : isPreparing
                        ? "bg-amber-500 text-white"
                        : isCompleted
                        ? "bg-slate-200 text-slate-700"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 truncate font-medium">
                  {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/70">
                  <span>Est. Pickup: {order.pickup_time_est || "In a few mins"}</span>
                  <span className="font-bold text-slate-800">₹{order.total_amount.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setLatestOrder(order);
                      setIsBillOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 py-1 text-[11px] font-bold text-emerald-800 transition cursor-pointer"
                  >
                    <Receipt className="h-3 w-3" />
                    <span>View Bill</span>
                  </button>

                  {isCompleted && (
                    <button
                      onClick={() => setFeedbackOrderId(order._id)}
                      className="text-center text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:underline px-1.5"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Student Bill / Receipt Modal */}
      <BillReceiptModal
        order={latestOrder}
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        defaultEmail={billEmail}
        defaultPhone={billPhone}
      />

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="relative flex h-full w-full max-w-md flex-col justify-between border-l border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">Your Meal Tray</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Error warning if any */}
              {orderError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <p className="font-semibold flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Item Sold Out</span>
                  </p>
                  <p className="mt-1">{orderError}</p>
                </div>
              )}

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-800">Your tray is empty</p>
                  <p className="text-xs text-slate-500 mt-1">Pick your favorite dishes from the menu to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 my-4 space-y-3">
                  {cart.map((ci) => (
                    <div key={ci.item._id} className="pt-3 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">{ci.item.name}</div>
                        <div className="text-[11px] text-slate-500">
                          ₹{ci.item.price.toFixed(2)} each • {ci.item.calories * ci.qty} kcal
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                          onClick={() => updateCartQty(ci.item._id, -1)}
                          className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-200 shadow-2xs"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 px-1">{ci.qty}</span>
                        <button
                          onClick={() => updateCartQty(ci.item._id, 1)}
                          disabled={ci.qty >= ci.item.stock_qty}
                          className="h-6 w-6 flex items-center justify-center rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-30 shadow-2xs"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-900 w-14 text-right">
                        ₹{(ci.item.price * ci.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nutritional Breakdown Summary */}
              {cart.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 mt-4 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Total Nutrition in Tray</span>
                    <span className="text-emerald-800 font-extrabold">{cartTotalCalories} kcal</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Total Protein: <strong className="text-emerald-800">{cartTotalProtein}g</strong></span>
                    <span>Allergens: <strong className="text-slate-800">Checked</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Checkout Section */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-4">
                {/* Payment Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    How would you like to pay?
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {["UPI / QR Code", "Campus Card", "Credit / Debit Card", "Cash on Counter"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={`rounded-xl p-2.5 font-medium border text-left transition cursor-pointer ${
                          selectedPaymentMethod === method
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* USER REQUIREMENT: FamX UPI QR Code in checkout */}
                {selectedPaymentMethod === "UPI / QR Code" && (
                  <div className="my-2">
                    <FamXPaymentQR
                      amount={cartTotal}
                      upiId="9390962020@fam"
                      recipientName="SmartBrite Dining"
                      compact={true}
                    />
                  </div>
                )}

                {/* USER REQUIREMENT: Bill delivery to email or mobile no */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Deliver Bill & Token To:
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Email + WhatsApp
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={billEmail}
                        onChange={(e) => setBillEmail(e.target.value)}
                        placeholder="student@campus.edu"
                        className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Mobile No (WhatsApp)
                      </label>
                      <input
                        type="tel"
                        value={billPhone}
                        onChange={(e) => setBillPhone(e.target.value)}
                        placeholder="9390962020"
                        className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Subtotal & Action */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total Amount</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹{cartTotal.toFixed(2)}</span>
                </div>

                <button
                  id="checkout-confirm-btn"
                  onClick={handleCheckout}
                  disabled={isOrdering}
                  className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isOrdering ? "Placing Your Order..." : `Confirm & Pay with ${selectedPaymentMethod}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">How was your meal?</h3>
              <button onClick={() => setFeedbackOrderId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-8 text-center text-emerald-700 space-y-2">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <p className="font-bold text-slate-900 text-base">Thank you for your review!</p>
                <p className="text-xs text-slate-500">Your feedback helps our chefs adjust recipes and portion sizes.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`p-2 rounded-lg text-2xl transition ${
                          feedbackRating >= star ? "text-amber-500" : "text-slate-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Comments on Taste, Freshness or Portion</label>
                  <textarea
                    rows={3}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="e.g. Delicious salmon bowl, perfect portion with zero leftovers!"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                  />
                </div>

                <button
                  onClick={handleSendFeedback}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                >
                  Submit Review
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
