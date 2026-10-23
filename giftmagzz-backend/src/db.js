import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const dataDir=path.resolve(here,"../data");
fs.mkdirSync(dataDir,{recursive:true});
const db=new Database(path.join(dataDir,"giftmagzz.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE COLLATE NOCASE,mobile TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(datetime('now')));
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT NOT NULL UNIQUE,user_id INTEGER NOT NULL,pages INTEGER NOT NULL,theme TEXT NOT NULL,magazine_price INTEGER NOT NULL,shipping INTEGER NOT NULL DEFAULT 150,total INTEGER NOT NULL,advance INTEGER NOT NULL,remaining INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'Pending confirmation',payment_status TEXT NOT NULL DEFAULT 'Advance pending',created_at TEXT NOT NULL DEFAULT(datetime('now')),FOREIGN KEY(user_id) REFERENCES users(id));
`);
export default db;
