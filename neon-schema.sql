-- Neon Postgres Schema for Lares App
-- Compatible with existing SQLite structure
-- Run this in Neon SQL Editor: https://console.neon.tech

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  store_id TEXT,
  created_at BIGINT NOT NULL
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  selling_price BIGINT NOT NULL DEFAULT 0,
  purchase_price BIGINT NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 1,
  unit_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  type TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total_amount BIGINT NOT NULL DEFAULT 0,
  cashier_id TEXT NOT NULL,
  notes TEXT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_store_name ON products(store_id, name);
CREATE INDEX IF NOT EXISTS idx_products_store_category ON products(store_id, category);
CREATE INDEX IF NOT EXISTS idx_products_store_status ON products(store_id, status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_store_updated ON products(store_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_store_created ON transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_store_type ON transactions(store_id, type);
CREATE INDEX IF NOT EXISTS idx_movements_store_created ON stock_movements(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);

-- Success message
SELECT 'Database schema created successfully!' as message;
