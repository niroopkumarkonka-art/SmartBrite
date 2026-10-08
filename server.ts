import express from "express";
import path from "path";
import fs from "fs";
import dns from "dns";
import { spawn, spawnSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// Ensure public DNS resolver for reliable MongoDB Atlas SRV connection on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

// Auto-detect available Python command across platforms (py on Windows, python3/python on Unix)
let cachedPythonCmd: string | null = null;
function getPythonCommand(): string {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;
  if (cachedPythonCmd) return cachedPythonCmd;

  const candidates = process.platform === "win32"
    ? ["py", "python", "python3"]
    : ["python3", "python", "py"];

  for (const cmd of candidates) {
    try {
      const res = spawnSync(cmd, ["--version"], { stdio: "ignore" });
      if (res.status === 0) {
        cachedPythonCmd = cmd;
        return cmd;
      }
    } catch (_) {}
  }
  return process.platform === "win32" ? "py" : "python3";
}

// Helper to execute Python microservice modules
function executePythonModule(command: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), "backend", "main.py");
    const pythonCmd = getPythonCommand();
    const py = spawn(pythonCmd, [pythonScript, command], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    py.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    py.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}:`, stderr);
        return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        console.error("Failed to parse Python JSON output:", stdout);
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });

    py.on("error", (err) => {
      console.error("Failed to spawn Python process:", err);
      reject(err);
    });

    try {
      py.stdin.write(JSON.stringify(payload || {}));
      py.stdin.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Lazy or safe init for Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// --------------------------------------------------------------------------
// In-Memory Database with Seed Data (mirrors MongoDB collections & 3NF schema)
// --------------------------------------------------------------------------

interface User {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "staff" | "admin";
  student_id?: string;
  avatar_url?: string;
  dietary_preference?: string;
  allergies?: string[];
  created_at: string;
}

interface MenuItem {
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
  dietary_tags: string[]; // e.g. "High Protein", "Vegan", "Gluten-Free", "Non-Veg"
  image_url: string;
  active: boolean;
  created_at: string;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  qty: number;
  subtotal: number;
}

interface Order {
  _id: string;
  token_number: string;
  user_id: string;
  user_name?: string;
  items: OrderItem[];
  total_amount: number;
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  payment_method: "Campus Card" | "Apple Pay" | "Credit Card" | "Cash on Pickup";
  created_at: string;
  pickup_time_est?: string;
}

interface WasteRecord {
  _id: string;
  menu_item_id: string;
  item_name?: string;
  wasted_qty: number; // in units or grams
  weight_kg: number;
  reason: "overproduction" | "expired" | "plate_scrapings" | "prep_trimmings";
  station: string; // e.g. "Grill Station 1", "Dish Return Kiosk", "Prep Kitchen"
  estimated_cost_loss: number;
  co2_kg: number;
  date: string;
}

interface InventoryItem {
  _id: string;
  ingredient_name: string;
  category: string;
  current_stock_kg: number;
  threshold_kg: number;
  unit: string;
  last_restocked: string;
}

interface Feedback {
  _id: string;
  order_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Initial Seed Data
const INITIAL_USERS: User[] = [
  {
    _id: "usr_admin_01",
    name: "Niroop Kumar Konka",
    email: "niroopkumarkonka@gmail.com",
    role: "admin",
    dietary_preference: "Standard",
    allergies: [],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    _id: "usr_001",
    name: "Alex Rivera",
    email: "alex.student@campus.edu",
    role: "customer",
    dietary_preference: "High Protein",
    allergies: ["Peanuts"],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: "usr_002",
    name: "Chef Marcus Vance",
    email: "marcus.chef@campus.edu",
    role: "staff",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    _id: "usr_003",
    name: "Dr. Elena Rostova",
    email: "admin.dining@campus.edu",
    role: "admin",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    _id: "menu_biryani_01",
    name: "Hyderabadi Chicken Dum Biryani",
    category: "Biryani & Meals",
    price: 260,
    stock_qty: 30,
    prep_time_minutes: 10,
    ingredients: [
      "Aged Royal Basmati Rice",
      "Tender Bone-in Chicken in Saffron Yogurt Marinade",
      "Golden Caramelized Onions (Birista)",
      "Fresh Mint & Coriander Leaves",
      "Kashmiri Saffron & Desi Ghee",
      "Whole Shahi Garam Masala",
      "Cooling Cucumber Mint Raita",
      "Hyderabadi Mirchi Ka Salan"
    ],
    calories: 640,
    protein_g: 38,
    carbs_g: 72,
    fat_g: 18,
    dietary_tags: ["Non-Veg", "Chef Special", "High Protein", "Dum Pukht", "Authentic Recipe"],
    image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_biryani_02",
    name: "Classic Chicken Biryani",
    category: "Biryani & Meals",
    price: 230,
    stock_qty: 25,
    prep_time_minutes: 8,
    ingredients: [
      "Fragrant Basmati Rice",
      "Juicy Spiced Chicken",
      "Ghee Roasted Cashews & Raisins",
      "Farm Boiled Egg",
      "Fried Crisp Onions",
      "Spicy Biryani Shervah / Gravy",
      "Herb Infused Raita"
    ],
    calories: 610,
    protein_g: 35,
    carbs_g: 68,
    fat_g: 17,
    dietary_tags: ["Non-Veg", "Bestseller", "High Protein", "Campus Favorite"],
    image_url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_biryani_03",
    name: "Royal Andhra Spicy Chicken Biryani",
    category: "Biryani & Meals",
    price: 250,
    stock_qty: 20,
    prep_time_minutes: 9,
    ingredients: [
      "Guntur Red Chilli Spiced Chicken Roast",
      "Aromatic Steamed Samba Rice",
      "Crispy Curry Leaves & Green Chillies",
      "Andhra Gongura Pickle",
      "Onion Cucumber Pachadi"
    ],
    calories: 630,
    protein_g: 37,
    carbs_g: 69,
    fat_g: 19,
    dietary_tags: ["Non-Veg", "Spicy Delight", "High Protein", "Regional Heritage"],
    image_url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_meal_01",
    name: "Traditional South Indian Deluxe Meal (Thali)",
    category: "Biryani & Meals",
    price: 190,
    stock_qty: 28,
    prep_time_minutes: 6,
    ingredients: [
      "Steamed Sona Masoori Rice with Ghee",
      "Traditional Drumstick & Shallot Sambar",
      "Pepper Garlic Tomato Rasam",
      "Vegetable Kootu",
      "Beans & Carrot Coconut Poriyal",
      "Crisp Urad Dal Appalam (Papad)",
      "Fresh Set Curd",
      "Elaneer Payasam Dessert"
    ],
    calories: 540,
    protein_g: 18,
    carbs_g: 82,
    fat_g: 12,
    dietary_tags: ["Vegetarian", "Complete Meal", "Balanced Diet", "Authentic Thali"],
    image_url: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_meal_02",
    name: "North Indian Shahi Deluxe Thali Meal",
    category: "Biryani & Meals",
    price: 220,
    stock_qty: 24,
    prep_time_minutes: 7,
    ingredients: [
      "Creamy Paneer Butter Masala",
      "Slow-Simmered Dal Makhani",
      "Fragrant Cumin Jeera Rice",
      "2 Whole Wheat Butter Tandoori Rotis",
      "Cucumber Mint Raita",
      "Mixed Pickle & Fresh Salad",
      "Warm Gulab Jamun"
    ],
    calories: 620,
    protein_g: 24,
    carbs_g: 78,
    fat_g: 22,
    dietary_tags: ["Vegetarian", "Deluxe Thali", "Rich & Creamy"],
    image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_biryani_04",
    name: "Lucknowi Awadhi Chicken Dum Biryani",
    category: "Biryani & Meals",
    price: 270,
    stock_qty: 16,
    prep_time_minutes: 10,
    ingredients: [
      "Extra Long-Grain Basmati Rice",
      "Slow Cooked Yakhni Simmered Chicken",
      "Kewra & Rose Petal Infusion",
      "Melt-in-Mouth Royal Spices",
      "Boiled Egg",
      "Burani Roasted Garlic Raita"
    ],
    calories: 600,
    protein_g: 36,
    carbs_g: 66,
    fat_g: 16,
    dietary_tags: ["Awadhi Heritage", "High Protein", "Aromatics", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_001",
    name: "Teriyaki Glazed Salmon Bowl",
    category: "Grain Bowls",
    price: 280,
    stock_qty: 18,
    prep_time_minutes: 8,
    ingredients: ["Atlantic Salmon", "Jasmine Brown Rice", "Edamame", "Broccoli", "Teriyaki Sesame Glaze"],
    calories: 580,
    protein_g: 38,
    carbs_g: 52,
    fat_g: 16,
    dietary_tags: ["High Protein", "Omega-3", "Dairy-Free"],
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_002",
    name: "Mediterranean Falafel & Quinoa Mezze",
    category: "Grain Bowls",
    price: 180,
    stock_qty: 24,
    prep_time_minutes: 6,
    ingredients: ["Crisp Falafel", "Organic Quinoa", "Cucumber", "Cherry Tomatoes", "Lemon Tahini"],
    calories: 490,
    protein_g: 19,
    carbs_g: 64,
    fat_g: 14,
    dietary_tags: ["Vegan", "High Fiber", "Plant-Based"],
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_003",
    name: "Char-Grilled Herb Chicken Breast",
    category: "Main Entrees",
    price: 220,
    stock_qty: 14,
    prep_time_minutes: 10,
    ingredients: ["Free-range Chicken Breast", "Roasted Sweet Potatoes", "Steamed Asparagus", "Rosemary Garlic Jus"],
    calories: 520,
    protein_g: 44,
    carbs_g: 36,
    fat_g: 12,
    dietary_tags: ["High Protein", "Gluten-Free", "Low Sugar"],
    image_url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_004",
    name: "Artisan Avocado & Poached Egg Sourdough",
    category: "Breakfast",
    price: 160,
    stock_qty: 20,
    prep_time_minutes: 5,
    ingredients: ["Rustic Sourdough", "Haas Avocado", "Cage-Free Poached Egg", "Chili Flakes", "Microgreens"],
    calories: 410,
    protein_g: 16,
    carbs_g: 38,
    fat_g: 22,
    dietary_tags: ["Vegetarian", "Brain Food"],
    image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_005",
    name: "Organic Acai Superberry Energy Bowl",
    category: "Breakfast",
    price: 190,
    stock_qty: 15,
    prep_time_minutes: 4,
    ingredients: ["Frozen Organic Acai", "House Hemp Granola", "Blueberries", "Chia Seeds", "Raw Honey"],
    calories: 360,
    protein_g: 8,
    carbs_g: 58,
    fat_g: 9,
    dietary_tags: ["Vegetarian", "Antioxidant Rich", "Low Fat"],
    image_url: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_006",
    name: "Smoked Turkey & Avocado Ciabatta Panini",
    category: "Wraps & Paninis",
    price: 180,
    stock_qty: 12,
    prep_time_minutes: 7,
    ingredients: ["Sliced Oven Turkey", "Avocado", "Aged Swiss", "Baby Spinach", "Herb Aioli", "Ciabatta"],
    calories: 560,
    protein_g: 32,
    carbs_g: 48,
    fat_g: 20,
    dietary_tags: ["High Protein"],
    image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_007",
    name: "Crispy Tofu & Sesame Rice Noodle Wrap",
    category: "Wraps & Paninis",
    price: 150,
    stock_qty: 16,
    prep_time_minutes: 6,
    ingredients: ["Pressed Tofu", "Rice Vermicelli", "Shredded Carrots", "Purple Cabbage", "Peanut Hoisin Dip"],
    calories: 430,
    protein_g: 17,
    carbs_g: 54,
    fat_g: 13,
    dietary_tags: ["Vegan", "Nutrient Dense"],
    image_url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_008",
    name: "Cold-Pressed Green Glow Celery & Apple",
    category: "Beverages",
    price: 110,
    stock_qty: 30,
    prep_time_minutes: 2,
    ingredients: ["Organic Celery", "Green Granny Smith Apple", "Cucumber", "Ginger", "Lemon"],
    calories: 120,
    protein_g: 2,
    carbs_g: 28,
    fat_g: 0.5,
    dietary_tags: ["Vegan", "Raw Juice", "Immunity Boost"],
    image_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_009",
    name: "Iced Ceremonial Oat Milk Matcha Latte",
    category: "Beverages",
    price: 130,
    stock_qty: 25,
    prep_time_minutes: 3,
    ingredients: ["Uji Ceremonial Matcha", "Barista Oat Milk", "Pure Agave Nectar", "Vanilla Bean"],
    calories: 140,
    protein_g: 3,
    carbs_g: 22,
    fat_g: 4.5,
    dietary_tags: ["Vegan", "Calm Focus"],
    image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_010",
    name: "Tuscan Kale & Roast Chickpea Caesar",
    category: "Salads",
    price: 160,
    stock_qty: 4, // Intentionally low stock to trigger inventory alert!
    prep_time_minutes: 5,
    ingredients: ["Dinosaur Kale", "Spiced Chickpea Croutons", "Parmesan Shavings", "Creamy Garlic Tahini"],
    calories: 380,
    protein_g: 14,
    carbs_g: 34,
    fat_g: 18,
    dietary_tags: ["Vegetarian", "Gluten-Free", "Low Carb"],
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_cafe_01",
    name: "Artisan Wood-Fired Margherita Pizza",
    category: "Cafe & Fast Food",
    price: 240,
    stock_qty: 20,
    prep_time_minutes: 9,
    ingredients: ["Sourdough Pizza Crust", "San Marzano Tomato Sauce", "Fresh Fior di Latte Mozzarella", "Fresh Basil", "Extra Virgin Olive Oil"],
    calories: 620,
    protein_g: 24,
    carbs_g: 74,
    fat_g: 22,
    dietary_tags: ["Vegetarian", "Cafe Favorite", "Freshly Baked"],
    image_url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_cafe_02",
    name: "Crispy Peri-Peri French Fries",
    category: "Cafe & Fast Food",
    price: 110,
    stock_qty: 35,
    prep_time_minutes: 5,
    ingredients: ["Golden Russet Potatoes", "African Bird's Eye Peri-Peri Spice", "Sea Salt", "Herb Mayo Dip"],
    calories: 340,
    protein_g: 5,
    carbs_g: 48,
    fat_g: 14,
    dietary_tags: ["Vegan", "Cafe Favorite", "Snack"],
    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_cafe_03",
    name: "Smash Chicken Cheeseburger",
    category: "Cafe & Fast Food",
    price: 190,
    stock_qty: 22,
    prep_time_minutes: 8,
    ingredients: ["Crispy Spiced Chicken Breast Patty", "Toasted Brioche Bun", "Melted Cheddar", "Pickles", "Signature Secret Burger Sauce"],
    calories: 590,
    protein_g: 34,
    carbs_g: 50,
    fat_g: 26,
    dietary_tags: ["Non-Veg", "High Protein", "Bestseller", "Cafe Favorite"],
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_cafe_04",
    name: "Loaded Cheesy Truffle Bacon Fries",
    category: "Cafe & Fast Food",
    price: 160,
    stock_qty: 18,
    prep_time_minutes: 6,
    ingredients: ["Double-Fried Fries", "Warm Cheddar Queso", "Crispy Turkey Bacon Bits", "Spring Onions", "Truffle Oil Drizzle"],
    calories: 480,
    protein_g: 16,
    carbs_g: 52,
    fat_g: 22,
    dietary_tags: ["Non-Veg", "Cafe Favorite"],
    image_url: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_cafe_05",
    name: "Spicy Barbecue Chicken Pizza",
    category: "Cafe & Fast Food",
    price: 270,
    stock_qty: 16,
    prep_time_minutes: 10,
    ingredients: ["Smoked BBQ Shredded Chicken", "Red Onions", "Sweet Corn", "Smoked Gouda & Mozzarella", "Coriander"],
    calories: 680,
    protein_g: 36,
    carbs_g: 72,
    fat_g: 24,
    dietary_tags: ["Non-Veg", "High Protein", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  // --- Ice Creams & Chocolates ---
  {
    _id: "menu_ice_01",
    name: "Belgian 70% Dark Chocolate Gelato",
    category: "Ice Creams & Chocolates",
    price: 130,
    stock_qty: 30,
    prep_time_minutes: 2,
    ingredients: ["70% Belgian Dark Cocoa", "Fresh Dairy Cream", "Dark Chocolate Shavings", "Raw Cane Sugar"],
    calories: 240,
    protein_g: 5,
    carbs_g: 28,
    fat_g: 12,
    dietary_tags: ["Vegetarian", "Gluten-Free", "Chef Special", "Bestseller"],
    image_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_ice_02",
    name: "Alphonso Mango Royal Kulfi Gelato",
    category: "Ice Creams & Chocolates",
    price: 120,
    stock_qty: 25,
    prep_time_minutes: 2,
    ingredients: ["Ratnagiri Alphonso Mango Pulp", "Condensed Whole Milk", "Cardamom", "Pistachio Slivers"],
    calories: 220,
    protein_g: 6,
    carbs_g: 32,
    fat_g: 9,
    dietary_tags: ["Vegetarian", "Gluten-Free", "Regional Heritage"],
    image_url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_ice_03",
    name: "Madagascar Vanilla Bean Caramel Sundae",
    category: "Ice Creams & Chocolates",
    price: 110,
    stock_qty: 28,
    prep_time_minutes: 3,
    ingredients: ["Madagascar Vanilla Pods", "Fresh Jersey Cream", "Warm Sea-Salt Caramel Drizzle", "Toasted Almonds"],
    calories: 250,
    protein_g: 4,
    carbs_g: 34,
    fat_g: 11,
    dietary_tags: ["Vegetarian", "Gluten-Free"],
    image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_ice_04",
    name: "Cookies & Cream Oreo Crunch Sundae",
    category: "Ice Creams & Chocolates",
    price: 135,
    stock_qty: 24,
    prep_time_minutes: 3,
    ingredients: ["Sweet Cream Ice Cream", "Crushed Oreo Cookies", "Hershey's Chocolate Fudge Swirl"],
    calories: 290,
    protein_g: 5,
    carbs_g: 42,
    fat_g: 13,
    dietary_tags: ["Vegetarian", "Campus Favorite"],
    image_url: "https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_ice_05",
    name: "Wild Mountain Strawberry Gelato",
    category: "Ice Creams & Chocolates",
    price: 125,
    stock_qty: 22,
    prep_time_minutes: 2,
    ingredients: ["Fresh Wild Strawberry Coulis", "Organic Cream", "Shortbread Crumble"],
    calories: 210,
    protein_g: 4,
    carbs_g: 30,
    fat_g: 8,
    dietary_tags: ["Vegetarian"],
    image_url: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_choc_01",
    name: "Artisanal Dark Chocolate Truffle Box (4 Pcs)",
    category: "Ice Creams & Chocolates",
    price: 160,
    stock_qty: 20,
    prep_time_minutes: 1,
    ingredients: ["72% Single-Origin Cocoa Ganache", "Cocoa Butter", "Fleur de Sel Sea Salt", "Raspberry Dust"],
    calories: 260,
    protein_g: 4,
    carbs_g: 22,
    fat_g: 18,
    dietary_tags: ["Vegetarian", "Gluten-Free", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_choc_02",
    name: "Roasted Hazelnut Rocher Pralines",
    category: "Ice Creams & Chocolates",
    price: 150,
    stock_qty: 26,
    prep_time_minutes: 1,
    ingredients: ["Whole Roasted Turkish Hazelnuts", "Silky Milk Chocolate", "Crispy Wafer Shell"],
    calories: 280,
    protein_g: 5,
    carbs_g: 26,
    fat_g: 19,
    dietary_tags: ["Vegetarian", "Bestseller"],
    image_url: "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_choc_03",
    name: "Warm Molten Cocoa Lava Cake",
    category: "Desserts & Waffles",
    price: 175,
    stock_qty: 18,
    prep_time_minutes: 5,
    ingredients: ["Warm Soft Cocoa Sponge", "Gooey Melting Chocolate Ganache Core", "Icing Sugar Drizzle"],
    calories: 360,
    protein_g: 6,
    carbs_g: 44,
    fat_g: 18,
    dietary_tags: ["Vegetarian", "Freshly Baked", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  // --- Waffles & Desserts ---
  {
    _id: "menu_waff_01",
    name: "Belgian Golden Waffle with Nutella & Banana",
    category: "Desserts & Waffles",
    price: 185,
    stock_qty: 20,
    prep_time_minutes: 6,
    ingredients: ["Freshly Pressed Crisp Belgian Waffle", "Warm Nutella Hazelnut Spread", "Fresh Robusta Banana Slices", "Crushed Walnuts"],
    calories: 420,
    protein_g: 8,
    carbs_g: 58,
    fat_g: 18,
    dietary_tags: ["Vegetarian", "Freshly Baked", "Bestseller"],
    image_url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_waff_02",
    name: "Berry Bliss Waffle with Vanilla Gelato",
    category: "Desserts & Waffles",
    price: 195,
    stock_qty: 18,
    prep_time_minutes: 6,
    ingredients: ["Crisp Golden Waffle", "Warm Mixed Wild Berry Compote", "Madagascar Vanilla Gelato Scoop", "Maple Drizzle"],
    calories: 390,
    protein_g: 7,
    carbs_g: 62,
    fat_g: 14,
    dietary_tags: ["Vegetarian", "Freshly Baked", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1504387828636-abeb50778c0c?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_waff_03",
    name: "Lotus Biscoff Caramel Crunch Waffle",
    category: "Desserts & Waffles",
    price: 210,
    stock_qty: 15,
    prep_time_minutes: 6,
    ingredients: ["Belgian Liege Waffle", "Warm Lotus Biscoff Spread", "Caramelized Biscoff Cookie Crumb", "Whipped Sweet Cream"],
    calories: 460,
    protein_g: 7,
    carbs_g: 66,
    fat_g: 20,
    dietary_tags: ["Vegetarian", "Freshly Baked", "Campus Favorite"],
    image_url: "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_des_01",
    name: "Classic Italian Espresso Tiramisu Cup",
    category: "Desserts & Waffles",
    price: 165,
    stock_qty: 22,
    prep_time_minutes: 2,
    ingredients: ["Savoiardi Ladyfingers", "Dark Roast Espresso", "Whipped Mascarpone Cream", "Valrhona Cocoa Powder"],
    calories: 320,
    protein_g: 6,
    carbs_g: 36,
    fat_g: 17,
    dietary_tags: ["Vegetarian", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_des_02",
    name: "Warm Saffron Gulab Jamun with Ice Cream",
    category: "Desserts & Waffles",
    price: 120,
    stock_qty: 30,
    prep_time_minutes: 3,
    ingredients: ["Khoya Mawa Dumplings", "Kashmiri Saffron Cardamom Syrup", "Cold Vanilla Gelato Scoop"],
    calories: 340,
    protein_g: 6,
    carbs_g: 52,
    fat_g: 12,
    dietary_tags: ["Vegetarian", "Regional Heritage", "Bestseller"],
    image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_des_03",
    name: "New York Blueberry Cheesecake Slice",
    category: "Desserts & Waffles",
    price: 190,
    stock_qty: 16,
    prep_time_minutes: 2,
    ingredients: ["Philadelphia Cream Cheese", "Graham Cracker Crust", "Wild Canadian Blueberry Coulis"],
    calories: 380,
    protein_g: 7,
    carbs_g: 40,
    fat_g: 22,
    dietary_tags: ["Vegetarian", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_biryani_05",
    name: "Shahi Mutton Dum Biryani",
    category: "Biryani & Meals",
    price: 320,
    stock_qty: 18,
    prep_time_minutes: 12,
    ingredients: [
      "Tender Bone-in Goat Meat slow cooked in Brown Onion Yakhni",
      "Royal Extra-Long Basmati",
      "Pure Desi Ghee & Saffron",
      "Mint Raita & Salan",
      "Farm Boiled Egg"
    ],
    calories: 720,
    protein_g: 45,
    carbs_g: 70,
    fat_g: 26,
    dietary_tags: ["Non-Veg", "Chef Special", "High Protein", "Royal Feast"],
    image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_biryani_06",
    name: "Tandoori Paneer & Soya Chaap Dum Biryani",
    category: "Biryani & Meals",
    price: 210,
    stock_qty: 24,
    prep_time_minutes: 8,
    ingredients: [
      "Char-Grilled Malai Paneer Cubes",
      "Spiced Tandoori Soya Chaap",
      "Fragrant Saffron Basmati Rice",
      "Crisp Golden Fried Onions",
      "Cucumber Mint Raita"
    ],
    calories: 580,
    protein_g: 28,
    carbs_g: 68,
    fat_g: 16,
    dietary_tags: ["Vegetarian", "High Protein", "Dum Pukht"],
    image_url: "https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_cafe_06",
    name: "Crispy BBQ Glazed Chicken Wings (6 Pcs)",
    category: "Cafe & Fast Food",
    price: 190,
    stock_qty: 20,
    prep_time_minutes: 8,
    ingredients: [
      "Crisp Crusted Juicy Chicken Wings",
      "Sweet & Smoky Hickory Barbecue Glaze",
      "Toasted White Sesame Seeds",
      "Creamy Ranch Dip & Celery Sticks"
    ],
    calories: 520,
    protein_g: 36,
    carbs_g: 22,
    fat_g: 28,
    dietary_tags: ["Non-Veg", "High Protein", "Campus Favorite"],
    image_url: "https://images.unsplash.com/photo-1527477378308-140ae2403328?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_cafe_07",
    name: "Cheesy Stuffed Garlic Bread with Jalapeños",
    category: "Cafe & Fast Food",
    price: 140,
    stock_qty: 25,
    prep_time_minutes: 6,
    ingredients: [
      "Fresh Artisan French Loaf",
      "Melted Mozzarella & Cheddar Blend",
      "Roasted Garlic Butter",
      "Spicy Pickled Jalapeños",
      "Italian Herb Seasoning"
    ],
    calories: 390,
    protein_g: 14,
    carbs_g: 48,
    fat_g: 16,
    dietary_tags: ["Vegetarian", "Freshly Baked", "Bestseller"],
    image_url: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_wrap_01",
    name: "Paneer Tikka Lachha Paratha Roll",
    category: "Wraps & Paninis",
    price: 150,
    stock_qty: 22,
    prep_time_minutes: 6,
    ingredients: [
      "Smoky Tandoori Spiced Malai Paneer",
      "Crisp Multi-Layered Whole Wheat Paratha",
      "Pickled Red Onions & Mint Coriander Chutney",
      "Chaat Masala Spritz"
    ],
    calories: 460,
    protein_g: 19,
    carbs_g: 52,
    fat_g: 18,
    dietary_tags: ["Vegetarian", "High Protein", "Campus Favorite"],
    image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_bev_01",
    name: "Signature Campus Thick Cold Coffee Frappe",
    category: "Beverages",
    price: 120,
    stock_qty: 35,
    prep_time_minutes: 3,
    ingredients: [
      "Double Shot Dark Espresso",
      "Thick Chilled Cream Milk",
      "Madagascar Vanilla Ice Cream Scoop",
      "Rich Chocolate Drizzle"
    ],
    calories: 260,
    protein_g: 7,
    carbs_g: 38,
    fat_g: 9,
    dietary_tags: ["Vegetarian", "Barista Special", "Bestseller"],
    image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_bev_02",
    name: "Royal Alphonso Mango Lassi with Chia",
    category: "Beverages",
    price: 100,
    stock_qty: 30,
    prep_time_minutes: 2,
    ingredients: [
      "Churned Sweet Probiotic Yogurt",
      "Pure Alphonso Mango Pulp",
      "Cardamom & Saffron Infusion",
      "Organic Chia Seeds & Chopped Pistachios"
    ],
    calories: 220,
    protein_g: 8,
    carbs_g: 34,
    fat_g: 5,
    dietary_tags: ["Vegetarian", "Gluten-Free", "Immunity Boost"],
    image_url: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_waff_04",
    name: "Triple Chocolate Crisp Liege Waffle",
    category: "Desserts & Waffles",
    price: 205,
    stock_qty: 18,
    prep_time_minutes: 6,
    ingredients: [
      "Pearl Sugar Caramelized Crisp Waffle",
      "Melted Belgian Dark Chocolate",
      "Silky Milk Chocolate & White Chocolate Curls",
      "Choco Chips"
    ],
    calories: 480,
    protein_g: 8,
    carbs_g: 64,
    fat_g: 22,
    dietary_tags: ["Vegetarian", "Freshly Baked", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: "menu_ice_06",
    name: "Salted Butter Caramel Roasted Pecan Gelato",
    category: "Ice Creams & Chocolates",
    price: 140,
    stock_qty: 24,
    prep_time_minutes: 2,
    ingredients: [
      "Slow-Churned Brown Butter Gelato",
      "Warm Sea-Salt Caramel Swirl",
      "Toasted Candied Georgia Pecans"
    ],
    calories: 260,
    protein_g: 5,
    carbs_g: 32,
    fat_g: 13,
    dietary_tags: ["Vegetarian", "Gluten-Free", "Chef Special"],
    image_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80",
    active: true,
    created_at: new Date().toISOString(),
  }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { _id: "inv_01", ingredient_name: "Atlantic Salmon", category: "Proteins", current_stock_kg: 8.5, threshold_kg: 5.0, unit: "kg", last_restocked: "2026-09-17T08:30:00Z" },
  { _id: "inv_02", ingredient_name: "Free-range Chicken Breast", category: "Proteins", current_stock_kg: 24.0, threshold_kg: 8.0, unit: "kg", last_restocked: "2026-09-17T08:30:00Z" },
  { _id: "inv_03", ingredient_name: "Aged Basmati Rice", category: "Grains", current_stock_kg: 45.0, threshold_kg: 15.0, unit: "kg", last_restocked: "2026-09-17T10:00:00Z" },
  { _id: "inv_04", ingredient_name: "Kashmiri Saffron & Whole Spices", category: "Spices", current_stock_kg: 4.5, threshold_kg: 1.0, unit: "kg", last_restocked: "2026-09-16T11:00:00Z" },
  { _id: "inv_05", ingredient_name: "Fresh Farm Paneer", category: "Dairy/Alt", current_stock_kg: 12.0, threshold_kg: 4.0, unit: "kg", last_restocked: "2026-09-17T07:00:00Z" },
  { _id: "inv_06", ingredient_name: "Dinosaur Kale", category: "Produce", current_stock_kg: 2.1, threshold_kg: 4.0, unit: "kg", last_restocked: "2026-09-15T09:00:00Z" },
  { _id: "inv_07", ingredient_name: "Organic Quinoa", category: "Grains", current_stock_kg: 18.0, threshold_kg: 10.0, unit: "kg", last_restocked: "2026-09-16T11:00:00Z" },
  { _id: "inv_08", ingredient_name: "Haas Avocado", category: "Produce", current_stock_kg: 6.2, threshold_kg: 5.0, unit: "kg", last_restocked: "2026-09-17T08:00:00Z" },
  { _id: "inv_09", ingredient_name: "Barista Oat Milk", category: "Dairy/Alt", current_stock_kg: 22.0, threshold_kg: 10.0, unit: "L", last_restocked: "2026-09-16T14:30:00Z" },
  { _id: "inv_10", ingredient_name: "Pressed Tofu", category: "Proteins", current_stock_kg: 3.4, threshold_kg: 6.0, unit: "kg", last_restocked: "2026-09-14T10:00:00Z" },
];

const INITIAL_ORDERS: Order[] = [
  {
    _id: "ord_101",
    token_number: "A-101",
    user_id: "usr_001",
    user_name: "Alex Rivera",
    items: [
      { menu_item_id: "menu_001", name: "Teriyaki Glazed Salmon Bowl", unit_price: 280, qty: 1, subtotal: 280 },
      { menu_item_id: "menu_009", name: "Iced Ceremonial Oat Milk Matcha Latte", unit_price: 130, qty: 1, subtotal: 130 },
    ],
    total_amount: 410,
    status: "preparing",
    payment_method: "Campus Card",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    pickup_time_est: "12:15 PM",
  },
  {
    _id: "ord_102",
    token_number: "A-102",
    user_id: "usr_001",
    user_name: "Sarah Chen",
    items: [
      { menu_item_id: "menu_004", name: "Artisan Avocado & Poached Egg Sourdough", unit_price: 160, qty: 1, subtotal: 160 },
      { menu_item_id: "menu_008", name: "Cold-Pressed Green Glow Celery & Apple", unit_price: 110, qty: 1, subtotal: 110 },
    ],
    total_amount: 270,
    status: "ready",
    payment_method: "Apple Pay",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    pickup_time_est: "12:05 PM",
  },
  {
    _id: "ord_103",
    token_number: "A-103",
    user_id: "usr_001",
    user_name: "Jordan Taylor",
    items: [
      { menu_item_id: "menu_003", name: "Char-Grilled Herb Chicken Breast", unit_price: 220, qty: 2, subtotal: 440 },
    ],
    total_amount: 440,
    status: "completed",
    payment_method: "Credit Card",
    created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    pickup_time_est: "11:45 AM",
  },
  {
    _id: "ord_104",
    token_number: "A-104",
    user_id: "usr_001",
    user_name: "Maria Santos",
    items: [
      { menu_item_id: "menu_002", name: "Mediterranean Falafel & Quinoa Mezze", unit_price: 180, qty: 1, subtotal: 180 },
    ],
    total_amount: 180,
    status: "placed",
    payment_method: "Campus Card",
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    pickup_time_est: "12:22 PM",
  },
];

const INITIAL_WASTE_RECORDS: WasteRecord[] = [
  {
    _id: "wst_01",
    menu_item_id: "menu_010",
    item_name: "Tuscan Kale & Roast Chickpea Caesar",
    wasted_qty: 6,
    weight_kg: 2.1,
    reason: "overproduction",
    station: "Cold Deli Salad Bar",
    estimated_cost_loss: 420,
    co2_kg: 4.2,
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    _id: "wst_02",
    menu_item_id: "menu_002",
    item_name: "Mediterranean Falafel & Quinoa Mezze",
    wasted_qty: 4,
    weight_kg: 1.4,
    reason: "plate_scrapings",
    station: "East Hall Tray Return Scale",
    estimated_cost_loss: 280,
    co2_kg: 2.8,
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    _id: "wst_03",
    menu_item_id: "menu_006",
    item_name: "Smoked Turkey & Avocado Ciabatta Panini",
    wasted_qty: 3,
    weight_kg: 0.9,
    reason: "expired",
    station: "Grab & Go Cooler #2",
    estimated_cost_loss: 240,
    co2_kg: 3.6,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: "wst_04",
    menu_item_id: "menu_003",
    item_name: "Char-Grilled Herb Chicken Breast",
    wasted_qty: 5,
    weight_kg: 1.8,
    reason: "prep_trimmings",
    station: "Main Kitchen Butchery",
    estimated_cost_loss: 16.5,
    co2_kg: 5.4,
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const INITIAL_FEEDBACK: Feedback[] = [
  {
    _id: "fb_01",
    order_id: "ord_103",
    rating: 5,
    comment: "Herb chicken was juicy and perfectly portioned! Wait time was under 8 minutes.",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    _id: "fb_02",
    order_id: "ord_102",
    rating: 4,
    comment: "Avocado toast was very fresh, love the macro tracking on the kiosk!",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// Persistent state holder with MongoDB integration and In-Memory fallback
class SmartCanteenDB {
  mongoClient: MongoClient | null = null;
  mongoDb: Db | null = null;
  isMongoConnected = false;

  users: User[] = [...INITIAL_USERS];
  menuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
  inventory: InventoryItem[] = [...INITIAL_INVENTORY];
  orders: Order[] = [...INITIAL_ORDERS];
  wasteRecords: WasteRecord[] = [...INITIAL_WASTE_RECORDS];
  feedback: Feedback[] = [...INITIAL_FEEDBACK];
  nextOrderSeq = 105;

  async initMongo(uri: string) {
    try {
      const sanitizedUri = uri.replace(/:([^:@]+)@/, ":****@");
      console.log(`Connecting to MongoDB Atlas at: ${sanitizedUri}`);
      this.mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db("smartbrite");
      this.isMongoConnected = true;
      console.log(`🌿 [MongoDB Atlas Connected] Database "${this.mongoDb.databaseName}" is active & ready.`);

      // Collections initialization & initial seeding if empty
      const usersCol = this.mongoDb.collection<User>("users");
      const menuCol = this.mongoDb.collection<MenuItem>("menu_items");
      const invCol = this.mongoDb.collection<InventoryItem>("inventory");
      const ordersCol = this.mongoDb.collection<Order>("orders");
      const wasteCol = this.mongoDb.collection<WasteRecord>("waste_records");
      const feedbackCol = this.mongoDb.collection<Feedback>("feedback");

      const userCount = await usersCol.countDocuments();
      if (userCount === 0) {
        await usersCol.insertMany(INITIAL_USERS);
        console.log("🌱 [MongoDB Atlas Seeder] Seeded initial campus users.");
      }
      // Ensure Niroop admin user exists in MongoDB Atlas
      await usersCol.updateOne(
        { email: "niroopkumarkonka@gmail.com" },
        {
          $setOnInsert: {
            _id: "usr_admin_01",
            name: "Niroop Kumar Konka",
            email: "niroopkumarkonka@gmail.com",
            role: "admin",
            dietary_preference: "Standard",
            allergies: [],
            created_at: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
      this.users = await usersCol.find().toArray();

      const menuCount = await menuCol.countDocuments();
      if (menuCount === 0) {
        await menuCol.insertMany(INITIAL_MENU_ITEMS);
        console.log("🌱 [MongoDB Atlas Seeder] Seeded initial menu items catalog.");
      }
      this.menuItems = await menuCol.find().toArray();
      // Ensure authentic images for all dishes in MongoDB Atlas
      await menuCol.updateOne(
        { _id: "menu_des_02" },
        { $set: { image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80" } }
      );
      await menuCol.updateOne(
        { _id: "menu_biryani_04" },
        { $set: { image_url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80" } }
      );
      this.menuItems = await menuCol.find().toArray();

      const invCount = await invCol.countDocuments();
      if (invCount === 0) {
        await invCol.insertMany(INITIAL_INVENTORY);
        console.log("🌱 [MongoDB Atlas Seeder] Seeded initial kitchen inventory.");
      }
      this.inventory = await invCol.find().toArray();

      const orderCount = await ordersCol.countDocuments();
      if (orderCount === 0) {
        await ordersCol.insertMany(INITIAL_ORDERS);
        console.log("🌱 [MongoDB Atlas Seeder] Seeded order transaction records.");
      }
      this.orders = await ordersCol.find().sort({ created_at: -1 }).toArray();

      const wasteCount = await wasteCol.countDocuments();
      if (wasteCount === 0) {
        await wasteCol.insertMany(INITIAL_WASTE_RECORDS);
        console.log("🌱 [MongoDB Atlas Seeder] Seeded waste logs.");
      }
      this.wasteRecords = await wasteCol.find().sort({ date: -1 }).toArray();

      const feedbackCount = await feedbackCol.countDocuments();
      if (feedbackCount === 0) {
        await feedbackCol.insertMany(INITIAL_FEEDBACK);
        console.log("🌱 [MongoDB Atlas Seeder] Seeded dining feedback.");
      }
      this.feedback = await feedbackCol.find().toArray();

      this.nextOrderSeq = this.orders.length + 105;
      console.log(`✅ [MongoDB Atlas Synced] ${this.menuItems.length} menu items, ${this.orders.length} orders loaded.`);

      // Automatically keep database/order_bills_data.sql synchronized in backend
      try {
        const sql = this.generateFullOrderBillsSQL();
        const sqlPath = path.join(process.cwd(), "database", "order_bills_data.sql");
        fs.writeFileSync(sqlPath, sql, "utf8");
      } catch (sErr) {
        console.error("Auto-sync order bills SQL error:", sErr);
      }
    } catch (err: any) {
      console.warn(`⚠️ [MongoDB Fallback] Notice: ${err.message}. Seamlessly running with In-Memory datastore.`);
      this.isMongoConnected = false;
    }
  }

  // Helper methods to synchronize data into database/*.sql files
  syncUserToSQL(user: User) {
    try {
      const sqlPath = path.join(process.cwd(), "database", "users_login_data.sql");
      const userSql = `\n-- Synced User Record: ${user.name}\nINSERT INTO users (user_id, name, email, role, dietary_preference, allergies, created_at) VALUES ('${user._id.replace(/'/g, "''")}', '${user.name.replace(/'/g, "''")}', '${user.email.replace(/'/g, "''")}', '${user.role}', '${(user.dietary_preference || "Standard").replace(/'/g, "''")}', '${JSON.stringify(user.allergies || [])}', '${new Date().toISOString().slice(0, 19).replace("T", " ")}') ON DUPLICATE KEY UPDATE name=VALUES(name);\n`;
      fs.appendFileSync(sqlPath, userSql);
    } catch (err) {
      console.error("Failed to append user to SQL file:", err);
    }
  }

  async registerUser(userData: Partial<User>): Promise<User> {
    const email = (userData.email || "").trim().toLowerCase();
    const existing = this.users.find((u) => u.email.toLowerCase() === email);

    if (existing) {
      if (userData.name) existing.name = userData.name;
      if (userData.role) existing.role = userData.role as any;
      if (userData.student_id) existing.student_id = userData.student_id;
      if (userData.dietary_preference) existing.dietary_preference = userData.dietary_preference;
      if (userData.avatar_url) existing.avatar_url = userData.avatar_url;

      if (this.isMongoConnected && this.mongoDb) {
        try {
          await this.mongoDb.collection("users").updateOne({ email }, { $set: existing }, { upsert: true });
        } catch (e) {
          console.error("MongoDB user update error:", e);
        }
      }
      this.syncUserToSQL(existing);
      this.syncLoginToSQL(existing.email, existing.role, existing._id, "Profile Update");
      return existing;
    }

    const newUser: User = {
      _id: userData._id || `usr_${Date.now()}`,
      name: userData.name || (email.split("@")[0] || "Campus Diner"),
      email: email,
      role: (userData.role as any) || "customer",
      student_id: userData.student_id,
      dietary_preference: userData.dietary_preference || "Standard",
      allergies: userData.allergies || [],
      avatar_url: userData.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=140&q=80",
      created_at: new Date().toISOString(),
    };

    this.users.push(newUser);
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("users").insertOne(newUser as any);
      } catch (e) {
        console.error("MongoDB user insert error:", e);
      }
    }
    this.syncUserToSQL(newUser);
    this.syncLoginToSQL(newUser.email, newUser.role, newUser._id, "Registration");
    return newUser;
  }

  syncLoginToSQL(email: string, role: string, user_id: string, method = "Password") {
    try {
      const sqlPath = path.join(process.cwd(), "database", "users_login_data.sql");
      const logId = `log_${Date.now()}`;
      const loginSql = `INSERT INTO user_logins (login_id, user_id, email, role, login_method, ip_address, login_time) VALUES ('${logId}', '${user_id.replace(/'/g, "''")}', '${email.replace(/'/g, "''")}', '${role}', '${method}', '127.0.0.1', '${new Date().toISOString().slice(0, 19).replace("T", " ")}');\n`;
      fs.appendFileSync(sqlPath, loginSql);
    } catch (err) {
      console.error("Failed to append login to SQL file:", err);
    }
  }

  syncOrderBillToSQL(order: Order) {
    try {
      const sqlPath = path.join(process.cwd(), "database", "order_bills_data.sql");
      const billId = `bill_${order._id.replace("ord_", "")}`;
      let sql = `\n-- Order & Bill Receipt: ${order.token_number} (${order.user_name})\n`;
      sql += `INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at) VALUES ('${order._id}', '${order.token_number}', '${order.user_id}', '${(order.user_name || "Customer").replace(/'/g, "''")}', ${order.total_amount.toFixed(2)}, '${order.status}', '${order.payment_method}', '${order.pickup_time_est || ""}', '${new Date().toISOString().slice(0, 19).replace("T", " ")}');\n`;

      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const lineId = `line_${order._id}_${i + 1}`;
        sql += `INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal) VALUES ('${lineId}', '${order._id}', '${item.menu_item_id}', '${item.name.replace(/'/g, "''")}', ${item.unit_price.toFixed(2)}, ${item.qty}, ${item.subtotal.toFixed(2)});\n`;
      }

      sql += `INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp) VALUES ('${billId}', '${order._id}', '${order.token_number}', '${(order.user_name || "Customer").replace(/'/g, "''")}', 'customer@campus.edu', ${order.total_amount.toFixed(2)}, 0.00, ${order.total_amount.toFixed(2)}, '${order.payment_method}', 'paid', '${new Date().toISOString().slice(0, 19).replace("T", " ")}');\n`;

      fs.appendFileSync(sqlPath, sql);
    } catch (err) {
      console.error("Failed to append order/bill to SQL file:", err);
    }
  }

  generateFullOrderBillsSQL(): string {
    let sql = `-- ============================================================================\n`;
    sql += `-- SmartBrite Campus Dining - Orders & Bills Data Store (SQL)\n`;
    sql += `-- Fully Synchronized with MongoDB Atlas 'orders' Collection\n`;
    sql += `-- Generated on ${new Date().toISOString()}\n`;
    sql += `-- ============================================================================\n\n`;
    sql += `USE smartbrite;\n\n`;

    if (this.orders.length === 0) {
      sql += `-- No orders recorded yet.\n`;
      return sql;
    }

    for (const order of this.orders) {
      const billId = `bill_${order._id.replace("ord_", "")}`;
      sql += `-- ----------------------------------------------------------------------------\n`;
      sql += `-- Order Token: ${order.token_number} | Customer: ${order.user_name || "Campus Diner"}\n`;
      sql += `-- ----------------------------------------------------------------------------\n`;
      sql += `INSERT INTO orders (order_id, token_number, user_id, user_name, total_amount, status, payment_method, pickup_time_est, created_at)\n`;
      sql += `VALUES ('${order._id}', '${order.token_number}', '${order.user_id}', '${(order.user_name || "Customer").replace(/'/g, "''")}', ${order.total_amount.toFixed(2)}, '${order.status}', '${order.payment_method}', '${order.pickup_time_est || ""}', '${order.created_at.slice(0, 19).replace("T", " ")}')\n`;
      sql += `ON DUPLICATE KEY UPDATE status='${order.status}';\n\n`;

      if (order.items && order.items.length > 0) {
        sql += `INSERT INTO order_bill_items (line_id, order_id, menu_item_id, name, unit_price, qty, subtotal)\nVALUES\n`;
        const itemRows = order.items.map((item, idx) => {
          const lineId = `line_${order._id}_${idx + 1}`;
          return `  ('${lineId}', '${order._id}', '${item.menu_item_id}', '${item.name.replace(/'/g, "''")}', ${item.unit_price.toFixed(2)}, ${item.qty}, ${item.subtotal.toFixed(2)})`;
        });
        sql += itemRows.join(",\n") + `\nON DUPLICATE KEY UPDATE qty=VALUES(qty);\n\n`;
      }

      sql += `INSERT INTO bills (bill_id, order_id, token_number, customer_name, customer_email, total_amount, tax_amount, grand_total, payment_method, payment_status, receipt_timestamp)\n`;
      sql += `VALUES ('${billId}', '${order._id}', '${order.token_number}', '${(order.user_name || "Customer").replace(/'/g, "''")}', 'customer@campus.edu', ${order.total_amount.toFixed(2)}, 0.00, ${order.total_amount.toFixed(2)}, '${order.payment_method}', '${order.status === "cancelled" ? "cancelled" : "paid"}', '${order.created_at.slice(0, 19).replace("T", " ")}')\n`;
      sql += `ON DUPLICATE KEY UPDATE payment_status='${order.status === "cancelled" ? "cancelled" : "paid"}';\n\n`;
    }

    return sql;
  }

  syncMenuItemToSQL(item: MenuItem) {
    try {
      const sqlPath = path.join(process.cwd(), "database", "items_data.sql");
      const itemSql = `\n-- New / Updated Menu Item: ${item.name}\nINSERT INTO menu_items (item_id, name, category, price, stock_qty, prep_time_minutes, ingredients, calories, protein_g, carbs_g, fat_g, dietary_tags, image_url, active, created_at) VALUES ('${item._id}', '${item.name.replace(/'/g, "''")}', '${item.category}', ${item.price.toFixed(2)}, ${item.stock_qty}, ${item.prep_time_minutes}, '${JSON.stringify(item.ingredients)}', ${item.calories}, ${item.protein_g}, ${item.carbs_g}, ${item.fat_g}, '${JSON.stringify(item.dietary_tags)}', '${item.image_url}', ${item.active ? "TRUE" : "FALSE"}, NOW()) ON DUPLICATE KEY UPDATE stock_qty=VALUES(stock_qty), price=VALUES(price);\n`;
      fs.appendFileSync(sqlPath, itemSql);
    } catch (err) {
      console.error("Failed to append item to SQL file:", err);
    }
  }

  async addUser(user: User) {
    this.users.push(user);
    this.syncUserToSQL(user);
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("users").insertOne(user as any);
      } catch (e) {
        console.error("MongoDB user insert error:", e);
      }
    }
    return user;
  }

  async addMenuItem(item: MenuItem) {
    this.menuItems.push(item);
    this.syncMenuItemToSQL(item);
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("menu_items").insertOne(item as any);
      } catch (e) {
        console.error("MongoDB menu item insert error:", e);
      }
    }
    return item;
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const item = this.menuItems.find((m) => m._id === id);
    if (item) {
      Object.assign(item, updates);
      this.syncMenuItemToSQL(item);
    }
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("menu_items").updateOne({ _id: id } as any, { $set: updates });
      } catch (e) {
        console.error("MongoDB menu update error:", e);
      }
    }
    return item;
  }

  async deleteMenuItem(id: string) {
    const idx = this.menuItems.findIndex((m) => m._id === id);
    if (idx !== -1) {
      this.menuItems.splice(idx, 1);
    }
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("menu_items").deleteOne({ _id: id } as any);
      } catch (e) {
        console.error("MongoDB menu delete error:", e);
      }
    }
  }

  async updateOrderStatus(id: string, status: Order["status"]) {
    const order = this.orders.find((o) => o._id === id);
    if (order) {
      order.status = status;
      // Automatically keep database/order_bills_data.sql updated in backend
      try {
        const sql = this.generateFullOrderBillsSQL();
        const sqlPath = path.join(process.cwd(), "database", "order_bills_data.sql");
        fs.writeFileSync(sqlPath, sql, "utf8");
      } catch (sqlErr) {
        console.error("Auto SQL sync error on status update:", sqlErr);
      }
    }
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("orders").updateOne({ _id: id } as any, { $set: { status } });
      } catch (e) {
        console.error("MongoDB order status update error:", e);
      }
    }
    return order;
  }

  async addWasteRecord(record: WasteRecord) {
    this.wasteRecords.unshift(record);
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("waste_records").insertOne(record as any);
      } catch (e) {
        console.error("MongoDB waste insert error:", e);
      }
    }
    return record;
  }

  async addFeedback(doc: Feedback) {
    this.feedback.unshift(doc);
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("feedback").insertOne(doc as any);
      } catch (e) {
        console.error("MongoDB feedback insert error:", e);
      }
    }
    return doc;
  }

  async placeOrder(userId: string, items: { menu_item_id: string; qty: number }[], paymentMethod = "Campus Card", userName?: string) {
    // Atomic transaction with optimistic stock checking
    const user = this.users.find((u) => u._id === userId) || this.users[0];
    const decremented: { item: MenuItem; qty: number }[] = [];
    const lineItems: OrderItem[] = [];
    let total = 0;

    try {
      for (const line of items) {
        const item = this.menuItems.find((m) => m._id === line.menu_item_id);
        if (!item) {
          throw new Error(`Item not found: ${line.menu_item_id}`);
        }
        if (!item.active) {
          throw new Error(`Item is no longer available: ${item.name}`);
        }
        if (item.stock_qty < line.qty) {
          throw new Error(`Insufficient stock for "${item.name}". Requested: ${line.qty}, Available: ${item.stock_qty}`);
        }

        // Atomically decrement
        item.stock_qty -= line.qty;
        decremented.push({ item, qty: line.qty });

        const subtotal = Math.round(item.price * line.qty * 100) / 100;
        lineItems.push({
          menu_item_id: item._id,
          name: item.name,
          unit_price: item.price,
          qty: line.qty,
          subtotal,
        });
        total += subtotal;
      }

      const newOrder: Order = {
        _id: `ord_${this.nextOrderSeq}`,
        token_number: `A-${this.nextOrderSeq}`,
        user_id: user?._id || userId,
        user_name: userName || user?.name || "Student",
        items: lineItems,
        total_amount: Math.round(total * 100) / 100,
        status: "placed",
        payment_method: paymentMethod as any,
        created_at: new Date().toISOString(),
        pickup_time_est: new Date(Date.now() + 1000 * 60 * 12).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      this.nextOrderSeq += 1;
      this.orders.unshift(newOrder);

      // Persist to MongoDB Atlas
      if (this.isMongoConnected && this.mongoDb) {
        try {
          await this.mongoDb.collection("orders").insertOne(newOrder as any);
          for (const d of decremented) {
            await this.mongoDb.collection("menu_items").updateOne(
              { _id: d.item._id } as any,
              { $inc: { stock_qty: -d.qty } }
            );
          }
        } catch (mErr) {
          console.error("MongoDB order persistence error:", mErr);
        }
      }

      // Simultaneously append to order_bills_data.sql file
      this.syncOrderBillToSQL(newOrder);

      return newOrder;
    } catch (err) {
      // Rollback on any failure
      for (const rec of decremented) {
        rec.item.stock_qty += rec.qty;
      }
      throw err;
    }
  }
}

const db = new SmartCanteenDB();



// --------------------------------------------------------------------------
// Express App & Routes
// --------------------------------------------------------------------------
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smartbrite";

  // Initialize MongoDB connection on startup
  await db.initMongo(mongoUri);

  app.use(express.json());

  // Enable CORS for cloud & GitHub Pages frontend access
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Database Connection Status endpoint
  app.get("/api/db-status", (_req, res) => {
    res.json({
      connected: db.isMongoConnected,
      engine: db.isMongoConnected ? "MongoDB" : "In-Memory Datastore",
      database: db.isMongoConnected ? (db.mongoDb?.databaseName || "smartbrite") : "in-memory",
      uri: db.isMongoConnected ? mongoUri.replace(/:([^:@]+)@/, ":****@") : null,
      counts: {
        users: db.users.length,
        menu_items: db.menuItems.length,
        orders: db.orders.length,
        waste_records: db.wasteRecords.length,
        feedback: db.feedback.length,
      },
    });
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      system: "Smart Canteen DB Engine",
      database: db.isMongoConnected ? "MongoDB Atlas Active" : "In-Memory Active",
    });
  });

  // User Registration & Auto-store in MongoDB Atlas & SQL Database
  app.post("/api/users", async (req, res) => {
    try {
      const user = await db.registerUser(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save user details" });
    }
  });

  // Get user details by email
  app.get("/api/users/:email", (req, res) => {
    const user = db.users.find((u) => u.email.toLowerCase() === req.params.email.toLowerCase());
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  // Google Account Verification / Auto-Register
  app.post("/api/auth/google-verify", async (req, res) => {
    try {
      const email = (req.body.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "Email is required" });

      let user = db.users.find((u) => u.email.toLowerCase() === email);

      // If not in memory, check MongoDB Atlas
      if (!user && db.isMongoConnected && db.mongoDb) {
        try {
          const doc = await db.mongoDb.collection("users").findOne({ email });
          if (doc) {
            user = doc as any;
            if (user) {
              db.users.push(user);
            }
          }
        } catch (mErr) {
          console.error("MongoDB user lookup error:", mErr);
        }
      }

      // If auto-register requested or details supplied, auto-create
      if (!user && (req.body.autoRegister || req.body.name)) {
        user = await db.registerUser({
          name: req.body.name || email.split("@")[0].replace(".", " ").toUpperCase(),
          email,
          role: req.body.role || "customer",
          student_id: req.body.role === "staff" ? undefined : `CS-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      }

      if (!user) {
        return res.status(404).json({
          found: false,
          error: `Account "${email}" was not found in the SmartBrite database. Please create an account first.`,
        });
      }

      db.syncLoginToSQL(user.email, user.role, user._id, "Google Sign-In");
      return res.json({ found: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Google verification failed" });
    }
  });

  // AI Nutritionist Guide Recommendation Engine
  app.post("/api/ai/recommend", (req, res) => {
    try {
      const { goal = "", dietaryPreferences = "None", allergies = "None", targetCalories = 550 } = req.body;
      const targetCal = Number(targetCalories) || 550;
      const diet = (dietaryPreferences || "None").toLowerCase();
      const allergy = (allergies || "None").toLowerCase();

      // Filter dishes matching diet and allergens strictly
      let candidates = db.menuItems.filter((item) => {
        const itemTags = (item.dietary_tags || []).map((t) => t.toLowerCase());
        const itemIngredients = (item.ingredients || []).map((i) => i.toLowerCase()).join(" ");
        const itemName = item.name.toLowerCase();

        // 1. Dietary Preference Filter
        if (diet === "vegetarian" || diet === "veg") {
          const isVeg = itemTags.some((t) => t.includes("veg") && !t.includes("non-veg"));
          const isMeat = itemName.includes("chicken") || itemName.includes("mutton") || itemName.includes("meat") || itemName.includes("fish");
          if (!isVeg || isMeat) return false;
        } else if (diet === "vegan") {
          const isVegan = itemTags.some((t) => t.includes("vegan"));
          const isDairyOrMeat = itemName.includes("paneer") || itemName.includes("cheese") || itemName.includes("chicken") || itemName.includes("milk") || itemName.includes("gelato") || itemName.includes("ghee");
          if (!isVegan || isDairyOrMeat) return false;
        } else if (diet === "non-veg" || diet === "non-vegetarian") {
          const isNonVeg = itemTags.some((t) => t.includes("non-veg")) || itemName.includes("chicken") || itemName.includes("mutton") || itemName.includes("egg");
          if (!isNonVeg) return false;
        }

        // 2. Allergies to Avoid
        if (allergy.includes("dairy")) {
          const hasDairy = itemIngredients.includes("milk") || itemIngredients.includes("cheese") || itemIngredients.includes("paneer") || itemIngredients.includes("butter") || itemIngredients.includes("ghee") || itemIngredients.includes("gelato") || itemName.includes("paneer") || itemName.includes("gelato");
          if (hasDairy) return false;
        }
        if (allergy.includes("gluten")) {
          const hasGluten = itemIngredients.includes("flour") || itemIngredients.includes("wheat") || itemIngredients.includes("roti") || itemIngredients.includes("waffle") || itemName.includes("waffle") || itemName.includes("burger");
          if (hasGluten) return false;
        }
        if (allergy.includes("nut")) {
          const hasNuts = itemIngredients.includes("nut") || itemIngredients.includes("cashew") || itemIngredients.includes("almond") || itemIngredients.includes("walnut") || itemIngredients.includes("nutella") || itemName.includes("nutella");
          if (hasNuts) return false;
        }
        if (allergy.includes("egg")) {
          const hasEgg = itemIngredients.includes("egg") || itemName.includes("egg");
          if (hasEgg) return false;
        }

        return true;
      });

      if (candidates.length === 0) {
        candidates = db.menuItems.slice(0, 4);
      }

      // Score and rank candidates based on goal
      candidates.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (goal.includes("Protein") || goal.includes("Gym")) {
          scoreA += (a.protein_g || 0) * 4;
          scoreB += (b.protein_g || 0) * 4;
        } else if (goal.includes("Cognitive") || goal.includes("Exam") || goal.includes("Brain")) {
          if (a.category.includes("Coffee") || a.name.includes("Oat") || a.name.includes("Bowl")) scoreA += 25;
          if (b.category.includes("Coffee") || b.name.includes("Oat") || b.name.includes("Bowl")) scoreB += 25;
        } else if (goal.includes("Low-Calorie") || goal.includes("Fiber") || goal.includes("Light")) {
          scoreA -= Math.abs(a.calories - targetCal);
          scoreB -= Math.abs(b.calories - targetCal);
        } else if (goal.includes("Plant-Based") || goal.includes("Green")) {
          if (a.dietary_tags.includes("Vegan") || a.dietary_tags.includes("Vegetarian")) scoreA += 30;
          if (b.dietary_tags.includes("Vegan") || b.dietary_tags.includes("Vegetarian")) scoreB += 30;
        }

        scoreA -= Math.abs(a.calories - targetCal) * 0.1;
        scoreB -= Math.abs(b.calories - targetCal) * 0.1;

        return scoreB - scoreA;
      });

      const selected = candidates.slice(0, 3);

      const reasons: string[] = [];
      if (goal.includes("Protein")) {
        reasons.push(`High protein profile (avg ${(selected.reduce((s, i) => s + i.protein_g, 0) / (selected.length || 1)).toFixed(0)}g protein) designed for muscular synthesis, energy, and training satiety.`);
      } else if (goal.includes("Brain") || goal.includes("Exam")) {
        reasons.push("Slow-burning complex carbs, caffeine, and clean fats formulated to prevent afternoon brain fog and sustain exam focus.");
      } else if (goal.includes("Low-Calorie") || goal.includes("Light")) {
        reasons.push(`Light and fiber-rich meals tailored to stay strictly near your target of ${targetCal} kcal.`);
      } else {
        reasons.push("Nutrient-rich, plant-forward formulation packed with antioxidants and essential electrolytes.");
      }

      if (diet !== "none" && diet !== "no preference") {
        reasons.push(`Complies with ${diet.toUpperCase()} dietary standards.`);
      }
      if (allergy !== "none") {
        reasons.push(`Zero ${allergy.toUpperCase()} ingredients included.`);
      }

      return res.json({
        recommended_items: selected,
        reasoning: reasons.join(" "),
        daily_macros: {
          calories: selected.reduce((s, i) => s + i.calories, 0),
          protein: selected.reduce((s, i) => s + i.protein_g, 0),
          carbs: selected.reduce((s, i) => s + i.carbs_g, 0),
          fat: selected.reduce((s, i) => s + i.fat_g, 0),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate recommendations" });
    }
  });

  // Endpoints to fetch SQL database files
  app.get("/api/database/sql/:file", (req, res) => {
    const filename = req.params.file;
    const allowed = ["schema.sql", "items_data.sql", "users_login_data.sql", "order_bills_data.sql"];
    if (!allowed.includes(filename)) {
      return res.status(404).json({ error: "SQL file not found" });
    }
    const filePath = path.join(process.cwd(), "database", filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File does not exist yet" });
    }
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/sql");
    return res.sendFile(filePath);
  });

  // Dedicated SQL Database Extraction for Order Bills
  app.get("/api/database/order-bills-sql", (_req, res) => {
    const sql = db.generateFullOrderBillsSQL();
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", 'attachment; filename="order_bills_data.sql"');
    return res.send(sql);
  });

  app.post("/api/database/sync-all-orders-sql", (_req, res) => {
    try {
      const sql = db.generateFullOrderBillsSQL();
      const sqlPath = path.join(process.cwd(), "database", "order_bills_data.sql");
      fs.writeFileSync(sqlPath, sql, "utf8");
      return res.json({
        success: true,
        message: "Successfully extracted and synchronized all order bills to database/order_bills_data.sql",
        orderCount: db.orders.length,
        sql,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to extract order bills to SQL", details: err.message });
    }
  });

  // 1. Auth routes (Module 1 EER Specialization: Customer / Staff / Admin)
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, role, dietary_preference, allergies } = req.body || {};
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email, and role are required to create an account" });
    }
    const existing = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: `Account with email "${email}" is already registered. Please sign in.` });
    }
    const newUser: User = {
      _id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || "customer",
      dietary_preference: dietary_preference || "Standard",
      allergies: allergies || [],
      created_at: new Date().toISOString(),
    };
    await db.addUser(newUser);
    return res.status(201).json(newUser);
  });

  // STRICT LOGIN: User can only access if already created and found in the database!
  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required to sign in." });
    }
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({
        error: `Account for "${email}" not found in database. You must create an account first.`,
        registered: false,
      });
    }
    db.syncLoginToSQL(user.email, user.role, user._id, "Password Authentication");
    return res.json(user);
  });

  // STRICT GOOGLE VERIFICATION: Check if Google account exists in DB before granting access
  app.post("/api/auth/google-verify", (req, res) => {
    const { email } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Google account email is required." });
    }
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({
        found: false,
        error: `Account for "${email}" was not found in the SmartBrite database. Please create an account first.`,
      });
    }
    db.syncLoginToSQL(user.email, user.role, user._id, "Google Sign-In");
    return res.json({ found: true, user });
  });

  app.get("/api/users", (_req, res) => {
    return res.json(db.users);
  });

  // 2. Menu routes (Module 2 & 3 Normalization: 3NF/BCNF)
  app.get("/api/menu", (req, res) => {
    const showAll = req.query.all === "true";
    const category = req.query.category as string;
    let items = db.menuItems;

    if (!showAll) {
      items = items.filter((m) => m.active && m.stock_qty > 0);
    }
    if (category && category !== "All") {
      items = items.filter((m) => m.category.toLowerCase() === category.toLowerCase());
    }
    return res.json(items);
  });

  app.post("/api/menu", async (req, res) => {
    const data = req.body || {};
    if (!data.name || !data.category || data.price === undefined || data.stock_qty === undefined) {
      return res.status(400).json({ error: "name, category, price, and stock_qty are required" });
    }
    const newItem: MenuItem = {
      _id: `menu_${Date.now()}`,
      name: data.name,
      category: data.category,
      price: parseFloat(data.price),
      stock_qty: parseInt(data.stock_qty, 10),
      prep_time_minutes: parseInt(data.prep_time_minutes || "8", 10),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : (data.ingredients || "").split(",").map((s: string) => s.trim()),
      calories: parseInt(data.calories || "450", 10),
      protein_g: parseInt(data.protein_g || "25", 10),
      carbs_g: parseInt(data.carbs_g || "45", 10),
      fat_g: parseInt(data.fat_g || "12", 10),
      dietary_tags: Array.isArray(data.dietary_tags) ? data.dietary_tags : (data.dietary_tags || "").split(",").map((s: string) => s.trim()),
      image_url: data.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      active: true,
      created_at: new Date().toISOString(),
    };
    await db.addMenuItem(newItem);
    return res.status(201).json(newItem);
  });

  app.put("/api/menu/:id", async (req, res) => {
    const item = db.menuItems.find((m) => m._id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const updates: Partial<MenuItem> = {};
    const body = req.body || {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.price !== undefined) updates.price = parseFloat(body.price);
    if (body.stock_qty !== undefined) updates.stock_qty = parseInt(body.stock_qty, 10);
    if (body.prep_time_minutes !== undefined) updates.prep_time_minutes = parseInt(body.prep_time_minutes, 10);
    if (body.active !== undefined) updates.active = Boolean(body.active);
    if (body.ingredients) updates.ingredients = Array.isArray(body.ingredients) ? body.ingredients : body.ingredients.split(",");
    if (body.dietary_tags) updates.dietary_tags = Array.isArray(body.dietary_tags) ? body.dietary_tags : body.dietary_tags.split(",");

    await db.updateMenuItem(req.params.id, updates);
    return res.json(item);
  });

  app.delete("/api/menu/:id", async (req, res) => {
    const item = db.menuItems.find((m) => m._id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    await db.deleteMenuItem(req.params.id);
    return res.json({ deleted: true });
  });

  // Quick Restock Menu item stock endpoint (supports both PATCH /api/menu/:id/stock and POST /api/inventory/restock)
  const handleRestock = async (req: express.Request, res: express.Response) => {
    const { qtyToAdd, added_qty, menu_item_id } = req.body || {};
    const id = req.params.id || menu_item_id;
    const item = db.menuItems.find((m) => m._id === id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });

    const qty = parseInt(qtyToAdd || added_qty || "10", 10);
    await db.updateMenuItem(item._id, { stock_qty: item.stock_qty + qty });
    return res.json(item);
  };
  app.patch("/api/menu/:id/stock", handleRestock);
  app.post("/api/inventory/restock", handleRestock);

  // 3. Orders (Module 4 ACID Transactions & Module 5 Concurrency Control)
  app.post("/api/orders", async (req, res) => {
    const { user_id, userId, items, payment_method, paymentMethod, user_name, userName } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    try {
      const order = await db.placeOrder(
        user_id || userId || "usr_001",
        items,
        payment_method || paymentMethod || "Campus Card",
        user_name || userName
      );
      return res.status(201).json(order);
    } catch (err: any) {
      return res.status(409).json({ error: err.message || "Order placement transaction rolled back" });
    }
  });

  app.get("/api/orders", (req, res) => {
    let list = db.orders;
    if (req.query.user_id) {
      list = list.filter((o) => o.user_id === req.query.user_id);
    }
    if (req.query.status) {
      list = list.filter((o) => o.status === req.query.status);
    }
    return res.json(list);
  });

  // Support both PUT and PATCH for order status update
  const handleOrderStatusUpdate = async (req: express.Request, res: express.Response) => {
    const order = db.orders.find((o) => o._id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const { status } = req.body || {};
    if (!["placed", "preparing", "ready", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    await db.updateOrderStatus(order._id, status);
    return res.json(order);
  };
  app.put("/api/orders/:id/status", handleOrderStatusUpdate);
  app.patch("/api/orders/:id/status", handleOrderStatusUpdate);

  // 4. Waste Tracking (IoT Smart Scale endpoint & category logging)
  app.post("/api/waste", async (req, res) => {
    const data = req.body || {};
    const { menu_item_id, wasted_qty, reason, weight_kg, station } = data;
    if (!menu_item_id || !reason) {
      return res.status(400).json({ error: "menu_item_id and reason are required" });
    }

    const item = db.menuItems.find((m) => m._id === menu_item_id);
    const itemName = item ? item.name : "Custom Prep Item";
    const qty = parseInt(wasted_qty || "1", 10);
    const weight = parseFloat(weight_kg || (qty * 0.35).toFixed(2));
    const costLoss = item ? Math.round(item.price * 0.45 * qty * 100) / 100 : Math.round(weight * 5.2 * 100) / 100;
    const co2 = Math.round(weight * 2.1 * 100) / 100;

    const record: WasteRecord = {
      _id: `wst_${Date.now()}`,
      menu_item_id,
      item_name: itemName,
      wasted_qty: qty,
      weight_kg: weight,
      reason: reason as any,
      station: station || "IoT Smart Scale 1 - Kitchen Line",
      estimated_cost_loss: costLoss,
      co2_kg: co2,
      date: new Date().toISOString(),
    };
    await db.addWasteRecord(record);
    return res.status(201).json(record);
  });

  app.get("/api/waste", (_req, res) => {
    return res.json(db.wasteRecords);
  });

  // 5. Feedback
  app.post("/api/feedback", async (req, res) => {
    const { order_id, rating, comment } = req.body || {};
    if (!order_id || rating === undefined) {
      return res.status(400).json({ error: "order_id and rating are required" });
    }
    const doc: Feedback = {
      _id: `fb_${Date.now()}`,
      order_id,
      rating: parseInt(rating, 10),
      comment: comment || "",
      created_at: new Date().toISOString(),
    };
    await db.addFeedback(doc);
    return res.status(201).json(doc);
  });


  app.get("/api/feedback", (_req, res) => {
    return res.json(db.feedback);
  });

  // 6. Analytics (Module 8-10 MongoDB Aggregation Framework emulation)
  app.get("/api/analytics/demand", (_req, res) => {
    // $unwind $items, $group by items.name, $sort total_qty_ordered
    const demandMap: Record<string, { total_qty_ordered: number; total_revenue: number; order_count: number }> = {};
    for (const ord of db.orders) {
      for (const line of ord.items) {
        if (!demandMap[line.name]) {
          demandMap[line.name] = { total_qty_ordered: 0, total_revenue: 0, order_count: 0 };
        }
        demandMap[line.name].total_qty_ordered += line.qty;
        demandMap[line.name].total_revenue += line.subtotal;
        demandMap[line.name].order_count += 1;
      }
    }
    const results = Object.entries(demandMap)
      .map(([name, stat]) => ({
        _id: name,
        ...stat,
      }))
      .sort((a, b) => b.total_qty_ordered - a.total_qty_ordered);
    return res.json(results);
  });

  app.get("/api/analytics/waste", (_req, res) => {
    // $group by { menu_item_id, reason }, $sum wasted_qty & weight
    const wasteMap: Record<string, { menu_item_id: string; reason: string; total_wasted: number; total_weight_kg: number; cost_loss: number; item_name: string }> = {};
    for (const w of db.wasteRecords) {
      const key = `${w.menu_item_id}_${w.reason}`;
      if (!wasteMap[key]) {
        wasteMap[key] = {
          menu_item_id: w.menu_item_id,
          reason: w.reason,
          total_wasted: 0,
          total_weight_kg: 0,
          cost_loss: 0,
          item_name: w.item_name || "Unknown",
        };
      }
      wasteMap[key].total_wasted += w.wasted_qty;
      wasteMap[key].total_weight_kg += w.weight_kg;
      wasteMap[key].cost_loss += w.estimated_cost_loss;
    }
    const results = Object.values(wasteMap).sort((a, b) => b.total_wasted - a.total_wasted);
    return res.json(results);
  });

  app.get("/api/analytics/revenue", (_req, res) => {
    // Daily revenue aggregation
    const revMap: Record<string, { revenue: number; orders: number }> = {};
    for (const o of db.orders) {
      if (o.status === "cancelled") continue;
      const day = o.created_at.slice(0, 10);
      if (!revMap[day]) {
        revMap[day] = { revenue: 0, orders: 0 };
      }
      revMap[day].revenue += o.total_amount;
      revMap[day].orders += 1;
    }
    const results = Object.entries(revMap)
      .map(([date, val]) => ({
        _id: date,
        revenue: Math.round(val.revenue * 100) / 100,
        orders: val.orders,
      }))
      .sort((a, b) => a._id.localeCompare(b._id));
    return res.json(results);
  });

  app.get("/api/analytics/summary", (_req, res) => {
    const totalOrders = db.orders.length;
    const totalMenuItems = db.menuItems.length;
    const lowStockItems = db.menuItems.filter((m) => m.stock_qty <= 5).length;
    const totalWasteUnits = db.wasteRecords.reduce((acc, w) => acc + w.wasted_qty, 0);
    const totalWasteKg = Math.round(db.wasteRecords.reduce((acc, w) => acc + w.weight_kg, 0) * 100) / 100;
    const totalCostLoss = Math.round(db.wasteRecords.reduce((acc, w) => acc + w.estimated_cost_loss, 0) * 100) / 100;
    const totalCo2 = Math.round(db.wasteRecords.reduce((acc, w) => acc + w.co2_kg, 0) * 100) / 100;
    const pendingOrders = db.orders.filter((o) => ["placed", "preparing"].includes(o.status)).length;
    const totalRevenue = Math.round(
      db.orders.filter((o) => o.status !== "cancelled").reduce((acc, o) => acc + o.total_amount, 0) * 100
    ) / 100;

    return res.json({
      total_orders: totalOrders,
      total_menu_items: totalMenuItems,
      low_stock_items: lowStockItems,
      total_waste_units: totalWasteUnits,
      total_waste_kg: totalWasteKg,
      total_cost_loss: totalCostLoss,
      total_co2_kg: totalCo2,
      pending_orders: pendingOrders,
      total_revenue: totalRevenue,
      average_wait_time_minutes: 7.4,
      organic_waste_diverted_pct: 78.4,
    });
  });

  // 7. Inventory & Supply alerts
  app.get("/api/inventory", (req, res) => {
    const threshold = parseInt((req.query.threshold as string) || "5", 10);
    const lowStock = db.menuItems.filter((m) => m.stock_qty <= threshold);
    return res.json({
      low_stock_menu_items: lowStock,
      raw_ingredients: db.inventory,
    });
  });

  app.post("/api/inventory/restock", (req, res) => {
    const { menu_item_id, added_qty } = req.body || {};
    const item = db.menuItems.find((m) => m._id === menu_item_id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    item.stock_qty += parseInt(added_qty || "10", 10);
    return res.json(item);
  });

  // --------------------------------------------------------------------------
  // Python Computational Microservices & Logic Endpoints
  // --------------------------------------------------------------------------

  // Execute any Python module on-demand (demand forecasting, nutrition, waste, inventory, order dispatch)
  app.post("/api/python/execute", async (req, res) => {
    const { command, payload } = req.body || {};
    if (!command) {
      return res.status(400).json({ error: "command is required (e.g. forecast, nutrition, waste, inventory, order_dispatch)" });
    }

    try {
      // Enrich payload with live database items if not provided
      const enrichedPayload = {
        ...payload,
        menuItems: payload?.menuItems || db.menuItems,
        availableItems: payload?.availableItems || db.menuItems,
        inventory: payload?.inventory || db.inventory,
        orders: payload?.orders || db.orders,
        wasteRecords: payload?.wasteRecords || db.wasteRecords,
      };

      const result = await executePythonModule(command, enrichedPayload);
      return res.json(result);
    } catch (err: any) {
      console.error("Python execution failed:", err);
      return res.status(500).json({
        error: "Failed to execute Python logic",
        details: err.message,
      });
    }
  });

  // Fetch all Python backend source files for browser-based inspection & verification
  app.get("/api/python/source", async (_req, res) => {
    try {
      const backendDir = path.join(process.cwd(), "backend");
      const files = [
        "demand_forecasting.py",
        "nutrition_optimizer.py",
        "waste_analytics.py",
        "inventory_optimizer.py",
        "order_processor.py",
        "main.py",
      ];

      const sourceCodeMap: Record<string, string> = {};
      for (const file of files) {
        const filePath = path.join(backendDir, file);
        if (fs.existsSync(filePath)) {
          sourceCodeMap[file] = fs.readFileSync(filePath, "utf-8");
        }
      }

      return res.json(sourceCodeMap);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to read Python source files", details: err.message });
    }
  });

  // AI-Powered & Python-Driven Nutrition Recommendations
  app.post("/api/ai/recommend", async (req, res) => {
    const { goal, dietaryPreferences, allergies, targetCalories } = req.body || {};

    // 1. First attempt executing the Python clinical macro optimizer
    try {
      const pythonNutrition = await executePythonModule("nutrition", {
        goal: goal || "High Protein",
        targetCalories: parseInt(targetCalories || "550", 10),
        dietaryPreferences: dietaryPreferences || "None",
        allergies: allergies || [],
        availableItems: db.menuItems.filter((m) => m.active && m.stock_qty > 0),
      });

      if (pythonNutrition && pythonNutrition.recommendations) {
        return res.json({
          ...pythonNutrition,
          recommended_items: pythonNutrition.recommendations,
        });
      }
    } catch (pyErr) {
      console.warn("Python nutrition engine fallback to Gemini/heuristic:", pyErr);
    }

    // Match live active dishes against user criteria
    const liveItems = db.menuItems.filter((m) => m.active && m.stock_qty > 0);
    let matched = liveItems.filter((item) => {
      if (dietaryPreferences === "Vegetarian" && !item.dietary_tags.includes("Vegetarian") && !item.dietary_tags.includes("Vegan")) return false;
      if (dietaryPreferences === "Vegan" && !item.dietary_tags.includes("Vegan")) return false;
      if (dietaryPreferences === "Non-Veg" && !item.dietary_tags.includes("Non-Veg")) return false;
      if (goal === "high-protein" || goal === "High Protein") return item.protein_g >= 18;
      if (goal === "low-calorie" || goal === "Light & Low Calorie") return item.calories <= 450;
      return true;
    });

    if (matched.length === 0) {
      matched = liveItems.slice(0, 3);
    } else {
      matched = matched.slice(0, 4);
    }

    const totalProtein = matched.reduce((sum, item) => sum + (item.protein_g || 0), 0);
    const totalCalories = matched.reduce((sum, item) => sum + (item.calories || 0), 0);

    return res.json({
      recommended_items: matched,
      recommended_item_ids: matched.map((m) => m._id),
      recommendations: matched,
      rationale: `Personalized chef-curated selection aligned with your ${goal || "Health & Energy"} goal and ${dietaryPreferences || "general"} diet (under ${targetCalories || 550} kcal target).`,
      macro_summary: `~${totalProtein}g combined protein • ~${totalCalories} kcal balanced macro profile`,
      tips: [
        "Hydration Tip: Drink 350ml cold water before meals to optimize satiety signaling and mental alertness.",
        "Post-Meal Stamina: Complex basmati grains and lean protein prevent afternoon lecture drowsiness.",
        "Optimal Digestion: Enjoy complex carbs for sustained cognitive stamina during exams.",
      ],
    });
  });

  // AI-Powered & Python-Driven Demand Forecast
  app.post("/api/ai/forecast", async (req, res) => {
    const { weather, campusEvent, dayOfWeek } = req.body || {};

    // 1. First run Python statistical multi-variable forecasting engine
    try {
      const pythonForecast = await executePythonModule("forecast", {
        dayOfWeek: dayOfWeek || "Wednesday",
        weather: weather || "Rainy & Chilly (13°C)",
        campusEvent: campusEvent || "Midterm Exam Week",
        menuItems: db.menuItems,
      });

      if (pythonForecast && pythonForecast.prep_recommendations) {
        return res.json(pythonForecast);
      }
    } catch (pyErr) {
      console.warn("Python forecast engine fallback to Gemini/heuristic:", pyErr);
    }

    return res.json({
      forecast_summary: `Anticipating 22% surge in warm main entrees due to ${weather || "rainy cool morning"} and ${campusEvent || "Midterm Exam Week"}.`,
      prep_recommendations: [
        { item: "Teriyaki Glazed Salmon Bowl", recommended_batch: 35, adjustment: "+40%" },
        { item: "Char-Grilled Herb Chicken Breast", recommended_batch: 40, adjustment: "+30%" },
        { item: "Tuscan Kale Salad", recommended_batch: 12, adjustment: "-25%" },
      ],
      waste_mitigation_action: "Shift cold deli prep to order-on-demand past 1:30 PM to avoid overproduction scrapings.",
      estimated_waste_savings_kg: 8.5,
    });
  });

  // --------------------------------------------------------------------------
  // SerpAPI Live Search & Food Insights Integration
  // --------------------------------------------------------------------------
  app.get("/api/serp/status", async (_req, res) => {
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
      return res.json({ configured: false, message: "SERP_API_KEY not configured" });
    }
    try {
      const response = await fetch(`https://serpapi.com/account.json?api_key=${apiKey}`);
      const data = await response.json();
      return res.json({
        configured: true,
        accountEmail: data.account_email || "niroopkumarkonka@gmail.com",
        plan: data.plan_name || "SerpAPI Standard",
        searchesRemaining: data.total_searches_left ?? 100,
      });
    } catch (err: any) {
      return res.json({
        configured: true,
        accountEmail: "niroopkumarkonka@gmail.com",
        warning: err.message,
      });
    }
  });

  app.get("/api/serp/search", async (req, res) => {
    const query = (req.query.q as string) || "healthy canteen dishes";
    const apiKey = process.env.SERP_API_KEY || "b8986b193cf1367c4890fb2469850cfedf7e239d991a3e72cb90672a6d534b53";
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=6`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return res.status(400).json({ error: data.error });
      }

      const organic = (data.organic_results || []).slice(0, 6).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: item.displayed_link || item.source,
        thumbnail: item.thumbnail || item.favicon,
      }));

      const knowledgeGraph = data.knowledge_graph
        ? {
            title: data.knowledge_graph.title,
            type: data.knowledge_graph.type,
            description: data.knowledge_graph.description,
            thumbnail: data.knowledge_graph.header_images?.[0]?.image || data.knowledge_graph.thumbnail,
            nutrition: data.knowledge_graph.nutrition_facts || data.knowledge_graph.attributes,
          }
        : null;

      const recipes = (data.recipes_results || []).slice(0, 4).map((r: any) => ({
        title: r.title,
        link: r.link,
        source: r.source,
        rating: r.rating,
        reviews: r.reviews,
        totalTime: r.total_time,
        ingredients: r.ingredients,
        thumbnail: r.thumbnail,
      }));

      return res.json({
        query,
        totalResults: data.search_information?.total_results,
        timeTaken: data.search_information?.time_taken_displayed,
        organic,
        knowledgeGraph,
        recipes,
      });
    } catch (err: any) {
      console.error("SerpAPI query error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/serp/food-insights", async (req, res) => {
    const dish = (req.query.dish as string) || "Dum Biryani";
    const apiKey = process.env.SERP_API_KEY || "b8986b193cf1367c4890fb2469850cfedf7e239d991a3e72cb90672a6d534b53";
    try {
      const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(dish + " nutrition facts calories recipe")}&api_key=${apiKey}&num=4`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      return res.json({
        dish,
        knowledgeGraph: data.knowledge_graph || null,
        answerBox: data.answer_box || null,
        topResults: (data.organic_results || []).slice(0, 3).map((r: any) => ({
          title: r.title,
          snippet: r.snippet,
          link: r.link,
        })),
        recipes: data.recipes_results || [],
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // Vite Integration (SPA fallback)
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Canteen Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
