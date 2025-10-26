
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data");
const MENU_FILE = path.join(DATA_DIR, "menu.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}


// Boot with sample menu if missing
if (!fs.existsSync(MENU_FILE)) {
  const sampleMenu = [
    { id: "m1", name: "Margherita Pizza", price: 299, img: "🍕", category: "Pizza" },
    { id: "m2", name: "Veg Burger", price: 149, img: "🍔", category: "Burger" },
    { id: "m3", name: "Chicken Biryani", price: 249, img: "🍗", category: "Biryani" },
    { id: "m4", name: "Masala Dosa", price: 129, img: "🥞", category: "South Indian" },
    { id: "m5", name: "Paneer Butter Masala", price: 219, img: "🍛", category: "North Indian" }
  ];
  writeJSON(MENU_FILE, sampleMenu);
}
if (!fs.existsSync(ORDERS_FILE)) writeJSON(ORDERS_FILE, []);

// Routes
app.get("/api/health", (_req, res) => res.json({ ok: true }));


app.get("/api/menu", (_req, res) => {
  const menu = readJSON(MENU_FILE, []);
  res.json(menu);
});

app.post("/api/menu", (req, res) => {
  const { name, price, img, category } = req.body || {};
  if (!name || typeof price !== "number") {
    return res.status(400).json({ error: "name and price are required" });
  }
  const menu = readJSON(MENU_FILE, []);
  const item = { id: nanoid(8), name, price, img: img || "🍽️", category: category || "Other" };
  menu.push(item);
  writeJSON(MENU_FILE, menu);
  res.status(201).json(item);
});

app.post("/api/orders", (req, res) => {
  const { items, customer } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items required" });
  }
  const id = nanoid(10);
  const createdAt = new Date().toISOString();
  const total = items.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const order = {
    id, items, total, status: "PENDING_PAYMENT", customer: customer || {}, createdAt
  };
  const orders = readJSON(ORDERS_FILE, []);
  orders.push(order);
  writeJSON(ORDERS_FILE, orders);
  res.status(201).json(order);
});

app.post("/api/payments/mock", (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: "orderId required" });
  const orders = readJSON(ORDERS_FILE, []);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return res.status(404).json({ error: "order not found" });
  orders[idx].status = "PAID";
  orders[idx].paidAt = new Date().toISOString();
  writeJSON(ORDERS_FILE, orders);
  res.json(orders[idx]);
});

app.get("/api/orders/:id", (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "not found" });
  res.json(order);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running http://localhost:${PORT}`);
});
