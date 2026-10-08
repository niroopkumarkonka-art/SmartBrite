"use client";

import React from "react";
import { WorksWheel, type WorksWheelItem } from "./works-wheel";

// High-resolution culinary art showcasing the SmartBrite menu & dining atmosphere
const DINING_WORKS: WorksWheelItem[] = [
  {
    title: "Hyderabadi Dum Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Wood-Fired Truffle Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Artisan Iced Latte Frappe",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Avocado Croissant Benedict",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Crispy Peri-Peri Loaded Fries",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Golden Belgian Waffles",
    image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Tokyo Teriyaki Bento Bowl",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Matcha Fusion Boba Splash",
    image: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
  {
    title: "Paneer Tikka Charcoal Wrap",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
    href: "#menu",
  },
];

export function WorksWheelDemo({ onSelectDish }: { onSelectDish?: (dishName: string) => void }) {
  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2 pointer-events-none">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
          Live Interactive 3D Showcase • Scroll or Drag Wheel
        </span>
      </div>
      <WorksWheel 
        items={DINING_WORKS} 
        label="Chef's Specials '26" 
        action="Order Now"
      />
    </div>
  );
}

export default WorksWheelDemo;
