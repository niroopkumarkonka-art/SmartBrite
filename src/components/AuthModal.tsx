import React, { useState } from "react";
import { X, LogIn, Sparkles, User, ShieldCheck, Mail, ArrowRight, Lock } from "lucide-react";
import { User as UserType } from "../types";
import { GoogleAccountChooserModal } from "./GoogleAccountChooserModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  defaultRole?: "customer" | "staff" | "admin";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultRole = "customer",
}) => {
  const [role, setRole] = useState<"customer" | "staff" | "admin">(defaultRole);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);

  if (!isOpen) return null;

  // Google One-Click Sign In Handler
  const handleGoogleSignIn = () => {
    setIsGoogleChooserOpen(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const regularUser: UserType = {
        _id: `user_${Date.now()}`,
        name: name.trim() || (role === "customer" ? "Student Diner" : role === "staff" ? "Kitchen Chef" : "Dining Manager"),
        email: email.trim() || (role === "customer" ? "student@campus.edu" : "staff@campus.edu"),
        role: role,
        student_id: studentId || "STU-CAMPUS",
        created_at: new Date().toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(regularUser);
      onClose();
    }, 500);
  };

  // Quick One-Click Demo Profiles for Seamless Testing
  const handleQuickDemo = (roleType: "customer" | "staff" | "admin") => {
    const demoProfiles: Record<string, UserType> = {
      customer: {
        _id: "u_demo_student",
        name: "Niroop Kumar (Student)",
        email: "niroopkumarkonka@gmail.com",
        role: "customer",
        student_id: "CS-2026-4421",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString(),
      },
      staff: {
        _id: "u_demo_staff",
        name: "Chef Marcus Vance (Kitchen Lead)",
        email: "marcus.chef@campus.edu",
        role: "staff",
        avatar_url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString(),
      },
      admin: {
        _id: "u_demo_admin",
        name: "Dr. Elena Rostova (Dining Director)",
        email: "admin.dining@campus.edu",
        role: "admin",
        avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString(),
      },
    };
    onLoginSuccess(demoProfiles[roleType]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Sign in to SmartBrite Canteen
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Login is required to place meal orders, track pickup numbers, and view digital receipts.
          </p>
        </div>

        {/* Account Role Selector */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 py-2 rounded-lg font-bold transition ${
              role === "customer"
                ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setRole("staff")}
            className={`flex-1 py-2 rounded-lg font-bold transition ${
              role === "staff"
                ? "bg-white text-amber-800 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👨‍🍳 Kitchen Staff
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 rounded-lg font-bold transition ${
              role === "admin"
                ? "bg-white text-cyan-800 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 Manager / Admin
          </button>
        </div>

        {/* Google Sign-In Button */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white py-3 px-4 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] transition shadow-xs cursor-pointer"
          >
            {/* Real SVG Google Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Or campus email
            </span>
          </div>

          {/* Email / ID Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Campus Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {role === "customer" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Student ID Number (Optional)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. STU-2026-904"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white transition active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{isLoading ? "Signing in..." : `Sign In as ${role === "customer" ? "Student" : role === "staff" ? "Kitchen Staff" : "Manager"}`}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Quick Demo Switcher for fast testing */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center mb-2">⚡ Quick 1-Click Test Profiles:</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("customer")}
              className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("staff")}
              className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
            >
              Kitchen Chef
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="rounded-lg bg-cyan-50 border border-cyan-200 px-2.5 py-1 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100 transition cursor-pointer"
            >
              Manager
            </button>
          </div>
        </div>
      </div>

      {/* Google Account Chooser Modal */}
      <GoogleAccountChooserModal
        isOpen={isGoogleChooserOpen}
        onClose={() => setIsGoogleChooserOpen(false)}
        onSelectAccount={(user) => {
          onLoginSuccess(user);
          onClose();
        }}
      />
    </div>
  );
};
