import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import { cache } from './redis.js';
import { buildDashboardSummary, getDashboardRange } from './dashboard-summary.js';

export class NeonStore {
  private sql: ReturnType<typeof neon>;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  private async invalidateStoreData(storeId: string) {
    await cache.del(`products:${storeId}`);
    await cache.delPattern(`transactions:${storeId}:*`);
    await cache.delPattern(`movements:${storeId}:*`);
    await cache.delPattern(`analytics:${storeId}:*`);
    await cache.delPattern(`dashboard:${storeId}:*`);
  }

  // Auth methods
  async login(email: string, name: string) {
    try {
      // Check cache first
      const cacheKey = `user:email:${email}`;
      const cached = await cache.get<any>(cacheKey);
      if (cached) return cached;

      // Check if user exists
      const users = await this.sql`
        SELECT * FROM users WHERE email = ${email}
      ` as any[];

      if (users.length > 0) {
        const user = {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name,
          role: users[0].role,
          storeId: users[0].store_id,
          createdAt: Number(users[0].created_at)
        };
        
        // Cache for 5 minutes
        await cache.set(cacheKey, user, 300);
        await cache.set(`user:id:${user.id}`, user, 300);
        
        return user;
      }

      // Create new user
      const id = randomUUID();
      const now = Date.now();
      
      await this.sql`
        INSERT INTO users (id, email, name, role, created_at)
        VALUES (${id}, ${email}, ${name}, 'owner', ${now})
      `;

      const newUser = {
        id,
        email,
        name,
        role: 'owner' as const,
        storeId: null,
        createdAt: now
      };

      // Cache new user
      await cache.set(cacheKey, newUser, 300);
      await cache.set(`user:id:${id}`, newUser, 300);

      return newUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // User methods
  async getUser(userId: string) {
    // Check cache first
    const cacheKey = `user:id:${userId}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const users = await this.sql`SELECT * FROM users WHERE id = ${userId}` as any[];
    if (users.length === 0) return null;
    
    const user = {
      id: users[0].id,
      email: users[0].email,
      name: users[0].name,
      role: users[0].role,
      storeId: users[0].store_id,
      createdAt: Number(users[0].created_at)
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, user, 300);
    
    return user;
  }

  async updateUser(userId: string, data: { name?: string; storeId?: string }) {
    if (data.name !== undefined && data.storeId !== undefined) {
      const result = await this.sql`
        UPDATE users 
        SET name = ${data.name}, store_id = ${data.storeId}
        WHERE id = ${userId}
        RETURNING *
      ` as any[];
      if (result.length === 0) return null;
      
      const user = {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        storeId: result[0].store_id,
        createdAt: Number(result[0].created_at)
      };

      // Invalidate cache
      await cache.del(`user:id:${userId}`);
      await cache.del(`user:email:${user.email}`);
      
      return user;
    } else if (data.name !== undefined) {
      const result = await this.sql`
        UPDATE users 
        SET name = ${data.name}
        WHERE id = ${userId}
        RETURNING *
      ` as any[];
      if (result.length === 0) return null;
      
      const user = {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        storeId: result[0].store_id,
        createdAt: Number(result[0].created_at)
      };

      // Invalidate cache
      await cache.del(`user:id:${userId}`);
      await cache.del(`user:email:${user.email}`);
      
      return user;
    } else if (data.storeId !== undefined) {
      const result = await this.sql`
        UPDATE users 
        SET store_id = ${data.storeId}
        WHERE id = ${userId}
        RETURNING *
      ` as any[];
      if (result.length === 0) return null;
      
      const user = {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        storeId: result[0].store_id,
        createdAt: Number(result[0].created_at)
      };

      // Invalidate cache
      await cache.del(`user:id:${userId}`);
      await cache.del(`user:email:${user.email}`);
      
      return user;
    }

    return this.getUser(userId);
  }

  // Store methods
  async createStore(name: string, ownerId: string) {
    const id = randomUUID();
    const now = Date.now();

    await this.sql`
      INSERT INTO stores (id, name, owner_id, created_at)
      VALUES (${id}, ${name}, ${ownerId}, ${now})
    ` as any[];

    await this.sql`
      UPDATE users SET store_id = ${id} WHERE id = ${ownerId}
    ` as any[];

    // Invalidate user cache
    await cache.del(`user:id:${ownerId}`);

    return { id, name, ownerId, createdAt: now };
  }

  async getStore(storeId: string) {
    // Check cache first
    const cacheKey = `store:${storeId}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const stores = await this.sql`SELECT * FROM stores WHERE id = ${storeId}` as any[];
    if (stores.length === 0) return null;
    
    const store = {
      id: stores[0].id,
      name: stores[0].name,
      ownerId: stores[0].owner_id,
      createdAt: Number(stores[0].created_at)
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, store, 600);
    
    return store;
  }

  async updateStore(storeId: string, data: { name: string }) {
    await this.sql`
      UPDATE stores SET name = ${data.name} WHERE id = ${storeId}
    ` as any[];
    
    // Invalidate cache
    await cache.del(`store:${storeId}`);
    
    return this.getStore(storeId);
  }

  // Product methods
  async createProduct(storeId: string, data: any) {
    const id = randomUUID();
    const now = Date.now();

    await this.sql`
      INSERT INTO products (
        id, store_id, name, category, selling_price, purchase_price,
        stock, minimum_stock, unit_type, status, created_at, updated_at
      ) VALUES (
        ${id}, ${storeId}, ${data.name}, ${data.category},
        ${data.sellingPrice}, ${data.purchasePrice}, ${data.stock},
        ${data.minimumStock || 1}, ${data.unitType}, ${data.status || 'active'},
        ${now}, ${now}
      )
    ` as any[];

    await this.invalidateStoreData(storeId);

    return { id, ...data, storeId, createdAt: now, updatedAt: now };
  }

  async getProducts(storeId: string) {
    // Check cache first - CRITICAL for performance
    const cacheKey = `products:${storeId}`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const products = await this.sql`
      SELECT * FROM products WHERE store_id = ${storeId} ORDER BY updated_at DESC
    ` as any[];
    
    const result = products.map(p => ({
      id: p.id,
      storeId: p.store_id,
      name: p.name,
      category: p.category,
      sellingPrice: Number(p.selling_price),
      purchasePrice: Number(p.purchase_price),
      stock: p.stock,
      minimumStock: p.minimum_stock,
      unitType: p.unit_type,
      status: p.status,
      createdAt: Number(p.created_at),
      updatedAt: Number(p.updated_at)
    }));

    // Cache for 2 minutes (products change frequently)
    await cache.set(cacheKey, result, 120);
    
    return result;
  }

  async getProduct(productId: string) {
    const products = await this.sql`SELECT * FROM products WHERE id = ${productId}` as any[];
    if (products.length === 0) return null;
    
    const p = products[0];
    return {
      id: p.id,
      storeId: p.store_id,
      name: p.name,
      category: p.category,
      sellingPrice: Number(p.selling_price),
      purchasePrice: Number(p.purchase_price),
      stock: p.stock,
      minimumStock: p.minimum_stock,
      unitType: p.unit_type,
      status: p.status,
      createdAt: Number(p.created_at),
      updatedAt: Number(p.updated_at)
    };
  }

  async updateProduct(productId: string, data: any) {
    const now = Date.now();
    
    await this.sql`
      UPDATE products SET
        name = ${data.name},
        category = ${data.category},
        selling_price = ${data.sellingPrice},
        purchase_price = ${data.purchasePrice},
        stock = ${data.stock},
        minimum_stock = ${data.minimumStock},
        unit_type = ${data.unitType},
        status = ${data.status},
        updated_at = ${now}
      WHERE id = ${productId}
    ` as any[];

    const product = await this.getProduct(productId);
    
    if (product) {
      await this.invalidateStoreData(product.storeId);
    }

    return product;
  }

  async deleteProduct(productId: string) {
    const product = await this.getProduct(productId);
    
    await this.sql`DELETE FROM products WHERE id = ${productId}` as any[];
    
    if (product) {
      await this.invalidateStoreData(product.storeId);
    }
    
    return { success: true };
  }

  // Transaction methods
  async createTransaction(storeId: string, data: any) {
    const id = randomUUID();
    const now = Date.now();

    await this.sql`
      INSERT INTO transactions (
        id, store_id, type, items_json, total_amount, cashier_id, notes, created_at
      ) VALUES (
        ${id}, ${storeId}, ${data.type}, ${JSON.stringify(data.items)},
        ${data.totalAmount}, ${data.cashierId}, ${data.notes || null}, ${now}
      )
    ` as any[];

    await this.invalidateStoreData(storeId);

    return { id, ...data, storeId, createdAt: now };
  }

  async getTransactions(storeId: string, filters?: any) {
    // Cache key based on filters
    const cacheKey = `transactions:${storeId}:${filters?.type || 'all'}:${filters?.limit || 50}`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) return cached;

    let transactions;

    if (filters?.type && filters?.limit) {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId} AND type = ${filters.type}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      ` as any[];
    } else if (filters?.type) {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId} AND type = ${filters.type}
        ORDER BY created_at DESC
      ` as any[];
    } else if (filters?.limit) {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      ` as any[];
    } else {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
      ` as any[];
    }
    
    const result = transactions.map(t => ({
      id: t.id,
      storeId: t.store_id,
      type: t.type,
      items: JSON.parse(t.items_json),
      totalAmount: Number(t.total_amount),
      cashierId: t.cashier_id,
      notes: t.notes,
      createdAt: Number(t.created_at)
    }));

    // Cache for 1 minute
    await cache.set(cacheKey, result, 60);
    
    return result;
  }

  async processTransaction(storeId: string, data: any) {
    const id = randomUUID();
    const now = Date.now();
    const type = data.type;
    const items = Array.isArray(data.items) ? data.items : [];

    if (!['sale', 'stock_in'].includes(type)) {
      throw new Error('Tipe transaksi tidak valid');
    }

    if (items.length === 0) {
      throw new Error('Items tidak boleh kosong');
    }

    for (const item of items) {
      const productId = String(item.productId);
      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Jumlah item tidak valid');
      }

      const products = await this.sql`
        SELECT stock FROM products WHERE id = ${productId} AND store_id = ${storeId}
      ` as any[];

      if (products.length === 0) {
        throw new Error(`Produk ${productId} tidak ditemukan`);
      }

      const currentStock = Number(products[0].stock);
      const nextStock = type === 'sale' ? currentStock - quantity : currentStock + quantity;

      if (type === 'sale' && nextStock < 0) {
        throw new Error(`Stok produk ${productId} tidak mencukupi`);
      }

      await this.sql`
        UPDATE products
        SET stock = ${nextStock}, updated_at = ${now}
        WHERE id = ${productId} AND store_id = ${storeId}
      ` as any[];

      await this.sql`
        INSERT INTO stock_movements (id, store_id, product_id, type, quantity, notes, created_at)
        VALUES (
          ${randomUUID()},
          ${storeId},
          ${productId},
          ${type},
          ${quantity},
          ${data.notes || (type === 'sale' ? 'Penjualan kasir' : 'Barang masuk')},
          ${now}
        )
      ` as any[];
    }

    await this.sql`
      INSERT INTO transactions (
        id, store_id, type, items_json, total_amount, cashier_id, notes, created_at
      ) VALUES (
        ${id}, ${storeId}, ${type}, ${JSON.stringify(items)},
        ${data.totalAmount}, ${data.cashierId}, ${data.notes || null}, ${now}
      )
    ` as any[];

    await this.invalidateStoreData(storeId);

    return { id, ...data, storeId, createdAt: now };
  }

  // Stock movement methods
  async createStockMovement(storeId: string, data: any) {
    const id = randomUUID();
    const now = Date.now();

    await this.sql`
      INSERT INTO stock_movements (
        id, store_id, product_id, type, quantity, notes, created_at
      ) VALUES (
        ${id}, ${storeId}, ${data.productId}, ${data.type},
        ${data.quantity}, ${data.notes || null}, ${now}
      )
    ` as any[];

    // Update product stock
    if (data.type === 'in') {
      await this.sql`
        UPDATE products SET stock = stock + ${data.quantity}
        WHERE id = ${data.productId}
      ` as any[];
    } else if (data.type === 'out') {
      await this.sql`
        UPDATE products SET stock = stock - ${data.quantity}
        WHERE id = ${data.productId}
      ` as any[];
    }

    await this.invalidateStoreData(storeId);

    return { id, ...data, storeId, createdAt: now };
  }

  async getStockMovements(storeId: string, filters?: any) {
    // Cache key based on filters
    const cacheKey = `movements:${storeId}:${filters?.productId || 'all'}:${filters?.limit || 50}`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) return cached;

    let movements;

    if (filters?.productId && filters?.limit) {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId} AND product_id = ${filters.productId}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      ` as any[];
    } else if (filters?.productId) {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId} AND product_id = ${filters.productId}
        ORDER BY created_at DESC
      ` as any[];
    } else if (filters?.limit) {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      ` as any[];
    } else {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
      ` as any[];
    }
    
    const result = movements.map(m => ({
      id: m.id,
      storeId: m.store_id,
      productId: m.product_id,
      type: m.type,
      quantity: m.quantity,
      notes: m.notes,
      createdAt: Number(m.created_at)
    }));

    // Cache for 1 minute
    await cache.set(cacheKey, result, 60);
    
    return result;
  }

  async getDashboardSummary(storeId: string, timezoneOffset = 0) {
    const { weekStart, tomorrowStart } = getDashboardRange(timezoneOffset);
    const cacheKey = `dashboard:${storeId}:${timezoneOffset}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const products = await this.sql`
      SELECT id, name, category, stock, minimum_stock, unit_type
      FROM products
      WHERE store_id = ${storeId}
    ` as any[];

    const transactions = await this.sql`
      SELECT type, total_amount, created_at
      FROM transactions
      WHERE store_id = ${storeId}
        AND type = 'sale'
        AND created_at >= ${weekStart}
        AND created_at < ${tomorrowStart}
      ORDER BY created_at ASC
    ` as any[];

    const result = buildDashboardSummary(
      products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        stock: Number(product.stock),
        minimumStock: Number(product.minimum_stock),
        unitType: product.unit_type,
      })),
      transactions.map(transaction => ({
        type: transaction.type,
        totalAmount: Number(transaction.total_amount),
        createdAt: Number(transaction.created_at),
      })),
      timezoneOffset
    );

    await cache.set(cacheKey, result, 30);

    return result;
  }

  // Analytics methods
  async getAnalytics(storeId: string, period: string) {
    // Check cache first - analytics can be stale
    const cacheKey = `analytics:${storeId}:${period}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    // Simplified analytics - can be expanded
    const transactions = await this.getTransactions(storeId, { limit: 100 });
    const products = await this.getProducts(storeId);

    const result = {
      totalRevenue: transactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + t.totalAmount, 0),
      totalTransactions: transactions.length,
      totalProducts: products.length,
      lowStockProducts: products.filter(p => p.stock <= p.minimumStock).length
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);
    
    return result;
  }
}
