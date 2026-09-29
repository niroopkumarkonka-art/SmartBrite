import React, { useState } from "react";
import { Copy, Check, QrCode, Smartphone, ExternalLink, ShieldCheck, Zap } from "lucide-react";

interface FamXPaymentQRProps {
  amount: number;
  upiId?: string;
  recipientName?: string;
  orderToken?: string;
  className?: string;
  compact?: boolean;
}

export const FamXPaymentQR: React.FC<FamXPaymentQRProps> = ({
  amount,
  upiId = "9390962020@fam",
  recipientName = "SmartBrite Campus Dining",
  orderToken,
  className = "",
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upiDeepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    recipientName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
    orderToken ? `Token ${orderToken}` : "Campus Meal"
  )}`;

  // High-resolution generated QR code with UPI payment string
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[#0f1115] text-white p-5 shadow-2xl overflow-hidden transition-all ${className}`}
    >
      {/* QR Code Header - Clean Title and Payable Amount */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold tracking-wide text-white">Scan UPI QR</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Payable</span>
          <span className="text-base font-black text-emerald-400 font-mono">₹{amount.toFixed(2)}</span>
        </div>
      </div>

      {/* FamX QR Code Showcase Container */}
      <div className="my-4 flex flex-col items-center justify-center">
        <div className="relative p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center group">
          {/* QR Code Graphic */}
          <img
            src={qrCodeUrl}
            alt="FamX UPI QR Code"
            className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl object-contain"
            onError={(e) => {
              // Fallback to SVG QR representation if network is restricted
              (e.target as HTMLElement).style.display = "none";
              const fallback = document.getElementById("famx-fallback-qr");
              if (fallback) fallback.style.display = "flex";
            }}
          />

          {/* Fallback Vector QR in case offline */}
          <div
            id="famx-fallback-qr"
            style={{ display: "none" }}
            className="w-48 h-48 flex-col items-center justify-center bg-slate-900 rounded-xl p-4 text-center"
          >
            <QrCode className="h-28 w-28 text-white mb-2" />
            <span className="text-xs font-mono text-emerald-400">{upiId}</span>
          </div>

          {/* FamX Center Bird Emblem */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-10 w-10 rounded-full bg-[#1e232d] border-2 border-white flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-amber-400">
                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
              </svg>
            </div>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Scan with Google Pay, PhonePe, Paytm, FamPay or any UPI App</span>
        </p>
      </div>

      {/* UPI ID Pill with Copy Action */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              FamX UPI ID
            </span>
            <span className="font-mono text-sm font-bold text-white tracking-wide truncate">
              {upiId}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-xs font-semibold text-white transition cursor-pointer shrink-0"
          title="Copy UPI ID"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* FamX Footer Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
        <a
          href={upiDeepLink}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition"
        >
          <span>Open UPI App (₹{amount})</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 px-2 py-1 rounded-lg bg-white/5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>FamX Verified</span>
        </div>
      </div>
    </div>
  );
};
