import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';

export class NeonStore {
  private sql: ReturnType<typeof neon>;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  // Auth methods
  async login(email: string, name: string) {
    try {
      // Check if user exists
      const users = await this.sql`
        SELECT * FROM users WHERE email = ${email}
      `;

      if (users.length > 0) {
        return {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name,
          role: users[0].role,
          storeId: users[0].store_id,
          createdAt: Number(users[0].created_at)
        };
      }

      // Create new user
      const id = randomUUID();
      const now = Date.now();
      
      await this.sql`
        INSERT INTO users (id, email, name, role, created_at)
        VALUES (${id}, ${email}, ${name}, 'owner', ${now})
      `;

      return {
        id,
        email,
        name,
        role: 'owner',
        storeId: null,
        createdAt: now
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // User methods
  async getUser(userId: string) {
    const users = await this.sql`SELECT * FROM users WHERE id = ${userId}`;
    if (users.length === 0) return null;
    
    return {
      id: users[0].id,
      email: users[0].email,
      name: users[0].name,
      role: users[0].role,
      storeId: users[0].store_id,
      createdAt: Number(users[0].created_at)
    };
  }

  async updateUser(userId: string, data: { name?: string; storeId?: string }) {
    if (data.name !== undefined && data.storeId !== undefined) {
      const result = await this.sql`
        UPDATE users 
        SET name = ${data.name}, store_id = ${data.storeId}
        WHERE id = ${userId}
        RETURNING *
      `;
      if (result.length === 0) return null;
      return {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        storeId: result[0].store_id,
        createdAt: Number(result[0].created_at)
      };
    } else if (data.name !== undefined) {
      const result = await this.sql`
        UPDATE users 
        SET name = ${data.name}
        WHERE id = ${userId}
        RETURNING *
      `;
      if (result.length === 0) return null;
      return {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        storeId: result[0].store_id,
        createdAt: Number(result[0].created_at)
      };
    } else if (data.storeId !== undefined) {
      const result = await this.sql`
        UPDATE users 
        SET store_id = ${data.storeId}
        WHERE id = ${userId}
        RETURNING *
      `;
      if (result.length === 0) return null;
      return {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        role: result[0].role,
        storeId: result[0].store_id,
        createdAt: Number(result[0].created_at)
      };
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
    `;

    await this.sql`
      UPDATE users SET store_id = ${id} WHERE id = ${ownerId}
    `;

    return { id, name, ownerId, createdAt: now };
  }

  async getStore(storeId: string) {
    const stores = await this.sql`SELECT * FROM stores WHERE id = ${storeId}`;
    if (stores.length === 0) return null;
    
    return {
      id: stores[0].id,
      name: stores[0].name,
      ownerId: stores[0].owner_id,
      createdAt: Number(stores[0].created_at)
    };
  }

  async updateStore(storeId: string, data: { name: string }) {
    await this.sql`
      UPDATE stores SET name = ${data.name} WHERE id = ${storeId}
    `;
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
    `;

    return { id, ...data, storeId, createdAt: now, updatedAt: now };
  }

  async getProducts(storeId: string) {
    const products = await this.sql`
      SELECT * FROM products WHERE store_id = ${storeId} ORDER BY updated_at DESC
    `;
    
    return products.map(p => ({
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
  }

  async getProduct(productId: string) {
    const products = await this.sql`SELECT * FROM products WHERE id = ${productId}`;
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
    `;

    return this.getProduct(productId);
  }

  async deleteProduct(productId: string) {
    await this.sql`DELETE FROM products WHERE id = ${productId}`;
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
    `;

    return { id, ...data, storeId, createdAt: now };
  }

  async getTransactions(storeId: string, filters?: any) {
    let transactions;

    if (filters?.type && filters?.limit) {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId} AND type = ${filters.type}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      `;
    } else if (filters?.type) {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId} AND type = ${filters.type}
        ORDER BY created_at DESC
      `;
    } else if (filters?.limit) {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      `;
    } else {
      transactions = await this.sql`
        SELECT * FROM transactions 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
      `;
    }
    
    return transactions.map(t => ({
      id: t.id,
      storeId: t.store_id,
      type: t.type,
      items: JSON.parse(t.items_json),
      totalAmount: Number(t.total_amount),
      cashierId: t.cashier_id,
      notes: t.notes,
      createdAt: Number(t.created_at)
    }));
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
    `;

    // Update product stock
    if (data.type === 'in') {
      await this.sql`
        UPDATE products SET stock = stock + ${data.quantity}
        WHERE id = ${data.productId}
      `;
    } else if (data.type === 'out') {
      await this.sql`
        UPDATE products SET stock = stock - ${data.quantity}
        WHERE id = ${data.productId}
      `;
    }

    return { id, ...data, storeId, createdAt: now };
  }

  async getStockMovements(storeId: string, filters?: any) {
    let movements;

    if (filters?.productId && filters?.limit) {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId} AND product_id = ${filters.productId}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      `;
    } else if (filters?.productId) {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId} AND product_id = ${filters.productId}
        ORDER BY created_at DESC
      `;
    } else if (filters?.limit) {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
        LIMIT ${filters.limit}
      `;
    } else {
      movements = await this.sql`
        SELECT * FROM stock_movements 
        WHERE store_id = ${storeId}
        ORDER BY created_at DESC
      `;
    }
    
    return movements.map(m => ({
      id: m.id,
      storeId: m.store_id,
      productId: m.product_id,
      type: m.type,
      quantity: m.quantity,
      notes: m.notes,
      createdAt: Number(m.created_at)
    }));
  }

  // Analytics methods
  async getAnalytics(storeId: string, period: string) {
    // Simplified analytics - can be expanded
    const transactions = await this.getTransactions(storeId, { limit: 100 });
    const products = await this.getProducts(storeId);

    return {
      totalRevenue: transactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + t.totalAmount, 0),
      totalTransactions: transactions.length,
      totalProducts: products.length,
      lowStockProducts: products.filter(p => p.stock <= p.minimumStock).length
    };
  }
}
