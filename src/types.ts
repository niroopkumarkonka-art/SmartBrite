export interface User {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "staff" | "admin";
  avatar_url?: string;
  student_id?: string;
  dietary_preference?: string;
  allergies?: string[];
  created_at: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  category: "Biryani & Meals" | "Cafe & Fast Food" | "Desserts & Waffles" | "Ice Creams & Chocolates" | "Breakfast" | "Grain Bowls" | "Main Entrees" | "Wraps & Paninis" | "Beverages" | "Salads";
  price: number;
  stock_qty: number;
  prep_time_minutes: number;
  ingredients: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  dietary_tags: string[];
  image_url: string;
  active: boolean;
  created_at: string;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  qty: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  token_number: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  items: OrderItem[];
  total_amount: number;
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  payment_method: "Campus Card" | "Apple Pay" | "Credit Card" | "Cash on Pickup";
  created_at: string;
  pickup_time_est?: string;
}

export interface WasteRecord {
  _id: string;
  menu_item_id: string;
  item_name?: string;
  wasted_qty: number;
  weight_kg: number;
  reason: "overproduction" | "expired" | "plate_scrapings" | "prep_trimmings";
  station: string;
  estimated_cost_loss: number;
  co2_kg: number;
  date: string;
}

export interface InventoryItem {
  _id: string;
  ingredient_name: string;
  category: string;
  current_stock_kg: number;
  threshold_kg: number;
  unit: string;
  last_restocked: string;
}

export interface Feedback {
  _id: string;
  order_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_orders: number;
  total_menu_items: number;
  low_stock_items: number;
  total_waste_units: number;
  total_waste_kg: number;
  total_cost_loss: number;
  total_co2_kg: number;
  pending_orders: number;
  total_revenue: number;
  average_wait_time_minutes: number;
  organic_waste_diverted_pct: number;
}

export interface DemandAnalyticsItem {
  _id: string;
  total_qty_ordered: number;
  total_revenue: number;
  order_count: number;
}

export interface WasteAnalyticsItem {
  menu_item_id: string;
  reason: string;
  total_wasted: number;
  total_weight_kg: number;
  cost_loss: number;
  item_name: string;
}

export interface RevenueAnalyticsItem {
  _id: string;
  revenue: number;
  orders: number;
}

export interface CartItem {
  item: MenuItem;
  qty: number;
}
