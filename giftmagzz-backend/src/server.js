import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import db from "./db.js";

const app = express();
const PORT = Number.parseInt(process.env.PORT || "5000", 10);

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error("Set a strong JWT_SECRET in production.");
}

const SECRET = process.env.JWT_SECRET || "local-development-secret-change-before-deployment";
const origins = (process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500,http://localhost:5500,http://localhost:5173,https://giftmagzz.netlify.app")
  .split(",").map(x => x.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || origins.includes(origin)) return cb(null, true);
    return cb(new Error("Website origin is not allowed by GiftMagzz API."));
  }
}));
app.use(express.json({ limit: "30kb" }));

const PACKAGES = { 8: 700, 12: 800, 16: 900, 20: 1000 };
const THEMES = ["Swathi Magazine", "Anniversary", "Birthday", "Friends", "Rakhi", "Memories", "Farewell", "Father’s Day", "Couple", "Valentines", "You & Me"];
const clean = x => typeof x === "string" ? x.trim() : "";
const emailOk = x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, mobile: u.mobile });

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) return res.status(401).json({ message: "Please sign in to continue." });
  try {
    req.user = jwt.verify(t, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "GiftMagzz API" }));
app.get("/api/catalog", (_req, res) => res.json({ packages: PACKAGES, shipping: 150, themes: THEMES, cod: false, advancePercent: 50 }));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = clean(req.body?.name);
    const email = clean(req.body?.email).toLowerCase();
    const mobile = clean(req.body?.mobile);
    const password = req.body?.password;

    if (!name || name.length > 80) return res.status(400).json({ message: "Enter your name (maximum 80 characters)." });
    if (!emailOk(email) || email.length > 254) return res.status(400).json({ message: "Enter a valid email address." });
    if (!/^[0-9+ ()-]{10,18}$/.test(mobile)) return res.status(400).json({ message: "Enter a valid mobile number." });
    if (typeof password !== "string" || password.length < 8 || password.length > 72) return res.status(400).json({ message: "Password must be 8–72 characters." });

    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount) return res.status(409).json({ message: "This email is already registered. Please sign in." });

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      "INSERT INTO users(name,email,mobile,password_hash) VALUES($1,$2,$3,$4) RETURNING id,name,email,mobile",
      [name, email, mobile, hash]
    );
    const user = publicUser(result.rows[0]);
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "Account created.", user, token });
  } catch (err) { next(err); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const identifier = clean(req.body?.identifier || req.body?.email).toLowerCase();
    const password = req.body?.password;
    if (!identifier || typeof password !== "string") return res.status(400).json({ message: "Enter your email and password." });

    const result = await db.query("SELECT * FROM users WHERE email = $1", [identifier]);
    const userRow = result.rows[0];
    if (!userRow || !(await bcrypt.compare(password, userRow.password_hash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const user = publicUser(userRow);
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
    res.json({ message: "Signed in.", user, token });
  } catch (err) { next(err); }
});

app.get("/api/me", auth, async (req, res, next) => {
  try {
    const result = await db.query("SELECT id,name,email,mobile FROM users WHERE id = $1", [req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Account not found." });
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) { next(err); }
});

app.post("/api/orders", auth, async (req, res, next) => {
  try {
    const pages = Number(req.body?.pages);
    const theme = clean(req.body?.theme);
    if (!Object.hasOwn(PACKAGES, pages)) return res.status(400).json({ message: "Choose a valid page package." });
    if (!THEMES.includes(theme)) return res.status(400).json({ message: "Choose a valid theme." });
    if (req.body?.policyAccepted !== true) return res.status(400).json({ message: "Please accept the order policy." });

    const magazinePrice = PACKAGES[pages];
    const shipping = 150;
    const total = magazinePrice + shipping;
    const advance = Math.ceil(total / 2);
    const remaining = total - advance;
    const orderId = "GM-" + randomUUID().slice(0, 8).toUpperCase();

    const result = await db.query(
      `INSERT INTO orders(order_id,user_id,pages,theme,magazine_price,shipping,total,advance,remaining)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING order_id,pages,theme,magazine_price,shipping,total,advance,remaining,status,payment_status,created_at`,
      [orderId, req.user.id, pages, theme, magazinePrice, shipping, total, advance, remaining]
    );
    const o = result.rows[0];
    res.status(201).json({ message: "Order saved.", order: {
      orderId: o.order_id, pages: o.pages, theme: o.theme, magazinePrice: o.magazine_price,
      shipping: o.shipping, total: o.total, advance: o.advance, remaining: o.remaining,
      status: o.status, paymentStatus: o.payment_status, createdAt: o.created_at
    }});
  } catch (err) { next(err); }
});

app.get("/api/orders/my", auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT order_id AS "orderId",pages,theme,magazine_price AS "magazinePrice",
       shipping,total,advance,remaining,status,payment_status AS "paymentStatus",
       created_at AS "createdAt" FROM orders WHERE user_id = $1 ORDER BY id DESC`,
      [req.user.id]
    );
    res.json({ orders: result.rows });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error("GiftMagzz API error:", err.message);
  res.status(500).json({ message: "GiftMagzz server error. Please try again." });
});

app.listen(PORT, () => console.log(`GiftMagzz API listening on port ${PORT}`));
