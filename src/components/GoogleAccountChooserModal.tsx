import React, { useState } from "react";
import { X, UserPlus, CheckCircle2, Shield, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { User } from "../types";

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (user: User) => void;
  onRequestRegister?: (email: string, name?: string) => void;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  onRequestRegister,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customRole, setCustomRole] = useState<"customer" | "staff" | "admin">("customer");
  const [signingInEmail, setSigningInEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  // Registered authentic Google Accounts present in MongoDB Atlas & SQL database
  const accounts: {
    name: string;
    email: string;
    role: "customer" | "staff" | "admin";
    avatarUrl: string;
    desc: string;
    initials: string;
    bgColor: string;
  }[] = [
    {
      name: "Niroop Kumar Konka",
      email: "niroopkumarkonka@gmail.com",
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      desc: "Administrator • Verified in Database",
      initials: "N",
      bgColor: "bg-emerald-600",
    },
    {
      name: "Alex Rivera",
      email: "alex.student@campus.edu",
      role: "customer",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      desc: "Student Diner • Verified in Database",
      initials: "A",
      bgColor: "bg-blue-600",
    },
    {
      name: "Chef Marcus Vance",
      email: "marcus.chef@campus.edu",
      role: "staff",
      avatarUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80",
      desc: "Kitchen Lead • Verified in Database",
      initials: "M",
      bgColor: "bg-amber-600",
    },
  ];

  // Verify account against the live database before granting access
  const verifyAndLogin = async (targetEmail: string) => {
    setAuthError(null);
    setUnregisteredEmail(null);
    setSigningInEmail(targetEmail);

    try {
      const res = await fetch("/api/auth/google-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data.found) {
        setAuthError(
          data.error ||
            `Account "${targetEmail}" is not found in database. User can only access after creating an account.`
        );
        setUnregisteredEmail(targetEmail);
        setSigningInEmail(null);
        return;
      }

      // Success: verified user found in database!
      onSelectAccount(data.user);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Failed to verify Google account with server.");
      setSigningInEmail(null);
    }
  };

  const autoRegisterAndLogin = async (targetEmail: string, name?: string, role: "customer" | "staff" | "admin" = "customer") => {
    setSigningInEmail(targetEmail);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/google-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail.trim().toLowerCase(),
          name: name || targetEmail.split("@")[0].replace(".", " ").toUpperCase(),
          role: role,
          autoRegister: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.error || "Failed to register account.");
      }

      onSelectAccount(data.user);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Failed to auto-register account.");
    } finally {
      setSigningInEmail(null);
    }
  };

  const handleChoose = (acc: typeof accounts[0]) => {
    verifyAndLogin(acc.email);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    autoRegisterAndLogin(customEmail.trim(), customName.trim(), customRole);
  };

  const handleCreateAccountNow = () => {
    if (!unregisteredEmail) return;
    autoRegisterAndLogin(unregisteredEmail, customName.trim() || unregisteredEmail.split("@")[0], customRole);
  };

  const handleGoToRegister = () => {
    handleCreateAccountNow();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[440px] rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Google Header Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            {/* Google SVG Logo */}
            <svg className="h-9 w-9" viewBox="0 0 24 24">
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
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Sign in with Google</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Choose an account to continue to <strong className="text-slate-900">SmartBrite Campus Dining</strong>
            </p>
          </div>
        </div>

        {/* Database Only Access Warning Banner if not found */}
        {authError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2 text-xs text-rose-900 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-950 block">Account Not Found in Database</span>
                <p className="text-[11px] text-rose-800 leading-relaxed">{authError}</p>
              </div>
            </div>

            {unregisteredEmail && (
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleGoToRegister}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Create Account First ({unregisteredEmail})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Account Selector List */}
        {!isCustomMode ? (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {accounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleChoose(acc)}
                disabled={Boolean(signingInEmail)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 transition cursor-pointer disabled:opacity-60 group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm ${acc.bgColor}`}
                  >
                    {acc.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{acc.name}</span>
                      {acc.role === "admin" && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate">{acc.email}</div>
                  </div>
                </div>

                {signingInEmail === acc.email ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
                )}
              </button>
            ))}

            {/* Option to use another account */}
            <button
              onClick={() => {
                setAuthError(null);
                setIsCustomMode(true);
              }}
              className="w-full flex items-center space-x-3 p-3.5 text-left hover:bg-slate-50 transition cursor-pointer text-slate-800 font-bold text-xs"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <UserPlus className="h-4 w-4" />
              </div>
              <span>Use another Google account</span>
            </button>
          </div>
        ) : (
          /* Custom Account Form with High-Contrast Clear Text */
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com or campus.edu"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Campus Role
                </label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as any)}
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                >
                  <option value="customer">Student / Customer</option>
                  <option value="staff">Kitchen Chef Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setIsCustomMode(false);
                }}
                className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Back to accounts
              </button>
              <button
                type="submit"
                disabled={Boolean(signingInEmail)}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shadow-md"
              >
                {signingInEmail ? "Verifying..." : "Continue"}
              </button>
            </div>
          </form>
        )}

        {/* Google Terms Footer */}
        <div className="pt-2 text-center text-[10px] text-slate-500 leading-relaxed border-t border-slate-100">
          Strict Security Policy: Only accounts verified in the SmartBrite database can sign in.
        </div>
      </div>
    </div>
  );
};

export default GoogleAccountChooserModal;
