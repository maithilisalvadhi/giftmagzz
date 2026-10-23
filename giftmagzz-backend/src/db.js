import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Configure it in your environment.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    pages INTEGER NOT NULL,
    theme TEXT NOT NULL,
    magazine_price INTEGER NOT NULL,
    shipping INTEGER NOT NULL DEFAULT 150,
    total INTEGER NOT NULL,
    advance INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending confirmation',
    payment_status TEXT NOT NULL DEFAULT 'Advance pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

export default pool;
