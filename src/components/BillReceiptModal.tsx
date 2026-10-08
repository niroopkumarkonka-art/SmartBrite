import React, { useState } from "react";
import {
  X,
  Receipt,
  Printer,
  CheckCircle2,
  Calendar,
  Clock,
  CreditCard,
  QrCode,
  Sparkles,
  Download,
  Mail,
  Smartphone,
  Send,
  Check,
  Share2,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { Order } from "../types";
import { exportBillToPDF } from "../utils/exportUtils";

interface BillReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultPhone?: string;
}

interface BillReceiptContentProps {
  order: Order;
  onClose: () => void;
  defaultEmail?: string;
  defaultPhone?: string;
}

const BillReceiptContent: React.FC<BillReceiptContentProps> = ({
  order,
  onClose,
  defaultEmail = "niroopkumarkonka@gmail.com",
  defaultPhone = "9390962020",
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [recipientPhone, setRecipientPhone] = useState(defaultPhone);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [showFamXQr, setShowFamXQr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportBillToPDF(order);
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText("9390962020@fam");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const safeItems = Array.isArray(order.items) ? order.items : [];
  const safeSubtotal = Number(order.total_amount) || safeItems.reduce((acc, i) => acc + (Number(i.subtotal) || (Number(i.unit_price) || 0) * (Number(i.qty) || 1)), 0);
  const finalTotal = safeSubtotal;
  const statusStr = (order.status || "placed").toUpperCase();
  const tokenStr = order.token_number || (order._id ? order._id.slice(-4) : "SB-01");

  const safeDate = order.created_at ? new Date(order.created_at) : new Date();
  const formattedDate = !isNaN(safeDate.getTime()) ? safeDate.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }) : new Date().toLocaleDateString("en-IN");

  const formattedTime = !isNaN(safeDate.getTime()) ? safeDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }) : new Date().toLocaleTimeString("en-IN");

  // Items text representation safely guarded
  const itemsText = safeItems
    .map((i) => {
      const uPrice = Number(i.unit_price) || 0;
      const q = Number(i.qty) || 1;
      const sub = Number(i.subtotal) || (uPrice * q);
      return `• ${i.name || "Item"} (x${q}) - ₹${sub.toFixed(2)}`;
    })
    .join("\n");

  // Copy full receipt text to clipboard
  const handleCopyReceiptText = () => {
    const text =
      `🧾 SmartBrite Campus Dining - Official Bill\n\n` +
      `Pickup Token: #${tokenStr}\n` +
      `Customer: ${order.user_name || "Campus Diner"}\n` +
      `Date: ${formattedDate} at ${formattedTime}\n` +
      `Status: Paid via ${order.payment_method || "Campus Card"}\n\n` +
      `Items Ordered:\n${itemsText}\n\n` +
      `Grand Total: ₹${finalTotal.toFixed(2)}\n` +
      `Estimated Pickup: ~6-10 mins\n\n` +
      `SmartBrite Zero Waste Campus Canteen`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }
  };

  // WhatsApp prefilled message and direct URL (compatible with Mobile app & Web)
  let cleanPhone = recipientPhone.replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
  else if (cleanPhone.startsWith("0")) cleanPhone = "91" + cleanPhone.slice(1);
  else if (!cleanPhone.startsWith("91") && cleanPhone.length > 5) cleanPhone = "91" + cleanPhone;
  if (!cleanPhone) cleanPhone = "919390962020";

  const whatsappMsg =
    `🧾 *SmartBrite Campus Dining - Official Bill*\n\n` +
    `*Pickup Token:* #${tokenStr}\n` +
    `*Customer:* ${order?.user_name || "Campus Diner"}\n` +
    `*Date:* ${formattedDate} at ${formattedTime}\n` +
    `*Status:* Paid via ${order?.payment_method || "Campus Card"}\n\n` +
    `*Items Ordered:*\n${itemsText}\n\n` +
    `*Grand Total:* ₹${finalTotal.toFixed(2)}\n` +
    `*Estimated Pickup:* ~6-10 mins\n\n` +
    `_SmartBrite Zero Waste Campus Canteen_`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMsg)}`;

  // Email subject, body and mailto URL
  const emailSubject = `SmartBrite Campus Dining Bill - Pickup Token #${tokenStr}`;
  const emailBody =
    `SmartBrite Campus Dining - Official Tax Invoice & Bill Receipt\n\n` +
    `Pickup Token: #${tokenStr}\n` +
    `Customer Name: ${order?.user_name || "Campus Diner"}\n` +
    `Date: ${formattedDate} at ${formattedTime}\n` +
    `Estimated Pickup: ~6-10 mins\n\n` +
    `Order Items:\n${itemsText}\n\n` +
    `Total Amount: ₹${finalTotal.toFixed(2)}\n` +
    `Payment Method: ${order?.payment_method || "Campus Card"} (Verified)\n\n` +
    `Thank you for dining with SmartBrite! Zero Food Waste Certified.`;

  const emailUrl = `mailto:${recipientEmail.trim()}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleSendEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recipientEmail.trim() || !order) return;
    setEmailStatus("sending");
    exportBillToPDF(order);
    window.location.href = emailUrl;
    setTimeout(() => {
      setEmailStatus("sent");
      setTimeout(() => setEmailStatus("idle"), 4000);
    }, 600);
  };

  const handleSendSms = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recipientPhone.trim()) return;
    setSmsStatus("sending");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      setSmsStatus("sent");
      setTimeout(() => setSmsStatus("idle"), 4000);
    }, 600);
  };

  const upiId = "9390962020@fam";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden print:m-0 print:w-full print:border-none print:shadow-none my-6">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shadow-inner">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase">Official Campus Tax Invoice & Bill</h3>
              <p className="text-[11px] text-emerald-100 font-mono">SmartBrite Canteen POS • Zero Waste Certified</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer print:hidden"
            aria-label="Close receipt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Ticket Receipt Body */}
        <div className="p-6 space-y-5 bg-white text-slate-800">
          {/* Token Pickup Card */}
          <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/70 p-4 text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
              KITCHEN PICKUP TOKEN
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-900 tracking-tight font-mono my-1">
              {tokenStr}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-200/60 px-3 py-0.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Order Status: {statusStr}</span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Order ID</span>
              <p className="font-mono font-semibold text-slate-800 truncate">{order._id || tokenStr}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
              <p className="font-semibold text-slate-800">{order.user_name || "Campus Student"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Date & Time</span>
              <p className="font-medium text-slate-700">{formattedDate}, {formattedTime}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Payment Reference</span>
              <p className="font-semibold text-emerald-700 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                <span>FamX UPI ({upiId})</span>
              </p>
            </div>
          </div>

          {/* Itemized Order List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
              <span>Item Description</span>
              <div className="flex items-center gap-6">
                <span>Qty</span>
                <span>Price (₹)</span>
              </div>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 divide-y divide-slate-100/60">
              {safeItems.map((item, idx) => {
                const uPrice = Number(item.unit_price) || 0;
                const q = Number(item.qty) || 1;
                const sub = Number(item.subtotal) || (uPrice * q);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs pt-1.5">
                    <div className="max-w-[220px] truncate">
                      <span className="font-semibold text-slate-800 block truncate">{item.name || "Campus Meal"}</span>
                      <span className="text-[10px] text-slate-400 font-mono">₹{uPrice.toFixed(2)} each</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="font-mono text-slate-600 font-medium">x{q}</span>
                      <span className="font-mono font-bold text-slate-900 w-14 text-right">
                        ₹{sub.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Calculation */}
          <div className="rounded-xl bg-slate-50 p-3.5 space-y-1.5 border border-slate-200/80 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Total:</span>
              <span className="font-mono font-semibold text-slate-800">₹{safeSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Student Nutrition Subsidy:</span>
              </span>
              <span className="font-mono font-semibold">-₹0.00</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Campus Tax (GST):</span>
              <span className="font-mono font-semibold text-slate-800">₹0.00 (Student Exempt)</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-lg text-emerald-700 font-mono">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* FamX UPI Payment Verification Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-white font-bold">UPI Payment QR</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFamXQr(!showFamXQr)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>{showFamXQr ? "Hide QR" : "Show FamX QR"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="flex items-center gap-2 truncate">
                <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono text-emerald-300 font-bold truncate">{upiId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white transition cursor-pointer"
              >
                {copiedUpi ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy UPI</span>
                  </>
                )}
              </button>
            </div>

            {showFamXQr && (
              <div className="pt-2 flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="bg-white p-2.5 rounded-xl shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
                      `upi://pay?pa=${upiId}&pn=SmartBrite%20Campus%20Dining&am=${finalTotal}&cu=INR&tn=Token%20${order.token_number}`
                    )}`}
                    alt="FamX UPI QR"
                    className="w-40 h-40 rounded-lg"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">Scan to settle ₹{finalTotal} with FamX / UPI</span>
              </div>
            )}
          </div>

          {/* USER REQUIREMENT: Send Bill to Email or Mobile No */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>Send Bill to Email or Mobile Number</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Instant Dispatch
              </span>
            </div>

            {/* Email Dispatch Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">Email Invoice (PDF & Breakdown)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <a
                  href={emailUrl}
                  onClick={(e) => {
                    handleSendEmail(e);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0 no-underline"
                >
                  {emailStatus === "sending" ? (
                    <span>Sending...</span>
                  ) : emailStatus === "sent" ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Sent!</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Email Bill</span>
                    </>
                  )}
                </a>
              </div>
              {emailStatus === "sent" && (
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Invoice & GST receipt dispatched to {recipientEmail}</span>
                </p>
              )}
            </div>

            {/* Mobile / WhatsApp Dispatch Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">Mobile No (SMS / WhatsApp Token)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Smartphone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g. 9390962020"
                    className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setSmsStatus("sent");
                    setTimeout(() => setSmsStatus("idle"), 4000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0 no-underline"
                >
                  {smsStatus === "sent" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Opened!</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                      <span>WhatsApp Bill</span>
                    </>
                  )}
                </a>
              </div>
              {smsStatus === "sent" && (
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Pickup Token #{order.token_number} opened for +91 {recipientPhone} via WhatsApp!</span>
                </p>
              )}
            </div>

            {/* Copy full receipt text fallback button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopyReceiptText}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-[11px] font-bold text-emerald-800 transition shadow-2xs cursor-pointer"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied Bill Receipt to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copy Full Bill Receipt (For WhatsApp / SMS / Telegram)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Barcode / Verification Stamp */}
          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <QrCode className="h-5 w-5 text-slate-700" />
              <span>Verified Campus Kiosk POS • FamX UPI Settle</span>
            </div>
            <span className="font-mono">Est. Ready: 6-10 mins</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2.5 print:hidden">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition shadow-xs cursor-pointer"
            title="Download PDF Invoice file"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white transition active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer text-center"
          >
            Got it, Track Order
          </button>
        </div>
      </div>
    </div>
  );
};

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  defaultEmail,
  defaultPhone,
}) => {
  if (!isOpen || !order) return null;

  return (
    <BillReceiptContent
      order={order}
      onClose={onClose}
      defaultEmail={defaultEmail}
      defaultPhone={defaultPhone}
    />
  );
};
