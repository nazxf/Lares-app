import type { Express, Request, Response, NextFunction } from 'express';
import type { NeonStore } from './neon-store.js';

function parseLimit(value: unknown, fallback: number) {
  const limit = Number(value ?? fallback);
  if (!Number.isFinite(limit)) return fallback;
  return Math.min(Math.max(Math.trunc(limit), 1), 500);
}

function parseTimezoneOffset(value: unknown) {
  const offset = Number(value ?? 0);
  if (!Number.isFinite(offset)) return 0;
  return Math.min(Math.max(Math.trunc(offset), -840), 840);
}

async function listProducts(store: any, storeId: string) {
  if (typeof store.getProducts === 'function') return store.getProducts(storeId);
  return store.listProducts(storeId);
}

async function createProduct(store: any, storeId: string, body: any) {
  if (typeof store.createProduct === 'function') return store.createProduct(storeId, body);
  const id = store.addProduct(storeId, body);
  return { id };
}

async function updateProduct(store: any, storeId: string, productId: string, body: any) {
  if (store.updateProduct.length >= 3) return store.updateProduct(storeId, productId, body);
  return store.updateProduct(productId, body);
}

async function listTransactions(store: any, storeId: string, filters: any) {
  if (typeof store.getTransactions === 'function') return store.getTransactions(storeId, filters);
  return store.listTransactions(storeId, filters.limit);
}

async function processTransaction(store: any, storeId: string, body: any) {
  const result = await store.processTransaction(storeId, body);
  return typeof result === 'string' ? { id: result } : result;
}

async function createTransaction(store: any, storeId: string, body: any) {
  if (typeof store.createTransaction === 'function') return store.createTransaction(storeId, body);
  return processTransaction(store, storeId, body);
}

async function listStockMovements(store: any, storeId: string, filters: any) {
  if (typeof store.getStockMovements === 'function') return store.getStockMovements(storeId, filters);
  return store.listMovements(storeId, filters.limit);
}

export function registerApiRoutes(app: Express, store: any) {
  // Performance monitoring middleware
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(data: any) {
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
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Auth routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const user = await store.login(req.body.email, req.body.name);
      res.json(user);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed', message: error.message });
    }
  });

  // User routes
  app.get('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const user = await store.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const user = await store.updateUser(req.params.userId, req.body);
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Store routes
  app.post('/api/stores', async (req: Request, res: Response) => {
    try {
      const storeData = await store.createStore(req.body.name, req.body.ownerId);
      res.status(201).json(storeData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stores/:storeId', async (req: Request, res: Response) => {
    try {
      const storeData = await store.getStore(req.params.storeId);
      if (!storeData) return res.status(404).json({ message: 'Store tidak ditemukan' });
      res.json(storeData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Product routes
  app.get('/api/stores/:storeId/products', async (req: Request, res: Response) => {
    try {
      const products = await listProducts(store, req.params.storeId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stores/:storeId/products', async (req: Request, res: Response) => {
    try {
      const product = await createProduct(store, req.params.storeId, req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stores/:storeId/products/:productId', async (req: Request, res: Response) => {
    try {
      const product = await store.getProduct(req.params.productId);
      if (!product) return res.status(404).json({ message: 'Product tidak ditemukan' });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/stores/:storeId/products/:productId', async (req: Request, res: Response) => {
    try {
      const product = await updateProduct(store, req.params.storeId, req.params.productId, req.body);
      if (!product) return res.status(404).json({ message: 'Product tidak ditemukan' });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/stores/:storeId/products/:productId', async (req: Request, res: Response) => {
    try {
      await store.deleteProduct(req.params.productId);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction routes
  app.get('/api/stores/:storeId/transactions', async (req: Request, res: Response) => {
    try {
      const filters = {
        type: req.query.type as string,
        limit: req.query.limit ? parseLimit(req.query.limit, 50) : undefined
      };
      const transactions = await listTransactions(store, req.params.storeId, filters);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stores/:storeId/transactions', async (req: Request, res: Response) => {
    try {
      const transaction = await createTransaction(store, req.params.storeId, req.body);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stores/:storeId/transactions/process', async (req: Request, res: Response) => {
    try {
      const transaction = await processTransaction(store, req.params.storeId, req.body);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(error.status ?? 500).json({ error: error.message });
    }
  });

  // Stock movement routes
  app.get('/api/stores/:storeId/stock-movements', async (req: Request, res: Response) => {
    try {
      const filters = {
        productId: req.query.productId as string,
        limit: req.query.limit ? parseLimit(req.query.limit, 100) : undefined
      };
      const movements = await listStockMovements(store, req.params.storeId, filters);
      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stores/:storeId/stock-movements', async (req: Request, res: Response) => {
    try {
      const movement = await store.createStockMovement(req.params.storeId, req.body);
      res.status(201).json(movement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stores/:storeId/dashboard', async (req: Request, res: Response) => {
    try {
      const summary = await store.getDashboardSummary(
        req.params.storeId,
        parseTimezoneOffset(req.query.tzOffset)
      );
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics routes
  app.get('/api/stores/:storeId/analytics', async (req: Request, res: Response) => {
    try {
      const period = req.query.period as string || 'month';
      const analytics = await store.getAnalytics(req.params.storeId, period);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Error handling middleware
  app.use('/api', (error: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', error);
    res.status(error.status ?? 500).json({ message: error.message || 'Server error' });
  });
}
