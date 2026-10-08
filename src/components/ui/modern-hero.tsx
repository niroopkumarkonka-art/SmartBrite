import React, { useState, useMemo, useRef } from "react";
import { ReactLenis } from "lenis/react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Coffee,
  Sparkles,
  Leaf,
  Zap,
  Move3d,
  Plus,
  Check,
  X,
  ArrowDown,
  ArrowRight,
  ChevronRight,
  ShoppingBag,
  CircleDot,
  Clock,
  ChefHat,
  Utensils,
  ArrowUpRight,
  LogOut,
} from "lucide-react";
import GlyphPortal from "./glyph-portal";
import WorksWheelDemo from "./works-wheel-demo";
import SerpAPIFoodSearch from "./SerpAPIFoodSearch";
import { ThemeToggle } from "./ThemeToggle";

interface ModernHeroProps {
  onStartOrder?: () => void;
  onOpenKitchen?: () => void;
  onOpenNutrition?: () => void;
  onOpenAnalytics?: () => void;
  onLogout?: () => void;
}

interface TrayItem {
  name: string;
  price: number;
  qty: number;
  note?: string;
}

const images = {
  hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85",
  pizza: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  biryani: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  chickenBiryani: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
  thaliMeal: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
  northMeal: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
  gelato: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80",
  waffle: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",
  chocolates: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
  latteArtClink: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?crop=entropy&cs=srgb&fm=jpg&q=85",
  windowTable: "https://images.unsplash.com/photo-1497636577773-f1231844b336?crop=entropy&cs=srgb&fm=jpg&q=85",
  interior: "https://images.unsplash.com/photo-1615127039501-bdcc95f61c63?crop=entropy&cs=srgb&fm=jpg&q=85",
  coldbrew: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=85",
  granola: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85",
};

const defaultMenu = [
  {
    name: "Hyderabadi Chicken Dum Biryani",
    slug: "hyderabadi-chicken-dum-biryani",
    type: "Biryani & Meals",
    price: 260,
    note: "Dum cooked fragrant basmati · tender marinated chicken · saffron · mirchi ka salan",
    tag: "Chef Special",
    image: images.biryani,
  },
  {
    name: "Classic Chicken Biryani",
    slug: "classic-chicken-biryani",
    type: "Biryani & Meals",
    price: 230,
    note: "Spiced basmati rice · boiled farm egg · fried onions · mint herb raita",
    tag: "Bestseller",
    image: images.chickenBiryani,
  },
  {
    name: "South Indian Deluxe Meal (Thali)",
    slug: "south-indian-deluxe-thali",
    type: "Biryani & Meals",
    price: 190,
    note: "Steamed rice · drumstick sambar · rasam · kootu · poriyal · appalam & payasam",
    tag: "Complete Meal",
    image: images.thaliMeal,
  },
  {
    name: "North Indian Shahi Thali Meal",
    slug: "north-indian-shahi-thali",
    type: "Biryani & Meals",
    price: 220,
    note: "Paneer butter masala · dal makhani · jeera rice · 2 butter rotis · gulab jamun",
    tag: "Royal Feast",
    image: images.northMeal,
  },
  {
    name: "Honey Oat Latte",
    slug: "honey-oat-latte",
    type: "Coffee",
    price: 180,
    note: "Single-origin espresso · wildflower honey · steamed oat milk",
    tag: "Most loved",
    image: images.latteArtClink,
  },
  {
    name: "Citrus Cold Brew",
    slug: "citrus-cold-brew",
    type: "Cold",
    price: 150,
    note: "18-hour cold brew · dehydrated orange peel · elderflower tonic",
    tag: "Bright",
    image: images.coldbrew,
  },
  {
    name: "Campus Granola Bowl",
    slug: "campus-granola-bowl",
    type: "Bites",
    price: 190,
    note: "Coconut chia yogurt · raw cacao nibs · market seasonal fruit",
    tag: "Plant based",
    image: images.granola,
  },
  {
    name: "Belgian Waffle with Nutella & Banana",
    slug: "belgian-waffle-nutella",
    type: "Desserts",
    price: 185,
    note: "Crisp pressed Liege waffle · warm Nutella · sliced banana · crushed walnuts",
    tag: "Freshly Pressed",
    image: images.waffle,
  },
  {
    name: "Belgian 70% Dark Chocolate Gelato",
    slug: "belgian-dark-chocolate-gelato",
    type: "Desserts",
    price: 130,
    note: "Slow-churned 70% dark Belgian cocoa gelato · dark chocolate shavings",
    tag: "Artisanal",
    image: images.gelato,
  },
  {
    name: "Artisanal Dark Chocolate Truffle Box",
    slug: "artisanal-chocolate-truffles",
    type: "Desserts",
    price: 160,
    note: "Box of 4 single-origin cocoa ganache truffles · sea salt & raspberry dust",
    tag: "Handcrafted",
    image: images.chocolates,
  },
];

export const SmoothScrollHero: React.FC<ModernHeroProps> = ({
  onStartOrder,
  onOpenKitchen,
  onOpenNutrition,
  onOpenAnalytics,
  onLogout,
}) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [tray, setTray] = useState<TrayItem[]>([
    { name: "Honey Oat Latte", price: 180, qty: 1 },
  ]);
  const [showTray, setShowTray] = useState(false);
  const [cupRotation, setCupRotation] = useState(0);
  const [sceneRotation, setSceneRotation] = useState(0);
  const [dragging, setDragging] = useState<"cup" | "scene" | null>(null);
  const [lastX, setLastX] = useState(0);
  const [activeFlavor, setActiveFlavor] = useState<"house" | "oat" | "honey">("house");

  const filters = ["All", "Biryani & Meals", "Coffee", "Cold", "Bites"];

  const heroTrackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroTrackRef,
    offset: ["start start", "end start"],
  });

  const lettersScale = useTransform(scrollYProgress, [0, 0.45, 0.85], [1, 3.8, 5]);
  const lettersX = useTransform(scrollYProgress, [0, 0.45, 0.85], ["0%", "-12%", "-20%"]);
  const lettersY = useTransform(scrollYProgress, [0, 0.45, 0.85], ["0%", "4%", "8%"]);
  const bgScale = useTransform(scrollYProgress, [0, 0.85], [1, 1.15]);
  const bgY = useTransform(scrollYProgress, [0, 0.85], [0, 50]);

  const leftCardY = useTransform(scrollYProgress, [0, 0.45, 0.85], [0, -55, -110]);
  const leftCardRotate = useTransform(scrollYProgress, [0, 0.45, 0.85], [-3, -6, -9]);
  const leftCardScale = useTransform(scrollYProgress, [0, 0.45, 0.85], [1, 1.08, 1.15]);

  const rightCardY = useTransform(scrollYProgress, [0, 0.45, 0.85], [0, -75, -140]);
  const rightCardRotate = useTransform(scrollYProgress, [0, 0.45, 0.85], [3, 6, 9]);
  const rightCardScale = useTransform(scrollYProgress, [0, 0.45, 0.85], [1, 1.05, 1.12]);

  const scriptScale = useTransform(scrollYProgress, [0, 0.45, 0.85], [1, 1.12, 1.25]);

  const visibleMenu = useMemo(
    () =>
      activeFilter === "All"
        ? defaultMenu
        : defaultMenu.filter((item) => item.type === activeFilter),
    [activeFilter]
  );

  const addToTray = (item: (typeof defaultMenu)[0]) => {
    setTray((current) => {
      const exists = current.find((i) => i.name === item.name);
      if (exists) {
        return current.map((i) =>
          i.name === item.name ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...current, { name: item.name, price: item.price, qty: 1 }];
    });
    setShowTray(true);
  };

  const trayTotal = tray.reduce((sum, item) => sum + item.price * item.qty, 0);

  const onDragStart = (
    event: React.MouseEvent | React.TouchEvent,
    kind: "cup" | "scene"
  ) => {
    setDragging(kind);
    const clientX =
      "clientX" in event
        ? event.clientX
        : event.touches?.[0]?.clientX || 0;
    setLastX(clientX);
  };

  const onDragMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const clientX =
      "clientX" in event
        ? event.clientX
        : event.touches?.[0]?.clientX || lastX;
    const delta = clientX - lastX;
    if (dragging === "cup") {
      setCupRotation((prev) => prev + delta * 0.7);
    }
    if (dragging === "scene") {
      setSceneRotation((prev) => prev + delta * 0.35);
    }
    setLastX(clientX);
  };

  const stopDrag = () => {
    setDragging(null);
  };

  return (
    <div
      className="site relative"
      id="top"
      data-testid="smooth-scroll-hero"
      onMouseMove={onDragMove}
      onMouseUp={stopDrag}
      onTouchMove={onDragMove}
      onTouchEnd={stopDrag}
    >
      <ReactLenis root options={{ lerp: 0.08 }}>
        {/* Top Sticky Header */}
        <header className="cafe-nav dark-nav">
          <a className="motion-logo logo" href="#top" data-testid="motion-brand-logo">
            <span className="motion-logo-mark logo-mark">
              <Coffee size={17} />
            </span>
            <span>
              Smart<span>Brite</span>
            </span>
          </a>

          <div className="nav-links">
            <a href="#menu" data-testid="nav-menu-link">
              Menu
            </a>
            <a href="#impact" data-testid="nav-impact-link">
              Our impact
            </a>
            <a href="#events" data-testid="nav-events-link">
              Events
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#menu"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition font-mono uppercase tracking-wider"
            >
              Explore the menu →
            </a>

            {onOpenKitchen && (
              <button
                onClick={onOpenKitchen}
                className="hidden md:flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900/80 border border-zinc-700/80 px-3 py-1.5 rounded-lg transition"
              >
                <ChefHat className="h-3.5 w-3.5 text-[#d4a373]" />
                <span>KDS Scale</span>
              </button>
            )}

            <button
              className="tray-button"
              onClick={() => setShowTray(true)}
              data-testid="open-tray-button"
            >
              <ShoppingBag size={16} />
              <span>Tray</span>
              <b>{tray.reduce((s, i) => s + i.qty, 0).toString().padStart(2, "0")}</b>
            </button>

            {/* Theme Toggle */}
            <div className="flex items-center">
              <ThemeToggle className="p-1.5 rounded-xl border-white/20 bg-black/40 text-amber-300 hover:bg-black/60 scale-90" />
            </div>

            {/* Logout Button (requested in image 3) */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer"
                title="Log out of SmartBrite"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </header>

        {/* 1. Opening Animation at scrollY 0, with Zoom & Parallax */}
        <div ref={heroTrackRef} className="hero-scroll-track relative min-h-[90vh] md:min-h-[96vh] w-full flex flex-col justify-between opening-hero-container">
          {/* Parallax Background */}
          <motion.div
            className="absolute inset-0 bg-cover bg-center pointer-events-none"
            style={{
              backgroundImage: `url(${images.hero})`,
              scale: bgScale,
              y: bgY,
            }}
          />
          <div className="opening-hero-overlay" />

          {/* Left Floating Card with Parallax */}
          <motion.div
            className="floating-photo-card card-left"
            style={{
              y: leftCardY,
              rotate: leftCardRotate,
              scale: leftCardScale,
            }}
          >
            <div className="relative group overflow-hidden rounded-xl shadow-2xl border border-white/20 bg-black/40">
              <img
                src={images.thaliMeal}
                alt="Traditional South Indian Deluxe Meal Thali"
                className="w-44 h-32 md:w-52 md:h-36 object-cover"
              />
              <div className="p-2.5 text-left bg-gradient-to-t from-black/90 to-black/40">
                <span className="text-xs font-bold text-amber-300 block">🍛 South Indian Thali</span>
                <span className="text-[11px] text-zinc-300 font-mono">Deluxe Feast · ₹190</span>
              </div>
            </div>
          </motion.div>

          {/* Right Floating Card with Parallax */}
          <motion.div
            className="floating-photo-card card-right"
            style={{
              y: rightCardY,
              rotate: rightCardRotate,
              scale: rightCardScale,
            }}
          >
            <div className="relative group overflow-hidden rounded-xl shadow-2xl border border-white/20 bg-black/40">
              <img
                src={images.burger}
                alt="Smoked BBQ Grilled Burger with crispy seasoned fries"
                className="w-44 h-32 md:w-52 md:h-36 object-cover"
              />
              <div className="p-2.5 text-left bg-gradient-to-t from-black/90 to-black/40">
                <span className="text-xs font-bold text-amber-300 block">🍔 Artisan Cafe & Bites</span>
                <span className="text-[11px] text-zinc-300 font-mono">Fresh Grilled · ₹190</span>
              </div>
            </div>
          </motion.div>

          {/* Center Composition */}
          <div className="opening-hero-center">
            <p className="opening-eyebrow">SMART CAMPUS DINING · ARTISAN CAFE, BOWLS & FRESH MEALS</p>
            <h1 className="opening-good">Good</h1>

            <div className="opening-brite-wrap">
              <motion.div
                className="opening-brite-letters"
                style={{
                  scale: lettersScale,
                  x: lettersX,
                  y: lettersY,
                  transformOrigin: "35% center",
                }}
              >
                <span className="letter-b">B</span>
                <span className="letter-r">R</span>
                <span className="letter-i">I</span>
                <span className="letter-t">T</span>
                <span className="letter-e">E</span>
              </motion.div>
              <motion.div
                className="opening-script-overlay"
                style={{
                  scale: scriptScale,
                }}
              >
                flavor moves with you.
              </motion.div>
            </div>

            <p className="opening-subtitle">
              Fresh campus kitchen meals, artisan pizza, burgers, crisp Belgian waffles, gelato & chocolates, authentic thalis, and barista coffee with AI smart nutrition and zero food waste tracking.
            </p>

            <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
              <button
                className="button-sand cursor-pointer font-bold shadow-lg"
                data-testid="hero-order-button"
                onClick={() => {
                  if (onStartOrder) onStartOrder();
                }}
              >
                Order Meals, Waffles & Treats (₹) →
              </button>

              {onOpenNutrition && (
                <button
                  onClick={onOpenNutrition}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-200 hover:text-white px-4 py-3 rounded border border-white/20 hover:border-white/40 transition backdrop-blur-sm bg-black/30"
                >
                  <Sparkles size={15} className="text-amber-400" />
                  <span>AI Nutrition Estimator</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row Cues */}
          <div className="opening-footer-cue">
            <span>SMARTBRITE / CAMPUS DINING & ZERO FOOD WASTE</span>
            <a
              href="#menu"
              className="scroll-cue flex items-center gap-1.5"
              data-testid="scroll-cue"
            >
              <ArrowDown size={14} />
              <span>SCROLL TO VIEW MENU ↓</span>
            </a>
          </div>
        </div>

        {/* Marquee */}
        <section className="marquee" aria-label="Café values">
          <span>🍗 HYDERABADI DUM BIRYANI</span>
          <CircleDot size={10} />
          <span>🍛 ROYAL THALI MEALS</span>
          <CircleDot size={10} />
          <span>CHICKEN BIRYANI</span>
          <CircleDot size={10} />
          <span>ZERO FOOD WASTE</span>
          <CircleDot size={10} />
          <span>IOT KITCHEN SCALES</span>
          <CircleDot size={10} />
          <span>HIGH PROTEIN BOWLS</span>
          <CircleDot size={10} />
          <span>ARTISAN ESPRESSO</span>
        </section>

        {/* 2. 02 / Make it yours - Interactive 3D Coffee Cup */}
        <section className="ritual dark-section section-pad" id="ritual">
          <div className="ritual-copy">
            <div className="eyebrow light">03 / Make it yours</div>
            <h2>
              The daily
              <br />
              <em>ritual, remixed.</em>
            </h2>
            <p>Rotate the cup. Choose your mood. We’ll handle the rest.</p>
            <div className="flavor-pills">
              <button
                className={activeFlavor === "house" ? "active" : ""}
                onClick={() => setActiveFlavor("house")}
                data-testid="flavor-house-button"
              >
                House roast
              </button>
              <button
                className={activeFlavor === "oat" ? "active" : ""}
                onClick={() => setActiveFlavor("oat")}
                data-testid="flavor-oat-button"
              >
                Oat milk
              </button>
              <button
                className={activeFlavor === "honey" ? "active" : ""}
                onClick={() => setActiveFlavor("honey")}
                data-testid="flavor-honey-button"
              >
                Honey lift
              </button>
            </div>
            <div className="ritual-meta">
              <span>
                <b>01</b> Smooth
              </span>
              <span>
                <b>02</b> Golden
              </span>
              <span>
                <b>03</b> Grounded
              </span>
            </div>
          </div>

          <div
            className="cup-stage"
            onMouseDown={(e) => onDragStart(e, "cup")}
            onTouchStart={(e) => onDragStart(e, "cup")}
            data-testid="interactive-coffee-cup"
          >
            <div className="cup-shadow" />
            <div
              className="cup"
              style={{
                transform: `rotateY(${cupRotation}deg) rotateX(5deg)`,
              }}
            >
              <div className="cup-lid" />
              <div className="coffee">
                <span>✦</span>
              </div>
              <div className="cup-body">
                <span>
                  SMART
                  <br />
                  <small>BRITE</small>
                </span>
              </div>
              <div className="cup-handle" />
            </div>
            <div className="stage-label">
              <Move3d size={15} /> drag to rotate / 360°
            </div>
          </div>
        </section>

        {/* 4. Interactive 3D Glyph Portal Chamber */}
        <section className="relative w-full overflow-hidden border-y border-zinc-800/80 bg-zinc-950">
          <GlyphPortal
            word="BRITE"
            scrollLength={1.0}
            enterLabel="Enter Smart Canteen"
            interactive={true}
            annotations={true}
          >
            <div className="space-y-4 max-w-xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1 text-xs font-mono text-emerald-300">
                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                <span>Zero Landfill Dining Initiative</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                Every Gram Accounted For.
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Smart IoT scales, real-time demand matching, and chef-curated
                organic meals priced in Indian Rupees (₹).
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={onStartOrder}
                  className="rounded-xl bg-[#d4a373] hover:bg-[#e2b384] px-6 py-3 text-xs font-bold text-[#1e3a2f] transition shadow-lg"
                >
                  Order Fresh Meal (₹)
                </button>
                {onOpenNutrition && (
                  <button
                    onClick={onOpenNutrition}
                    className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
                  >
                    AI Nutrition Guide
                  </button>
                )}
              </div>
            </div>
          </GlyphPortal>
        </section>

        {/* 4.5. Interactive 3D Works Wheel Showcase */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-white overflow-hidden border-t border-zinc-800">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-4 py-1 text-xs font-mono text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>3D DRUM PERSPECTIVE · SHADCN & CRAFTERUI</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Turn the <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Culinary Wheel</span>
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Scroll with mouse wheel or drag vertically to spin through our campus signature dishes in realistic 3D perspective geometry.
              </p>
            </div>

            <WorksWheelDemo onSelectDish={(_dish) => {
              if (onStartOrder) onStartOrder();
            }} />
          </div>
        </section>

        {/* 4.6. Cult Directory & Live SerpAPI Google Dining Engine */}
        <section className="relative w-full py-12 px-4 sm:px-6 lg:px-8 bg-[#090d16] text-white border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <SerpAPIFoodSearch />
          </div>
        </section>

        {/* 5. 04 / The menu */}
        <section className="menu-section section-pad" id="menu">
          <div className="section-heading menu-heading">
            <div>
              <div className="eyebrow">04 / The menu</div>
              <h2>
                Made for <em>right now.</em>
              </h2>
            </div>
            <div className="filter-row">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={activeFilter === filter ? "filter active" : "filter"}
                  onClick={() => setActiveFilter(filter)}
                  data-testid={`menu-filter-${filter.toLowerCase()}-button`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-grid">
            {visibleMenu.map((item) => (
              <article
                className="menu-card"
                key={item.name}
                data-testid={`menu-card-${item.slug}`}
              >
                <div className="menu-img">
                  <img src={item.image} alt={item.name} />
                  <span>{item.tag}</span>
                </div>
                <div className="menu-info">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.note}</p>
                  </div>
                  <div className="menu-buy">
                    <b>₹{item.price.toFixed(2)}</b>
                    <button
                      onClick={() => addToTray(item)}
                      aria-label={`Add ${item.name} to tray`}
                      data-testid={`add-${item.slug}-button`}
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Canteen Meals CTA Card */}
          <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                <span>HOT CHEF GRAIN BOWLS & ENTREES</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Looking for hot cafeteria meals & campus dining trays?
              </h4>
              <p className="text-xs text-slate-500 max-w-xl">
                Order Mediterranean Falafel bowls, Avocado Sourdough, and
                High-Protein plates directly from the campus ordering kiosk.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {onStartOrder && (
                <button
                  onClick={onStartOrder}
                  className="rounded-xl bg-[#1e3a2f] hover:bg-[#284c3e] text-white px-5 py-2.5 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Launch Kiosk Menu (₹)</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Timetable / Service Windows */}
        <section
          id="launch-schedule"
          className="mx-auto max-w-5xl px-4 py-24 text-slate-900"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-mono text-emerald-800">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span>CAMPUS SERVICE TIMETABLE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mb-10">
            Live Kitchen Prep & Meal Windows
          </h2>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Morning Power Fuel & Espresso</h4>
                <p className="text-xs font-mono text-emerald-700 uppercase">07:30 AM - 10:30 AM · South Atrium</p>
              </div>
              <button
                onClick={onStartOrder}
                className="text-xs font-semibold text-slate-800 hover:text-emerald-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition"
              >
                Order Breakfast (from ₹110) →
              </button>
            </div>

            <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Chef&apos;s Midday Grain Bowls & Entrees</h4>
                <p className="text-xs font-mono text-emerald-700 uppercase">11:30 AM - 02:45 PM · Central Prep Kitchen</p>
              </div>
              <button
                onClick={onStartOrder}
                className="text-xs font-semibold text-slate-800 hover:text-emerald-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition"
              >
                Order Lunch (from ₹160) →
              </button>
            </div>

            <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Zero-Waste Evening Recovery Dinner</h4>
                <p className="text-xs font-mono text-emerald-700 uppercase">06:00 PM - 09:30 PM · Main Dining Pavilion</p>
              </div>
              <button
                onClick={onStartOrder}
                className="text-xs font-semibold text-slate-800 hover:text-emerald-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition"
              >
                Order Dinner (from ₹180) →
              </button>
            </div>
          </div>
        </section>

        {/* 6. 05 / Small changes, daily */}
        <section className="impact section-pad" id="impact">
          <div className="impact-intro">
            <div className="eyebrow">05 / Small changes, daily</div>
            <h2>
              Good for your
              <br />
              <em>headspace.</em>
            </h2>
            <p>
              Smart systems make it easier to make a better choice — without
              asking you to think twice.
            </p>
            <a
              className="text-link"
              href="#contact"
              data-testid="impact-contact-link"
            >
              See how we do it <ArrowRight size={16} />
            </a>
          </div>

          <div className="stats-grid">
            <div className="stat-card featured">
              <Leaf size={21} />
              <b>84%</b>
              <span>
                of waste diverted
                <br />
                from landfill
              </span>
              <small>↑ 12.4% this term</small>
            </div>
            <div className="stat-card">
              <Zap size={20} />
              <b>1,248</b>
              <span>
                kWh solar
                <br />
                energy used
              </span>
            </div>
            <div className="stat-card">
              <Coffee size={20} />
              <b>100%</b>
              <span>
                traceable
                <br />
                coffee beans
              </span>
            </div>
            <div className="stat-card signal">
              <div className="signal-line" />
              <b>
                06<span> min</span>
              </b>
              <span>
                average pickup
                <br />
                wait time
              </span>
              <small>
                <span className="live-dot" /> Live campus data
              </small>
            </div>
          </div>
        </section>

        {/* 7. 06 / After hours */}
        <section className="events section-pad" id="events">
          <div className="section-heading">
            <div>
              <div className="eyebrow">06 / After hours</div>
              <h2>
                Make some
                <br />
                <em>space for more.</em>
              </h2>
            </div>
            <a className="text-link" href="#contact" data-testid="events-link">
              View all events <ArrowRight size={16} />
            </a>
          </div>

          <div className="event-row">
            <div className="event-date">
              <b>18</b>
              <span>OCT / FRI</span>
            </div>
            <div className="event-content">
              <span className="event-type">Workshop / 17:30</span>
              <h3>Latte art for beginners</h3>
              <p>Learn the pour, meet your people, drink your homework.</p>
            </div>
            <button
              className="round-arrow"
              data-testid="event-details-button"
              aria-label="View latte art event details"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="event-row">
            <div className="event-date">
              <b>24</b>
              <span>OCT / THU</span>
            </div>
            <div className="event-content">
              <span className="event-type">Community / 12:00</span>
              <h3>The mindful lunch club</h3>
              <p>Thirty quiet minutes. One communal table. No laptops.</p>
            </div>
            <button
              className="round-arrow"
              data-testid="event-details-second-button"
              aria-label="View mindful lunch event details"
            >
              <ChevronRight />
            </button>
          </div>
        </section>

        {/* 8. 07 / Come say hello */}
        <section className="contact dark-section section-pad" id="contact">
          <div>
            <div className="eyebrow light">07 / Come say hello</div>
            <h2>
              Meet you
              <br />
              <em>at the bar.</em>
            </h2>
          </div>
          <div className="contact-side">
            <p>
              Ground floor, North Quad
              <br />
              Open weekdays / 07:00—19:00
            </p>
            <a
              className="button button-light"
              href="#menu"
              data-testid="contact-order-button"
            >
              Start an order <ArrowRight size={17} />
            </a>
            <span className="mono">N 51° 30′ 26.4″ · W 0° 07′ 39.0″</span>
          </div>
        </section>

        {/* Footer */}
        <footer className="cafe-footer">
          <a className="motion-logo logo" href="#top">
            <span className="motion-logo-mark logo-mark">
              <Coffee size={15} />
            </span>
            <span>
              Smart<span>Brite</span>
            </span>
          </a>
          <span>© 2025 SmartBrite Campus Café</span>
          <span className="footer-note">
            Built for better breaks <Leaf size={14} />
          </span>
        </footer>
      </ReactLenis>

      {/* Sliding Tray Modal Drawer */}
      {showTray && (
        <div
          className="modal-backdrop"
          onClick={() => setShowTray(false)}
        >
          <aside
            className="tray-modal"
            onClick={(e) => e.stopPropagation()}
            data-testid="tray-modal"
          >
            <button
              className="close-button"
              onClick={() => setShowTray(false)}
              data-testid="close-tray-button"
              aria-label="Close tray"
            >
              <X size={18} />
            </button>

            <div className="eyebrow">
              Your tray / {tray.length.toString().padStart(2, "0")}
            </div>

            <h2>
              Ready when
              <br />
              <em>you are.</em>
            </h2>

            {tray.length === 0 ? (
              <p className="empty-tray" data-testid="empty-tray-message">
                Your tray is waiting for a good idea. Add something from the
                menu.
              </p>
            ) : (
              <div className="tray-items">
                {tray.map((item, index) => (
                  <div className="tray-item" key={`${item.name}-${index}`}>
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <b>₹{(item.price * item.qty).toFixed(2)}</b>
                  </div>
                ))}

                <div className="pt-4 flex justify-between font-bold text-slate-900 border-t border-slate-300 mt-3">
                  <span>Subtotal</span>
                  <span>₹{trayTotal.toFixed(2)}</span>
                </div>

                <button
                  className="button button-dark full-button"
                  onClick={() => {
                    setShowTray(false);
                    if (onStartOrder) onStartOrder();
                  }}
                  data-testid="demo-checkout-button"
                >
                  <Check size={16} />
                  <span>Demo checkout (₹{trayTotal.toFixed(2)})</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
