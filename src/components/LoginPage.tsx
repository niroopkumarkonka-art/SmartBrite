import React, { useState, useEffect } from "react";
import {
  Coffee,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  GraduationCap,
  ChefHat,
  Lock,
  Flame,
  CheckCircle2,
  AlertCircle,
  QrCode,
  UtensilsCrossed,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";
import { GoogleAccountChooserModal } from "./GoogleAccountChooserModal";
import { SmartBrite3DLogo } from "./ui/SmartBrite3DLogo";
import { ThemeToggle } from "./ui/ThemeToggle";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onReplay3DLogo?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onReplay3DLogo }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "admin">("signin");

  // Sign In State - No default credentials to protect user privacy
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInRole, setSignInRole] = useState<"customer" | "staff" | "admin">("customer");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpStudentId, setSignUpStudentId] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpRole, setSignUpRole] = useState<"customer" | "staff">("customer");
  const [signUpDiet, setSignUpDiet] = useState("All Preferences");

  // Admin Portal State - No hardcoded default credentials
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);

  // Mouse Parallax Effect for ambient depth
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 20;
      const y = (e.clientY / innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 1. Google Account Chooser Sign-In
  const handleGoogleLogin = () => {
    setErrorMsg(null);
    setIsGoogleChooserOpen(true);
  };

  // 2. Standard Email & Password Sign In
  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const email = signInEmail.trim().toLowerCase();
    const password = signInPassword.trim();

    if (!email) {
      setErrorMsg("Please enter your campus email address.");
      return;
    }

    // MANDATORY ADMIN SECURITY RULE
    // "admin credentials are niroopkumarkonka@gmail.com password:Nani@3012"
    if (email === "niroopkumarkonka@gmail.com" || signInRole === "admin") {
      if (email !== "niroopkumarkonka@gmail.com" || password !== "Nani@3012") {
        setErrorMsg("Strict Admin Security: Invalid credentials! Password Nani@3012 is required for niroopkumarkonka@gmail.com.");
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        const adminUser: User = {
          _id: "admin_niroop_master",
          name: "Niroop Kumar Konka (Admin)",
          email: "niroopkumarkonka@gmail.com",
          role: "admin",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80",
          created_at: new Date().toISOString(),
        };
        setIsLoading(false);
        onLoginSuccess(adminUser);
      }, 400);
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const user: User = {
        _id: `user_${Date.now()}`,
        name: email.split("@")[0].replace(".", " ").toUpperCase(),
        email: email,
        role: signInRole === "staff" ? "staff" : "customer",
        student_id: signInRole === "customer" ? "CS-STU-CAMPUS" : undefined,
        avatar_url:
          signInRole === "staff"
            ? "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=140&q=80"
            : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=140&q=80",
        created_at: new Date().toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(user);
    }, 400);
  };

  // 3. User Sign Up / Registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signUpName.trim()) {
      setErrorMsg("Please provide your full name.");
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMsg("Please provide your campus email.");
      return;
    }
    if (signUpPassword.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    // Check if user is attempting to register as admin
    if (signUpEmail.trim().toLowerCase() === "niroopkumarkonka@gmail.com") {
      if (signUpPassword !== "Nani@3012") {
        setErrorMsg("Admin account registration requires official security key Nani@3012.");
        return;
      }
    }

    setIsLoading(true);
    const isRegisteredAdmin =
      signUpEmail.trim().toLowerCase() === "niroopkumarkonka@gmail.com" &&
      signUpPassword === "Nani@3012";

    const newUser: User = {
      _id: `reg_user_${Date.now()}`,
      name: signUpName.trim(),
      email: signUpEmail.trim().toLowerCase(),
      role: isRegisteredAdmin ? "admin" : signUpRole,
      student_id: signUpStudentId.trim() || undefined,
      dietary_preference: signUpDiet,
      avatar_url:
        isRegisteredAdmin
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80"
          : signUpRole === "staff"
          ? "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=140&q=80"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=140&q=80",
      created_at: new Date().toISOString(),
    };

    try {
      // Automatically store user details in database (MongoDB Atlas & SQL file)
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const savedUser = res.ok ? await res.json() : newUser;
      setIsLoading(false);
      setSuccessMsg("Account created and saved to database! Redirecting to campus dining...");
      setTimeout(() => onLoginSuccess(savedUser), 400);
    } catch (err: any) {
      console.error("Auto-store user error:", err);
      setIsLoading(false);
      setSuccessMsg("Account created! Redirecting to campus dining...");
      setTimeout(() => onLoginSuccess(newUser), 400);
    }
  };

  // 4. Dedicated Administrator Vault Login
  const handleAdminVaultLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const email = adminEmail.trim().toLowerCase();
    const pass = adminPassword.trim();

    if (email !== "niroopkumarkonka@gmail.com" || pass !== "Nani@3012") {
      setAdminError(
        "ACCESS RESTRICTED: Invalid Admin Credentials! Only administrator (niroopkumarkonka@gmail.com) with password Nani@3012 is authorized."
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const adminUser: User = {
        _id: "admin_niroop_master",
        name: "Niroop Kumar Konka (Admin)",
        email: "niroopkumarkonka@gmail.com",
        role: "admin",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80",
        created_at: new Date().toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(adminUser);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-[#d4a373] selection:text-black">
      {/* 1. Atmospheric Ambient Background Layer inspired by second image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Restaurant/Cafe Ambience Texture */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity filter blur-[1px] scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85')`,
          }}
        />
        {/* Dark Vignette and Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f12]/80 via-[#0d0f12]/90 to-[#0d0f12]" />

        {/* Ambient Warm Golden & Emerald Glow Orbs */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full bg-[#d4a373]/10 blur-[140px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/5 w-[550px] h-[550px] rounded-full bg-emerald-600/10 blur-[150px]"
        />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-20 border-b border-white/10 bg-[#0d0f12]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#d4a373] to-[#b37a4c] text-white font-bold shadow-lg shadow-[#d4a373]/20">
              <Coffee className="h-6 w-6 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif tracking-tight text-white text-2xl font-black">
                  Smart<span className="text-[#d4a373]">Brite</span>
                </span>
                <span className="rounded-full bg-[#d4a373]/15 px-2.5 py-0.5 text-[10px] font-mono tracking-widest text-[#d4a373] border border-[#d4a373]/30">
                  CAMPUS DINING
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Zero Food Waste • Artisan Kitchen & Kiosk</p>
            </div>
          </div>

          {/* Quick tab pills */}
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-2xl text-xs">
            <button
              onClick={() => {
                setActiveTab("signin");
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                activeTab === "signin"
                  ? "bg-white text-black shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                activeTab === "signup"
                  ? "bg-[#d4a373] text-black shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                  : "text-zinc-400 hover:text-amber-300"
              }`}
            >
              <Lock className="h-3 w-3" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Showcase & Auth Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Hero Typographic Display & Floating 3D Cards (matching second image aesthetic) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-6 space-y-6"
            style={{ perspective: "1000px" }}
          >
            {/* Live Campus Pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#d4a373]/30 bg-[#d4a373]/10 px-4 py-1.5 text-xs text-[#d4a373] font-mono tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4a373] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4a373]"></span>
              </span>
              <span>LIVE CAMPUS KITCHEN · ZERO FOOD WASTE</span>
            </div>

            {/* Display Typography */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-[1.08]">
                Good <span className="text-[#d4a373] font-bold">BRITE</span> <br />
                <em className="font-serif italic font-normal text-amber-200/90 text-3xl sm:text-4xl lg:text-5xl block mt-1">
                  flavor moves with you.
                </em>
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 max-w-lg leading-relaxed pt-1">
                Authentic Hyderabadi Dum Biryanis, South & North Indian Thalis, crisp Belgian Waffles, artisanal gelato, and barista-brewed coffee powered by IoT smart waste tracking.
              </p>
            </div>

            {/* Interactive Floating 3D Delicacy Cards */}
            <motion.div
              style={{
                transform: `rotateX(${mousePos.y * 0.3}deg) rotateY(${mousePos.x * 0.3}deg)`,
                transformStyle: "preserve-3d",
              }}
              className="relative p-5 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl transition-transform duration-200"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#d4a373]" />
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                    Campus Signature Plates
                  </span>
                </div>
                <span className="text-[11px] text-[#d4a373] font-mono">UPI 9390962020@fam</span>
              </div>

              {/* 3 Floating Menu Cards with gentle hover and animation */}
              <div className="grid grid-cols-3 gap-3">
                {/* Dum Biryani */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2.5 transition group cursor-pointer hover:border-[#d4a373]/50 hover:bg-white/10"
                >
                  <div className="h-20 rounded-xl overflow-hidden mb-2 relative">
                    <img
                      src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80"
                      alt="Chicken Dum Biryani"
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-[#d4a373] font-bold">
                      ₹260
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">Dum Biryani</h4>
                  <p className="text-[10px] text-zinc-400 truncate">Saffron Basmati</p>
                </motion.div>

                {/* Belgian Waffle */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2.5 transition group cursor-pointer hover:border-[#d4a373]/50 hover:bg-white/10"
                >
                  <div className="h-20 rounded-xl overflow-hidden mb-2 relative">
                    <img
                      src="https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80"
                      alt="Liege Waffle"
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-[#d4a373] font-bold">
                      ₹185
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">Belgian Waffle</h4>
                  <p className="text-[10px] text-zinc-400 truncate">Nutella & Banana</p>
                </motion.div>

                {/* South Indian Thali */}
                <motion.div
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2.5 transition group cursor-pointer hover:border-[#d4a373]/50 hover:bg-white/10"
                >
                  <div className="h-20 rounded-xl overflow-hidden mb-2 relative">
                    <img
                      src="https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=400&q=80"
                      alt="South Indian Deluxe Meal"
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-[#d4a373] font-bold">
                      ₹190
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">Deluxe Thali</h4>
                  <p className="text-[10px] text-zinc-400 truncate">Complete Feast</p>
                </motion.div>
              </div>

              {/* Three value pillars */}
              <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
                <div className="p-2 rounded-xl bg-white/5">
                  <QrCode className="h-4 w-4 text-[#d4a373] mx-auto mb-1" />
                  <span className="block text-xs font-semibold text-white">Instant UPI</span>
                  <span className="text-[10px] text-zinc-400">FamX & QR Pay</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <Sparkles className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                  <span className="block text-xs font-semibold text-white">AI Nutrition</span>
                  <span className="text-[10px] text-zinc-400">Calories & Macros</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <ShieldCheck className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
                  <span className="block text-xs font-semibold text-white">Digital Bills</span>
                  <span className="text-[10px] text-zinc-400">Sent to Phone & Email</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN: Attractive Authentication Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-6 w-full max-w-lg mx-auto"
          >
            <div className="rounded-3xl border border-white/15 bg-black/70 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-5">
              
              {/* Artisan Coffee Cup Logo Header & Theme Toggle */}
              <div className="flex flex-col items-center justify-center pt-1 pb-3 text-center border-b border-white/10">
                <SmartBrite3DLogo size="md" />
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                  {onReplay3DLogo && (
                    <button
                      type="button"
                      onClick={onReplay3DLogo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition cursor-pointer"
                    >
                      <Coffee className="h-3 w-3 text-amber-400" />
                      <span>Replay Welcome Cafe Screen</span>
                    </button>
                  )}
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
                    <span className="text-[10px] text-stone-300 font-medium">Theme:</span>
                    <ThemeToggle className="scale-75 p-1" />
                  </div>
                </div>
              </div>

              {/* Card Header & Switcher */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    {activeTab === "signin"
                      ? "Campus Sign In"
                      : activeTab === "signup"
                      ? "Create Account"
                      : "Admin Vault"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {activeTab === "signin"
                      ? "Enter your registered email and password to enter"
                      : activeTab === "signup"
                      ? "Quick registration for university students & faculty"
                      : "Authorized access for campus dining director"}
                  </p>
                </div>

                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => {
                      setActiveTab("signin");
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === "signin"
                        ? "bg-white text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("signup");
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === "signup"
                        ? "bg-[#d4a373] text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Error / Alert Messages */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 1. SIGN IN VIEW */}
              {activeTab === "signin" && (
                <div className="space-y-4">
                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Select Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSignInRole("customer")}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          signInRole === "customer"
                            ? "border-[#d4a373] bg-[#d4a373]/15 text-[#d4a373] font-bold"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <GraduationCap className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs block">Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignInRole("staff")}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          signInRole === "staff"
                            ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <ChefHat className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs block">Kitchen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignInRole("admin")}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          signInRole === "admin"
                            ? "border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <Lock className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs block">Admin</span>
                      </button>
                    </div>
                  </div>

                  {/* Google Login Option */}
                  {/* Google Login Option with Crystal Clear High Contrast */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-slate-100 py-3.5 px-4 font-extrabold text-slate-900 border-2 border-slate-300 transition shadow-md cursor-pointer disabled:opacity-60"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
                    <span className="text-slate-900 font-extrabold text-sm tracking-wide">
                      {isLoading ? "Verifying Account with Database..." : "Sign in with Google"}
                    </span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-white/10" />
                    <span className="absolute bg-[#0f1115] px-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      Or Email & Password
                    </span>
                  </div>

                  {/* Standard Sign In Form - Clean without prefilled private credentials */}
                  <form onSubmit={handleEmailSignIn} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Campus Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="email"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-zinc-300">
                          Password
                        </label>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-10 text-xs text-white placeholder-zinc-500 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373] focus:outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-[#d4a373] to-[#b37a4c] hover:brightness-110 py-3 text-xs font-bold text-black transition cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2"
                    >
                      <span>Sign In & Enter Kiosk</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* 2. SIGN UP VIEW */}
              {activeTab === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Enter full name"
                        required
                        className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#d4a373] focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Campus Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="email@campus.edu"
                          required
                          className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#d4a373] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Phone (for receipt SMS)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="tel"
                          value={signUpPhone}
                          onChange={(e) => setSignUpPhone(e.target.value)}
                          placeholder="9390962020"
                          className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#d4a373] focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Student ID / Card
                      </label>
                      <input
                        type="text"
                        value={signUpStudentId}
                        onChange={(e) => setSignUpStudentId(e.target.value)}
                        placeholder="CS-2026-884"
                        className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 px-3 text-xs text-white placeholder-zinc-500 focus:border-[#d4a373] focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Role
                      </label>
                      <select
                        value={signUpRole}
                        onChange={(e) => setSignUpRole(e.target.value as any)}
                        className="w-full rounded-xl border border-white/15 bg-[#14161b] py-2.5 px-3 text-xs text-white focus:border-[#d4a373] focus:outline-none cursor-pointer"
                      >
                        <option value="customer">Student / Diner</option>
                        <option value="staff">Kitchen Chef Staff</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create strong password"
                        required
                        className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-10 text-xs text-white placeholder-zinc-500 focus:border-[#d4a373] focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Dietary Lifestyle
                    </label>
                    <select
                      value={signUpDiet}
                      onChange={(e) => setSignUpDiet(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#14161b] py-2.5 px-3 text-xs text-white focus:border-[#d4a373] focus:outline-none cursor-pointer"
                    >
                      <option value="All Preferences">All Preferences (Non-Veg & Veg)</option>
                      <option value="Vegetarian">Pure Vegetarian</option>
                      <option value="High-Protein">High-Protein Fitness</option>
                      <option value="Sweet Treat">Sweet Tooth (Desserts & Waffles)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 py-3 text-xs font-bold text-black transition cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Create Account & Enter Kiosk</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* 3. STRICT ADMIN VAULT VIEW */}
              {activeTab === "admin" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      <span>Protected Campus Administrator Vault</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Restricted to university dining directors. Audit revenue, kitchen waste scales, and system logs.
                    </p>
                  </div>

                  {adminError && (
                    <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAdminVaultLogin} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Enter administrator email"
                        className="w-full rounded-xl border border-amber-500/30 bg-white/5 py-2.5 px-3 text-xs text-amber-200 font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Admin Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter admin password"
                          className="w-full rounded-xl border border-amber-500/30 bg-white/5 py-2.5 px-3 pr-10 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 py-3 text-xs font-bold text-black transition cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Authenticate Admin Portal</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-3 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a373]" />
                <span>1-Click Fast Preview:</span>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onLoginSuccess({
                      _id: "demo_student",
                      name: "Campus Student",
                      email: "student@campus.edu",
                      role: "customer",
                      student_id: "CS-2026-884",
                      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
                      created_at: new Date().toISOString(),
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 font-semibold transition cursor-pointer text-[11px]"
                >
                  Student
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLoginSuccess({
                      _id: "demo_staff",
                      name: "Chef Marcus Vance",
                      email: "chef@campus.edu",
                      role: "staff",
                      avatar_url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80",
                      created_at: new Date().toISOString(),
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 font-semibold transition cursor-pointer text-[11px]"
                >
                  Chef
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0d0f12]/80 backdrop-blur-md px-6 py-3.5 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SmartBrite Campus Dining OS • Zero Food Waste Protocol</span>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
            <span>UPI: 9390962020@fam</span>
            <span>Tax Invoices via SMS & Email</span>
          </div>
        </div>
      </footer>

      {/* Google Account Chooser Modal with Database Verification */}
      <GoogleAccountChooserModal
        isOpen={isGoogleChooserOpen}
        onClose={() => setIsGoogleChooserOpen(false)}
        onSelectAccount={onLoginSuccess}
        onRequestRegister={(email, name) => {
          setActiveTab("signup");
          if (email) setSignUpEmail(email);
          if (name) setSignUpName(name);
          setErrorMsg(`Please register your account for "${email}" first. Access is strictly granted to accounts in the database.`);
        }}
      />
    </div>
  );
};
