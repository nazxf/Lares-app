import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import NodeCache from 'node-cache';
import { normalizeOptionalString, normalizeRequiredString, numberFrom } from './validators.js';
import { rowToUser, rowToProduct, rowToTransaction, rowToMovement } from './mappers.js';

type SqlValue = string | number | null;

export class PostgresStore {
  private sql: ReturnType<typeof neon>;
  private cache: NodeCache;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
    // Cache with 5 minute TTL, check expired keys every 2 minutes
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
  }

  async createSchema() {
    await this.sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'owner',
        store_id TEXT,
        created_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );

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

      CREATE INDEX IF NOT EXISTS idx_products_store_name ON products(store_id, name);
      CREATE INDEX IF NOT EXISTS idx_products_store_category ON products(store_id, category);
      CREATE INDEX IF NOT EXISTS idx_products_store_status ON products(store_id, status);
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
      CREATE INDEX IF NOT EXISTS idx_products_store_updated ON products(store_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_store_created ON transactions(store_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_store_type ON transactions(store_id, type);
      CREATE INDEX IF NOT EXISTS idx_movements_store_created ON stock_movements(store_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
    `;
  }

  // Auth methods
  login(email: string, name: string) {
    const cacheKey = `user:${email}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = this.sql`
      SELECT * FROM users WHERE email = ${email}
    `.then((rows: any[]) => {
      if (rows.length === 0) {
        const id = randomUUID();
        const now = Date.now();
        return this.sql`
          INSERT INTO users (id, email, name, role, created_at)
          VALUES (${id}, ${email}, ${name}, 'owner', ${now})
          RETURNING *
        `.then(newRows => {
          const user = rowToUser(newRows[0]);
          this.cache.set(cacheKey, user);
          return user;
        });
      }
      const user = rowToUser(rows[0]);
      this.cache.set(cacheKey, user);
      return user;
    });

    return result;
  }

  // User methods
  async getUser(userId: string) {
    const cacheKey = `user:id:${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const rows = await this.sql`SELECT * FROM users WHERE id = ${userId}` as any[];
    if (rows.length === 0) return null;
    
    const user = rowToUser(rows[0]);
    this.cache.set(cacheKey, user);
    return user;
  }

  async updateUser(userId: string, data: { name?: string; storeId?: string }) {
    const updates: string[] = [];
    const values: SqlValue[] = [];

    if (data.name !== undefined) {
      updates.push('name = $' + (values.length + 1));
      values.push(data.name);
    }
    if (data.storeId !== undefined) {
      updates.push('store_id = $' + (values.length + 1));
      values.push(data.storeId);
    }

    if (updates.length === 0) return this.getUser(userId);

    values.push(userId);
    const rows = await this.sql`
      UPDATE users 
      SET ${this.sql.unsafe(updates.join(', '))}
      WHERE id = ${userId}
      RETURNING *
    ` as any[];

    this.cache.del(`user:id:${userId}`);
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  }

  // Store methods
  async createStore(name: string, ownerId: string) {
    const id = randomUUID();
    const now = Date.now();

    const rows = await this.sql`
      INSERT INTO stores (id, name, owner_id, created_at)
      VALUES (${id}, ${name}, ${ownerId}, ${now})
      RETURNING *
    ` as any[];

    await this.sql`
      UPDATE users SET store_id = ${id} WHERE id = ${ownerId}
    `;

    this.cache.del(`user:id:${ownerId}`);
    return { id, name, ownerId, createdAt: now };
  }

  async getStore(storeId: string) {
    const rows = await this.sql`SELECT * FROM stores WHERE id = ${storeId}` as any[];
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      createdAt: Number(row.created_at)
    };
  }

  // Product methods - implement similar pattern for all other methods
  // ... (continuing with other methods)
}

// Export both for compatibility
export { PostgresStore as SqlStore };

