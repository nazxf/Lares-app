import type { Express, Request, Response, NextFunction } from 'express';
import type { SqlStore } from './database.js';

export function registerApiRoutes(app: Express, store: SqlStore) {
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
  app.post('/api/auth/login', (req: Request, res: Response) => {
    res.json(store.login(req.body.email, req.body.name));
  });

  // User routes
  app.get('/api/users/:userId', (req: Request, res: Response) => {
    const user = store.getUser(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  });

  app.patch('/api/users/:userId', (req: Request, res: Response) => {
    const user = store.updateUser(req.params.userId, req.body);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  });

  // Store routes
  app.post('/api/stores', (req: Request, res: Response) => {
    res.status(201).json(store.createStore(req.body.name, req.body.ownerId));
  });

  // Product routes
  app.get('/api/stores/:storeId/products', (req: Request, res: Response) => {
    res.json(store.listProducts(req.params.storeId));
  });

  app.post('/api/stores/:storeId/products', (req: Request, res: Response) => {
    res.status(201).json({ id: store.addProduct(req.params.storeId, req.body) });
  });

  app.patch('/api/stores/:storeId/products/:productId', (req: Request, res: Response) => {
    store.updateProduct(req.params.storeId, req.params.productId, req.body);
    res.status(204).end();
  });

  // Transaction routes
  app.get('/api/stores/:storeId/transactions', (req: Request, res: Response) => {
    res.json(store.listTransactions(req.params.storeId, req.query.limit));
  });

  app.post('/api/stores/:storeId/transactions/process', (req: Request, res: Response) => {
    res.status(201).json({ id: store.processTransaction(req.params.storeId, req.body) });
  });

  // Stock movement routes
  app.get('/api/stores/:storeId/stock-movements', (req: Request, res: Response) => {
    res.json(store.listMovements(req.params.storeId, req.query.limit));
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
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

  // Error handling middleware
  app.use('/api', (error: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(error.status ?? 500).json({ message: error.message || 'Server error' });
  });
}
