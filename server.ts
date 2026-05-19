import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { createServer as createViteServer } from 'vite';
import NodeCache from 'node-cache';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Enable gzip compression for all responses
app.use(compression());
app.use(express.json({ limit: '1mb' }));

type SqlValue = string | number | null;

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeRequiredString(value: unknown, fieldName: string) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    const error = new Error(`${fieldName} wajib diisi`);
    Object.assign(error, { status: 400 });
    throw error;
  }
  return normalized;
}

function numberFrom(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rowToUser(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: row.role === 'cashier' ? 'cashier' : 'owner',
    storeId: row.storeId ? String(row.storeId) : undefined,
    createdAt: Number(row.createdAt),
  };
}

function rowToProduct(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    sellingPrice: Number(row.sellingPrice),
    purchasePrice: Number(row.purchasePrice),
    stock: Number(row.stock),
    minimumStock: Number(row.minimumStock),
    unitType: String(row.unitType),
    status: String(row.status),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

function rowToTransaction(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    type: row.type === 'stock_in' ? 'stock_in' : 'sale',
    items: JSON.parse(String(row.itemsJson || '[]')),
    totalAmount: Number(row.totalAmount),
    cashierId: String(row.cashierId),
    notes: String(row.notes || ''),
    createdAt: Number(row.createdAt),
  };
}

function rowToMovement(row: Record<string, SqlValue>) {
  return {
    id: String(row.id),
    productId: String(row.productId),
    type: row.type === 'stock_in' ? 'stock_in' : 'sale',
    quantity: Number(row.quantity),
    notes: String(row.notes || ''),
    createdAt: Number(row.createdAt),
  };
}

class SqlStore {
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

  private getCacheKey(prefix: string, ...args: (string | number | undefined)[]) {
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

  private query(sql: string, params: SqlValue[] = []) {
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

  private run(sql: string, params: SqlValue[] = []) {
    this.db.run(sql, params);
  }

  private one(sql: string, params: SqlValue[] = []) {
    return this.query(sql, params)[0];
  }

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
    const id = `user-${randomUUID()}`;
    this.run(
      `INSERT INTO users (id, email, name, role, created_at)
       VALUES (?, ?, ?, 'owner', ?)`,
      [id, email, name, now]
    );
    this.save();

    return {
      id,
      email,
      name,
      role: 'owner' as const,
      storeId: undefined,
      createdAt: now,
    };
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

    return {
      id: storeId,
      name,
      ownerId,
      createdAt: now,
    };
  }

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

  processTransaction(storeId: string, payload: Record<string, unknown>) {
    const cashierId = normalizeRequiredString(payload.cashierId, 'Kasir');
    const type = payload.type === 'stock_in' ? 'stock_in' : 'sale';
    const notes = normalizeOptionalString(payload.notes) ?? '';
    const totalAmount = numberFrom(payload.totalAmount);
    const items = Array.isArray(payload.items) ? payload.items : [];

    if (items.length === 0) {
      const error = new Error('Item transaksi masih kosong');
      Object.assign(error, { status: 400 });
      throw error;
    }

    const now = Date.now();
    const transactionId = `txn-${randomUUID()}`;

    this.run('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        const productId = normalizeRequiredString(item?.productId, 'Produk');
        const quantity = numberFrom(item?.quantity);

        if (quantity <= 0) {
          const error = new Error('Kuantitas harus lebih dari 0');
          Object.assign(error, { status: 400 });
          throw error;
        }

        const product = this.one(
          `SELECT id, name, stock
           FROM products
           WHERE store_id = ? AND id = ?`,
          [storeId, productId]
        );

        if (!product) {
          const error = new Error('Produk tidak ditemukan');
          Object.assign(error, { status: 404 });
          throw error;
        }

        const currentStock = Number(product.stock);
        if (type === 'sale' && currentStock < quantity) {
          const error = new Error(`Stok tidak mencukupi untuk: ${String(product.name)}`);
          Object.assign(error, { status: 400 });
          throw error;
        }

        const newStock = type === 'sale' ? currentStock - quantity : currentStock + quantity;
        this.run(
          `UPDATE products
           SET stock = ?, updated_at = ?
           WHERE store_id = ? AND id = ?`,
          [newStock, now, storeId, productId]
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
}

async function createSqlStore() {
  const databasePath = path.join(__dirname, 'data', 'lares.sqlite');
  const wasmPath = path.join(__dirname, 'node_modules', 'sql.js', 'dist');
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(wasmPath, file),
  });
  const db = fs.existsSync(databasePath)
    ? new SQL.Database(fs.readFileSync(databasePath))
    : new SQL.Database();

  return new SqlStore(db, databasePath);
}

function registerApiRoutes(store: SqlStore) {
  // Performance monitoring middleware
  app.use('/api', (req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
      
      // Log slow queries (> 100ms)
      if (duration > 100) {
        console.warn(`[SLOW] ${req.method} ${req.path} - ${duration}ms`);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  });

  // Request logging
  app.use('/api', (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  app.post('/api/auth/login', (req, res) => {
    res.json(store.login(req.body.email, req.body.name));
  });

  app.get('/api/users/:userId', (req, res) => {
    const user = store.getUser(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  });

  app.patch('/api/users/:userId', (req, res) => {
    const user = store.updateUser(req.params.userId, req.body);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  });

  app.post('/api/stores', (req, res) => {
    res.status(201).json(store.createStore(req.body.name, req.body.ownerId));
  });

  app.get('/api/stores/:storeId/products', (req, res) => {
    res.json(store.listProducts(req.params.storeId));
  });

  app.post('/api/stores/:storeId/products', (req, res) => {
    res.status(201).json({ id: store.addProduct(req.params.storeId, req.body) });
  });

  app.patch('/api/stores/:storeId/products/:productId', (req, res) => {
    store.updateProduct(req.params.storeId, req.params.productId, req.body);
    res.status(204).end();
  });

  app.get('/api/stores/:storeId/transactions', (req, res) => {
    res.json(store.listTransactions(req.params.storeId, req.query.limit));
  });

  app.post('/api/stores/:storeId/transactions/process', (req, res) => {
    res.status(201).json({ id: store.processTransaction(req.params.storeId, req.body) });
  });

  app.get('/api/stores/:storeId/stock-movements', (req, res) => {
    res.json(store.listMovements(req.params.storeId, req.query.limit));
  });

  // Performance monitoring endpoint
  app.get('/api/health', (req, res) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
      status: 'healthy',
      uptime: Math.floor(uptime),
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', (error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(error.status ?? 500).json({ message: error.message || 'Server error' });
  });
}

async function registerFrontend() {
  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    return;
  }

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const store = await createSqlStore();
registerApiRoutes(store);
await registerFrontend();

app.listen(port, '0.0.0.0', () => {
  console.log(`Lares app running on http://localhost:${port}`);
  console.log(`SQL database: ${path.join(__dirname, 'data', 'lares.sqlite')}`);
});
