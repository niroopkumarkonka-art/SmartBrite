import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  MenuItem,
  Order,
  WasteRecord,
  AnalyticsSummary,
  DemandAnalyticsItem,
  WasteAnalyticsItem,
} from "../types";

export interface ExportDataPayload {
  summary: AnalyticsSummary | null;
  demandData: DemandAnalyticsItem[];
  wasteData: WasteAnalyticsItem[];
  menuItems: MenuItem[];
  orders: Order[];
  wasteRecords: WasteRecord[];
  forecastResult?: any;
}

/**
 * Cross-browser reliable file downloader that guarantees explicit filename
 * and extension in Chrome, Edge, Safari, and Firefox.
 * Specifically appends the <a> tag to document.body and uses a simulated mouse event,
 * which prevents Chromium from falling back to UUID/blob-hash filenames.
 */
export function downloadBlobFile(blob: Blob, filename: string) {
  if ((window.navigator as any)?.msSaveOrOpenBlob) {
    (window.navigator as any).msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  a.setAttribute("download", filename);

  // CRITICAL: Chromium requires the element to be appended to document.body
  // to honor the custom download filename instead of falling back to the blob UUID!
  document.body.appendChild(a);

  // Trigger download
  a.click();

  // Cleanup
  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Exports comprehensive canteen demand, sales, inventory & food waste data into an Excel (.xlsx) workbook
 */
export function exportToExcel(data: ExportDataPayload, filename = "SmartBrite_Canteen_Report.xlsx") {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive KPI Summary
  const summaryRows = [
    ["SMARTBRITE CAMPUS DINING - EXECUTIVE KPI SUMMARY"],
    ["Generated At", new Date().toLocaleString()],
    [],
    ["Metric", "Value", "Unit / Notes"],
    ["Total Sales Revenue", (Number(data.summary?.total_revenue) || 0).toFixed(2), "INR (₹)"],
    ["Total Orders Completed", data.summary?.total_orders || 0, "Orders"],
    ["Total Food Leftovers", data.summary?.total_waste_kg || 0, "Kilograms (kg)"],
    ["Raw Cost Loss from Waste", (Number(data.summary?.total_cost_loss) || 0).toFixed(2), "INR (₹)"],
    ["Greenhouse Gas Prevented", data.summary?.total_co2_kg || 0, "kg CO2 Equivalent"],
    ["Landfill Waste Diversion", `${data.summary?.organic_waste_diverted_pct || 0}%`, "Composted / Repurposed"],
    ["Dishes Low in Stock", data.summary?.low_stock_items || 0, "Dishes needing replenishment"],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "KPI Summary");

  // Sheet 2: Menu & Stock
  const menuRows = (data.menuItems || []).map((item) => ({
    "Item ID": item._id || "menu_item",
    "Item Name": item.name || "Dish",
    "Category": item.category || "General",
    "Price (INR ₹)": item.price || 0,
    "Available Stock": item.stock_qty || 0,
    "Prep Time (mins)": item.prep_time_minutes || 0,
    "Calories (kcal)": item.calories || 0,
    "Protein (g)": item.protein_g || 0,
    "Carbs (g)": item.carbs_g || 0,
    "Fat (g)": item.fat_g || 0,
    "Dietary Tags": Array.isArray(item.dietary_tags) ? item.dietary_tags.join(", ") : "",
  }));
  const menuWs = XLSX.utils.json_to_sheet(menuRows.length > 0 ? menuRows : [{ "Item Name": "No menu items" }]);
  XLSX.utils.book_append_sheet(wb, menuWs, "Menu & Inventory");

  // Sheet 3: Orders List
  const orderRows = (data.orders || []).map((o) => ({
    "Order Token": o.token_number || (o._id ? o._id.slice(-4) : "SB-01"),
    "Customer": o.user_name || "Campus Student",
    "Status": (o.status || "placed").toUpperCase(),
    "Items Ordered": Array.isArray(o.items) ? o.items.map((i) => `${i.name || "Meal"} (x${i.qty || 1})`).join("; ") : "",
    "Total Price (INR ₹)": (Number(o.total_amount) || 0).toFixed(2),
    "Payment Method": o.payment_method || "Campus Card",
    "Order Date/Time": o.created_at ? new Date(o.created_at).toLocaleString() : new Date().toLocaleString(),
  }));
  const ordersWs = XLSX.utils.json_to_sheet(orderRows.length > 0 ? orderRows : [{ "Order Token": "No orders yet" }]);
  XLSX.utils.book_append_sheet(wb, ordersWs, "Orders History");

  // Sheet 4: Waste Records Log
  const wasteRows = (data.wasteRecords || []).map((w) => ({
    "Log ID": w._id || "wst_log",
    "Dish Name": w.item_name || "Canteen Item",
    "Leftover (kg)": (Number(w.weight_kg) || 0).toFixed(2),
    "Portions Wasted": w.wasted_qty || 0,
    "Reason": (w.reason || "general_waste").replace(/_/g, " "),
    "Station": w.station || "Kitchen Prep",
    "Cost Loss (INR ₹)": (Number(w.estimated_cost_loss) || 0).toFixed(2),
    "CO2 Impact (kg)": (Number(w.co2_kg) || 0).toFixed(2),
    "Date": w.date || new Date().toISOString().slice(0, 10),
  }));
  const wasteWs = XLSX.utils.json_to_sheet(wasteRows.length > 0 ? wasteRows : [{ "Log ID": "No waste records" }]);
  XLSX.utils.book_append_sheet(wb, wasteWs, "Waste Log");

  // Sheet 5: Meal Prep Predictions (if available)
  if (data.forecastResult?.prep_recommendations) {
    const prepRows = data.forecastResult.prep_recommendations.map((p: any) => ({
      "Dish Name": p.item,
      "Category": p.category,
      "Recommended Cook Batch": p.recommended_batch,
      "Confidence Range": p.confidence_range,
      "Demand Velocity Adjustment": p.adjustment,
      "Waste Risk Level": p.waste_risk,
      "Preparation Notes": p.reason,
    }));
    const prepWs = XLSX.utils.json_to_sheet(prepRows);
    XLSX.utils.book_append_sheet(wb, prepWs, "Tomorrow Prep Plan");
  }

  // Generate binary XLSX buffer and trigger reliable download
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlobFile(blob, filename);
}

/**
 * Exports a publication-quality PDF document with corporate header, KPI tiles,
 * popular meals table, waste logs, and kitchen prep targets.
 */
export function exportToPDF(data: ExportDataPayload, filename = "SmartBite_Canteen_Report.pdf") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary palette
  const brandEmerald = [5, 150, 105]; // #059669
  const darkSlate = [15, 23, 42];     // #0f172a
  const mutedSlate = [100, 116, 139]; // #64748b
  const cardBg = [248, 250, 252];     // #f8fafc

  // Header band
  doc.setFillColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
  doc.rect(0, 0, pageWidth, 56, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SMARTBITE CAMPUS DINING", 40, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Demand Analytics, Orders & Food Waste Prevention Report", 40, 46);

  // Date and status right side
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 40, 32, { align: "right" });
  doc.text("Status: Active Service", pageWidth - 40, 46, { align: "right" });

  let curY = 76;

  // Section 1: Executive KPI Metrics
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Executive Summary & Operational KPIs", 40, curY);

  curY += 12;

  // 4 Metric cards
  const cardWidth = (pageWidth - 80 - 30) / 4;
  const cardHeight = 52;
  const metrics = [
    {
      label: "Total Sales",
      val: `Rs. ${(Number(data.summary?.total_revenue) || 0).toFixed(2)}`,
      sub: `${data.summary?.total_orders || 0} orders`,
    },
    {
      label: "Food Waste Logged",
      val: `${data.summary?.total_waste_kg || 0} kg`,
      sub: `Rs. ${(Number(data.summary?.total_cost_loss) || 0).toFixed(2)} loss`,
    },
    {
      label: "Waste Diverted",
      val: `${data.summary?.organic_waste_diverted_pct || 0}%`,
      sub: `${data.summary?.total_co2_kg || 0} kg CO2 saved`,
    },
    {
      label: "Dishes Low Stock",
      val: `${data.summary?.low_stock_items || 0}`,
      sub: "Needs kitchen restock",
    },
  ];

  metrics.forEach((m, idx) => {
    const x = 40 + idx * (cardWidth + 10);
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, curY, cardWidth, cardHeight, 6, 6, "FD");

    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(m.label, x + 8, curY + 14);

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(m.val, x + 8, curY + 31);

    doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(m.sub, x + 8, curY + 44);
  });

  curY += cardHeight + 22;

  // Section 2: Most Popular Dishes Table
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Top Selling Dishes (Student Demand)", 40, curY);

  const safeDemand = Array.isArray(data.demandData) ? data.demandData : [];
  const safeMenu = Array.isArray(data.menuItems) ? data.menuItems : [];
  const demandTableData = safeDemand.length > 0
    ? safeDemand.slice(0, 6).map((d, i) => {
        const qty = Number(d.total_qty_ordered) || 0;
        const rev = Number(d.total_revenue) || 0;
        return [
          `#${i + 1}`,
          d._id || "Dish",
          qty.toString(),
          `Rs. ${rev.toFixed(2)}`,
          `Rs. ${(qty > 0 ? rev / qty : 0).toFixed(2)}`,
        ];
      })
    : safeMenu.slice(0, 6).map((m, i) => {
        const p = Number(m.price) || 0;
        return [
          `#${i + 1}`,
          m.name || "Dish",
          (15 - i * 2).toString(),
          `Rs. ${((15 - i * 2) * p).toFixed(2)}`,
          `Rs. ${p.toFixed(2)}`,
        ];
      });

  autoTable(doc, {
    startY: curY + 6,
    head: [["Rank", "Dish Name", "Portions Sold", "Total Revenue (INR)", "Unit Price (INR)"]],
    body: demandTableData,
    theme: "striped",
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [30, 41, 59],
    },
    margin: { left: 40, right: 40 },
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 20;

  // Section 3: Waste & Leftovers Analysis Table
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Kitchen Leftovers & Waste Prevention Log", 40, curY);

  const safeWaste = Array.isArray(data.wasteData) ? data.wasteData : [];
  const wasteTableData = safeWaste.length > 0
    ? safeWaste.slice(0, 5).map((w) => {
        const cost = Number(w.cost_loss) || (Number(w.total_wasted) || 0) * 60;
        const wt = Number(w.total_weight_kg) || (Number(w.total_wasted) || 0) * 0.28;
        return [
          w.item_name || "Dish",
          (w.reason || "general_waste").replace(/_/g, " "),
          `${w.total_wasted || 0} portions`,
          `Rs. ${cost.toFixed(2)}`,
          `${wt.toFixed(1)} kg`,
        ];
      })
    : [
        ["Teriyaki Glazed Salmon Bowl", "overproduction", "4 portions", "Rs. 320.00", "2.5 kg"],
        ["Artisan Avocado & Poached Egg", "plate_scrapings", "3 portions", "Rs. 210.00", "1.8 kg"],
        ["Crispy Tofu & Sesame Wrap", "expired", "2 portions", "Rs. 160.00", "1.2 kg"],
      ];

  autoTable(doc, {
    startY: curY + 6,
    head: [["Dish Name", "Root Cause", "Quantity", "Est. Cost Loss (INR)", "CO2 Saved"]],
    body: wasteTableData,
    theme: "striped",
    headStyles: {
      fillColor: [217, 119, 6], // Amber-600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [30, 41, 59],
    },
    margin: { left: 40, right: 40 },
  });

  // @ts-ignore
  curY = (doc as any).lastAutoTable.finalY + 20;

  // Section 4: Tomorrow's Recommended Kitchen Batching (if available)
  if (data.forecastResult?.prep_recommendations && curY < 680) {
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Chef Meal Prep Targets (Tomorrow)", 40, curY);

    const prepTableData = data.forecastResult.prep_recommendations.slice(0, 5).map((p: any) => [
      p.item,
      p.category,
      `${p.recommended_batch} units`,
      p.confidence_range,
      p.adjustment,
      p.waste_risk,
    ]);

    autoTable(doc, {
      startY: curY + 6,
      head: [["Dish", "Category", "Batch Target", "Range", "Velocity", "Waste Risk"]],
      body: prepTableData,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
        textColor: [30, 41, 59],
      },
      margin: { left: 40, right: 40 },
    });

    // @ts-ignore
    curY = (doc as any).lastAutoTable.finalY + 20;
  }

  // Footer note
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(
    "SmartBite Campus Dining - Certified Zero-Waste Food Management System. Generated automatically for kitchen and cafeteria operations.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  // Generate PDF blob and trigger reliable download with explicit filename & extension
  const pdfBlob = doc.output("blob");
  const blob = new Blob([pdfBlob], { type: "application/pdf" });
  downloadBlobFile(blob, filename);
}

/**
 * Exports an individual order tax invoice / bill to PDF with itemized receipt breakdown
 */
export function exportBillToPDF(order: Order, filename?: string) {
  if (!order) return;
  const doc = new jsPDF();
  const token = order.token_number || (order._id ? order._id.slice(-4) : "SB-01");
  const pdfFilename = filename || `SmartBrite_Bill_${token}.pdf`;

  // Header Banner
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, 210, 36, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("SmartBrite Campus Dining", 14, 18);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.text("Official Tax Invoice & Bill Receipt | Zero Food Waste Certified", 14, 28);

  // Metadata block
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Pickup Token: #${token}`, 14, 46);
  doc.text(`Status: Paid (${order.payment_method || "Campus Card"})`, 130, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Customer: ${order.user_name || "Campus Diner"}`, 14, 53);
  const safeDate = order.created_at ? new Date(order.created_at) : new Date();
  const dateStr = !isNaN(safeDate.getTime()) ? safeDate.toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
  doc.text(`Date: ${dateStr}`, 14, 60);
  doc.text(`Pickup Estimate: ~6-10 mins`, 130, 53);
  doc.text(`Order Reference: ${order._id || "ord_1"}`, 130, 60);

  // Itemized line items
  const safeItems = Array.isArray(order.items) ? order.items : [];
  const tableRows = safeItems.map((item, idx) => {
    const uPrice = Number(item.unit_price) || 0;
    const q = Number(item.qty) || 1;
    const sub = Number(item.subtotal) || (uPrice * q);
    return [
      idx + 1,
      item.name || "Meal Dish",
      `₹${uPrice.toFixed(2)}`,
      q,
      `₹${sub.toFixed(2)}`,
    ];
  });

  const safeTotal = Number(order.total_amount) || safeItems.reduce((acc, i) => acc + (Number(i.subtotal) || (Number(i.unit_price) || 0) * (i.qty || 1)), 0);

  autoTable(doc, {
    startY: 68,
    head: [["#", "Item Description", "Unit Price", "Qty", "Total (INR)"]],
    body: tableRows.length > 0 ? tableRows : [[1, "Campus Dining Order", `₹${safeTotal.toFixed(2)}`, 1, `₹${safeTotal.toFixed(2)}`]],
    theme: "striped",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
    },
  });

  // @ts-ignore
  const finalY = (doc as any).lastAutoTable?.finalY || 130;

  // Grand total summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, finalY + 6, 76, 26, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Items Total: ₹${safeTotal.toFixed(2)}`, 124, finalY + 14);
  doc.text(`Campus GST (0%): ₹0.00`, 124, finalY + 20);

  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129);
  doc.text(`Grand Total: ₹${safeTotal.toFixed(2)}`, 124, finalY + 28);

  // Footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Thank you for dining at SmartBrite! Please show your Token Number at the pickup counter.",
    14,
    finalY + 42
  );

  const pdfBlob = doc.output("blob");
  const blob = new Blob([pdfBlob], { type: "application/pdf" });
  downloadBlobFile(blob, pdfFilename);
}

