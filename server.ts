import express from "express";
import path from "path";
import fs from "fs";
import { spawn, spawnSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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
    image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
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
    image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
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

// Persistent state holder
class SmartCanteenDB {
  users: User[] = [...INITIAL_USERS];
  menuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
  inventory: InventoryItem[] = [...INITIAL_INVENTORY];
  orders: Order[] = [...INITIAL_ORDERS];
  wasteRecords: WasteRecord[] = [...INITIAL_WASTE_RECORDS];
  feedback: Feedback[] = [...INITIAL_FEEDBACK];
  nextOrderSeq = 105;

  // Optimistic Concurrency Control Mutex emulation for ACID transaction verification
  private lock = false;

  async placeOrder(userId: string, items: { menu_item_id: string; qty: number }[], paymentMethod = "Campus Card") {
    // Module 4 & 5: Atomic transaction with optimistic stock checking
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
        // Optimistic stock check:
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
        user_id: user._id,
        user_name: user.name,
        items: lineItems,
        total_amount: Math.round(total * 100) / 100,
        status: "placed",
        payment_method: paymentMethod as any,
        created_at: new Date().toISOString(),
        pickup_time_est: new Date(Date.now() + 1000 * 60 * 12).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      this.nextOrderSeq += 1;
      this.orders.unshift(newOrder);
      return newOrder;
    } catch (err) {
      // Rollback on any failure (ACID Atomicity guarantee)
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

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString(), system: "Smart Canteen DB Engine" });
  });

  // 1. Auth routes (Module 1 EER Specialization: Customer / Staff / Admin)
  app.post("/api/auth/register", (req, res) => {
    const { name, email, role, dietary_preference, allergies } = req.body || {};
    if (!name || !email || !role) {
      return res.status(400).json({ error: "name, email, and role are required" });
    }
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: "User with this email already registered" });
    }
    const newUser: User = {
      _id: `usr_${Date.now()}`,
      name,
      email,
      role: role || "customer",
      dietary_preference: dietary_preference || "Standard",
      allergies: allergies || [],
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    return res.status(201).json(newUser);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body || {};
    const user = db.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
    if (!user) {
      // Return a default demo user if not found
      return res.json(db.users[0]);
    }
    return res.json(user);
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

  app.post("/api/menu", (req, res) => {
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
    db.menuItems.push(newItem);
    return res.status(201).json(newItem);
  });

  app.put("/api/menu/:id", (req, res) => {
    const item = db.menuItems.find((m) => m._id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const updates = req.body || {};
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.price !== undefined) item.price = parseFloat(updates.price);
    if (updates.stock_qty !== undefined) item.stock_qty = parseInt(updates.stock_qty, 10);
    if (updates.prep_time_minutes !== undefined) item.prep_time_minutes = parseInt(updates.prep_time_minutes, 10);
    if (updates.active !== undefined) item.active = Boolean(updates.active);
    if (updates.ingredients) item.ingredients = Array.isArray(updates.ingredients) ? updates.ingredients : updates.ingredients.split(",");
    if (updates.dietary_tags) item.dietary_tags = Array.isArray(updates.dietary_tags) ? updates.dietary_tags : updates.dietary_tags.split(",");

    return res.json(item);
  });

  app.delete("/api/menu/:id", (req, res) => {
    const idx = db.menuItems.findIndex((m) => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Item not found" });
    db.menuItems.splice(idx, 1);
    return res.json({ deleted: true });
  });

  // 3. Orders (Module 4 ACID Transactions & Module 5 Concurrency Control)
  app.post("/api/orders", async (req, res) => {
    const { user_id, items, payment_method } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    try {
      const order = await db.placeOrder(user_id || "usr_001", items, payment_method);
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

  app.put("/api/orders/:id/status", (req, res) => {
    const order = db.orders.find((o) => o._id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const { status } = req.body || {};
    if (!["placed", "preparing", "ready", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    order.status = status;
    return res.json(order);
  });

  // 4. Waste Tracking (IoT Smart Scale endpoint & category logging)
  app.post("/api/waste", (req, res) => {
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
    db.wasteRecords.unshift(record);
    return res.status(201).json(record);
  });

  app.get("/api/waste", (_req, res) => {
    return res.json(db.wasteRecords);
  });

  // 5. Feedback
  app.post("/api/feedback", (req, res) => {
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
    db.feedback.unshift(doc);
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
        return res.json(pythonNutrition);
      }
    } catch (pyErr) {
      console.warn("Python nutrition engine fallback to Gemini/heuristic:", pyErr);
    }

    // Fallback: Gemini AI or Heuristic
    const availableItems = db.menuItems.filter((m) => m.active && m.stock_qty > 0).map((m) => ({
      id: m._id,
      name: m.name,
      category: m.category,
      calories: m.calories,
      protein: m.protein_g,
      carbs: m.carbs_g,
      fat: m.fat_g,
      price: m.price,
      tags: m.dietary_tags,
    }));

    const ai = getAIClient();
    if (!ai) {
      const filtered = availableItems.filter((item) => {
        if (goal === "High Protein" && item.protein < 25) return false;
        if (goal === "Low Calorie" && item.calories > 500) return false;
        return true;
      });
      return res.json({
        recommendations: filtered.slice(0, 3),
        rationale: `Personalized match for your ${goal || "healthy eating"} target (${targetCalories || 550} kcal max).`,
        tips: ["Pair with green cold-pressed juice for optimal digestion", "Consuming protein within 45 minutes of workout improves muscle repair"],
      });
    }

    try {
      const prompt = `You are a Smart Campus Canteen Clinical Nutritionist and Executive Chef.
User Profile:
- Health/Study Goal: ${goal || "Balanced Energy & Focus"}
- Dietary Preferences: ${dietaryPreferences || "None"}
- Allergies to avoid: ${allergies || "None"}
- Target Calorie range: ${targetCalories || "450-650"} kcal

Current Live Menu in Kitchen:
${JSON.stringify(availableItems, null, 2)}

Provide a structured JSON response with:
1. "recommended_item_ids": array of 2 or 3 item ids that best suit this user.
2. "rationale": a 2-sentence encouraging nutritional explanation.
3. "macro_summary": brief estimate of total protein and energy value.
4. "tips": 2 bullet points on staying energized during campus lectures.
Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      return res.json({
        recommended_item_ids: ["menu_001", "menu_004"],
        rationale: "Selected our top macro-balanced bowls with high bioavailability and sustainable ingredients.",
        macro_summary: "~54g combined protein, optimal low-glycemic carbs.",
        tips: ["Drink plenty of water before noon", "Enjoy complex carbs for sustained cognitive stamina"],
      });
    }
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
