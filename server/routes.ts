import type { Express, Request, Response, NextFunction } from 'express';
import type { NeonStore } from './neon-store.js';

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
      const products = await store.getProducts(req.params.storeId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stores/:storeId/products', async (req: Request, res: Response) => {
    try {
      const product = await store.createProduct(req.params.storeId, req.body);
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
      const product = await store.updateProduct(req.params.productId, req.body);
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
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };
      const transactions = await store.getTransactions(req.params.storeId, filters);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stores/:storeId/transactions', async (req: Request, res: Response) => {
    try {
      const transaction = await store.createTransaction(req.params.storeId, req.body);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stock movement routes
  app.get('/api/stores/:storeId/stock-movements', async (req: Request, res: Response) => {
    try {
      const filters = {
        productId: req.query.productId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };
      const movements = await store.getStockMovements(req.params.storeId, filters);
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
