import { Database } from 'bun:sqlite';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

config();

const DATABASE_URL = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'database.sqlite');
const dbDir = path.dirname(DATABASE_URL);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DATABASE_URL, { create: true });

export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      url TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
}
