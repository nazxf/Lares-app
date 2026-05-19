import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Database } from 'sql.js';
import NodeCache from 'node-cache';
import { normalizeOptionalString, normalizeRequiredString, numberFrom } from './validators.js';
import { rowToUser, rowToProduct, rowToTransaction, rowToMovement } from './mappers.js';

type SqlValue = string | number | null;

export class SqlStore {
  private db: Database;
  private dbPath: string;
  private cache: NodeCache;

  constructor(db: Database, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
    // Cache with 5 minute TTL, check expired keys every 2 minutes
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
    this.createSchema();
  }

  private createSchema() {
    // Performance optimizations for SQLite
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = -64000;
      PRAGMA temp_store = MEMORY;
      PRAGMA mmap_size = 30000000000;
      PRAGMA page_size = 4096;
      PRAGMA auto_vacuum = INCREMENTAL;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'owner',
        store_id TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        selling_price INTEGER NOT NULL DEFAULT 0,
        purchase_price INTEGER NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        minimum_stock INTEGER NOT NULL DEFAULT 1,
        unit_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        type TEXT NOT NULL,
        items_json TEXT NOT NULL,
        total_amount INTEGER NOT NULL DEFAULT 0,
        cashier_id TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      -- Performance indexes for faster queries
      CREATE INDEX IF NOT EXISTS idx_products_store_name ON products(store_id, name);
      CREATE INDEX IF NOT EXISTS idx_products_store_category ON products(store_id, category);
      CREATE INDEX IF NOT EXISTS idx_products_store_status ON products(store_id, status);
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
      CREATE INDEX IF NOT EXISTS idx_products_store_updated ON products(store_id, updated_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_transactions_store_created ON transactions(store_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_store_type ON transactions(store_id, type);
      CREATE INDEX IF NOT EXISTS idx_transactions_cashier ON transactions(cashier_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_type_created ON transactions(type, created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_movements_store_created ON stock_movements(store_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_movements_store_type ON stock_movements(store_id, type);
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    this.save();
  }

  private save() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    fs.writeFileSync(this.dbPath, Buffer.from(this.db.export()));
    // Clear cache when database is modified
    this.cache.flushAll();
  }

  private getCacheKey(prefix: string, ...args: (string | number | undefined)[]): string {
    return `${prefix}:${args.filter(Boolean).join(':')}`;
  }

  private getCached<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  private setCached<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl || 300);
  }

  private invalidateCache(pattern: string): void {
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.startsWith(pattern)) {
        this.cache.del(key);
      }
    });
  }

  private query(sql: string, params: SqlValue[] = []): Record<string, SqlValue>[] {
    const statement = this.db.prepare(sql);
    const rows: Record<string, SqlValue>[] = [];

    try {
      statement.bind(params);
      while (statement.step()) {
        rows.push(statement.getAsObject() as Record<string, SqlValue>);
      }
    } finally {
      statement.free();
    }

    return rows;
  }

  private run(sql: string, params: SqlValue[] = []): void {
    this.db.run(sql, params);
  }

  private one(sql: string, params: SqlValue[] = []): Record<string, SqlValue> | undefined {
    return this.query(sql, params)[0];
  }

  // User methods
  login(emailInput: unknown, nameInput: unknown) {
    const email = normalizeRequiredString(emailInput, 'Email').toLowerCase();
    const fallbackName = email.split('@')[0] || 'User';
    const name = normalizeOptionalString(nameInput) ?? fallbackName;

    const existing = this.one(
      `SELECT id, email, name, role, store_id as storeId, created_at as createdAt
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (existing) {
      return rowToUser(existing);
    }

    const now = Date.now();
    const userId = `user-${randomUUID()}`;
    this.run(
      `INSERT INTO users (id, email, name, role, created_at)
       VALUES (?, ?, ?, 'owner', ?)`,
      [userId, email, name, now]
    );
    this.save();

    return this.getUser(userId);
  }

  getUser(userId: string) {
    const cacheKey = this.getCacheKey('user', userId);
    const cached = this.getCached<ReturnType<typeof rowToUser>>(cacheKey);
    if (cached) return cached;

    const row = this.one(
      `SELECT id, email, name, role, store_id as storeId, created_at as createdAt
       FROM users
       WHERE id = ?`,
      [userId]
    );

    const result = row ? rowToUser(row) : null;
    if (result) {
      this.setCached(cacheKey, result);
    }
    return result;
  }

  updateUser(userId: string, updates: Record<string, unknown>) {
    const current = this.getUser(userId);
    if (!current) return null;

    const nextName = normalizeOptionalString(updates.name) ?? current.name;
    const nextStoreId = normalizeOptionalString(updates.storeId) ?? current.storeId ?? null;

    this.run(
      `UPDATE users
       SET name = ?, store_id = ?
       WHERE id = ?`,
      [nextName, nextStoreId, userId]
    );
    this.invalidateCache('user');
    this.save();

    return this.getUser(userId);
  }

  // Store methods
  createStore(nameInput: unknown, ownerIdInput: unknown) {
    const name = normalizeRequiredString(nameInput, 'Nama toko');
    const ownerId = normalizeRequiredString(ownerIdInput, 'Owner');

    if (!this.getUser(ownerId)) {
      const error = new Error('User tidak ditemukan');
      Object.assign(error, { status: 404 });
      throw error;
    }

    const now = Date.now();
    const storeId = `store-${randomUUID()}`;
    this.run('BEGIN TRANSACTION');
    try {
      this.run(
        `INSERT INTO stores (id, name, owner_id, created_at)
         VALUES (?, ?, ?, ?)`,
        [storeId, name, ownerId, now]
      );
      this.run(
        `UPDATE users
         SET store_id = ?
         WHERE id = ?`,
        [storeId, ownerId]
      );
      this.run('COMMIT');
      this.save();
    } catch (error) {
      this.run('ROLLBACK');
      throw error;
    }

    return { id: storeId, name, ownerId, createdAt: now };
  }

  // Product methods
  listProducts(storeId: string) {
    const cacheKey = this.getCacheKey('products', storeId);
    const cached = this.getCached<ReturnType<typeof rowToProduct>[]>(cacheKey);
    if (cached) return cached;

    const products = this.query(
      `SELECT id, name, category, selling_price as sellingPrice,
              purchase_price as purchasePrice, stock, minimum_stock as minimumStock,
              unit_type as unitType, status, created_at as createdAt,
              updated_at as updatedAt
       FROM products
       WHERE store_id = ?
       ORDER BY name ASC`,
      [storeId]
    ).map(rowToProduct);

    this.setCached(cacheKey, products);
    return products;
  }

  addProduct(storeId: string, data: Record<string, unknown>) {
    const now = Date.now();
    const productId = `prod-${randomUUID()}`;
    const product = {
      name: normalizeRequiredString(data.name, 'Nama produk'),
      category: normalizeOptionalString(data.category) ?? 'Water',
      sellingPrice: numberFrom(data.sellingPrice),
      purchasePrice: numberFrom(data.purchasePrice),
      stock: numberFrom(data.stock),
      minimumStock: Math.max(1, numberFrom(data.minimumStock, 1)),
      unitType: normalizeOptionalString(data.unitType) ?? 'Unit',
      status: normalizeOptionalString(data.status) ?? 'active',
    };

    this.run(
      `INSERT INTO products (
        id, store_id, name, category, selling_price, purchase_price, stock,
        minimum_stock, unit_type, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        storeId,
        product.name,
        product.category,
        product.sellingPrice,
        product.purchasePrice,
        product.stock,
        product.minimumStock,
        product.unitType,
        product.status,
        now,
        now,
      ]
    );
    this.invalidateCache('products');
    this.save();

    return productId;
  }

  updateProduct(storeId: string, productId: string, data: Record<string, unknown>) {
    const current = this.one(
      `SELECT id
       FROM products
       WHERE store_id = ? AND id = ?`,
      [storeId, productId]
    );

    if (!current) {
      const error = new Error('Produk tidak ditemukan');
      Object.assign(error, { status: 404 });
      throw error;
    }

    this.run(
      `UPDATE products
       SET name = ?, category = ?, selling_price = ?, purchase_price = ?, stock = ?,
           minimum_stock = ?, unit_type = ?, status = ?, updated_at = ?
       WHERE store_id = ? AND id = ?`,
      [
        normalizeRequiredString(data.name, 'Nama produk'),
        normalizeOptionalString(data.category) ?? 'Water',
        numberFrom(data.sellingPrice),
        numberFrom(data.purchasePrice),
        numberFrom(data.stock),
        Math.max(1, numberFrom(data.minimumStock, 1)),
        normalizeOptionalString(data.unitType) ?? 'Unit',
        normalizeOptionalString(data.status) ?? 'active',
        Date.now(),
        storeId,
        productId,
      ]
    );
    this.invalidateCache('products');
    this.save();
  }

  // Transaction methods
  listTransactions(storeId: string, limitInput: unknown) {
    const limit = Math.min(Math.max(numberFrom(limitInput, 50), 1), 500);
    return this.query(
      `SELECT id, type, items_json as itemsJson, total_amount as totalAmount,
              cashier_id as cashierId, notes, created_at as createdAt
       FROM transactions
       WHERE store_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [storeId, limit]
    ).map(rowToTransaction);
  }

  processTransaction(storeId: string, data: Record<string, unknown>) {
    const cashierId = normalizeRequiredString(data.cashierId, 'Cashier ID');
    const type = normalizeRequiredString(data.type, 'Tipe transaksi');
    const items = data.items as any[];
    const totalAmount = numberFrom(data.totalAmount);
    const notes = normalizeOptionalString(data.notes) ?? '';

    if (!['sale', 'stock_in'].includes(type)) {
      const error = new Error('Tipe transaksi tidak valid');
      Object.assign(error, { status: 400 });
      throw error;
    }

    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Items tidak boleh kosong');
      Object.assign(error, { status: 400 });
      throw error;
    }

    const now = Date.now();
    const transactionId = `txn-${randomUUID()}`;

    this.run('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        const productId = String(item.productId);
        const quantity = Number(item.quantity);
        const price = Number(item.price);

        const product = this.one(
          `SELECT stock FROM products WHERE id = ? AND store_id = ?`,
          [productId, storeId]
        );

        if (!product) {
          throw new Error(`Produk ${productId} tidak ditemukan`);
        }

        const currentStock = Number(product.stock);
        const newStock = type === 'sale' ? currentStock - quantity : currentStock + quantity;

        if (type === 'sale' && newStock < 0) {
          throw new Error(`Stok produk ${productId} tidak mencukupi`);
        }

        this.run(
          `UPDATE products SET stock = ?, updated_at = ? WHERE id = ?`,
          [newStock, now, productId]
        );

        this.run(
          `INSERT INTO stock_movements (id, store_id, product_id, type, quantity, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `mov-${randomUUID()}`,
            storeId,
            productId,
            type,
            quantity,
            notes || (type === 'sale' ? 'Penjualan kasir' : 'Barang masuk'),
            now,
          ]
        );
      }

      this.run(
        `INSERT INTO transactions (id, store_id, type, items_json, total_amount, cashier_id, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, storeId, type, JSON.stringify(items), totalAmount, cashierId, notes, now]
      );

      this.run('COMMIT');
      this.save();
    } catch (error) {
      this.run('ROLLBACK');
      throw error;
    }

    return transactionId;
  }

  // Stock movement methods
  listMovements(storeId: string, limitInput: unknown) {
    const limit = Math.min(Math.max(numberFrom(limitInput, 100), 1), 500);
    return this.query(
      `SELECT id, product_id as productId, type, quantity, notes, created_at as createdAt
       FROM stock_movements
       WHERE store_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [storeId, limit]
    ).map(rowToMovement);
  }
}
