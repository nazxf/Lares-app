import express from 'express';
import { NeonStore } from '../server/neon-store.js';
import { registerApiRoutes } from '../server/routes.js';

const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize store
let store: NeonStore | null = null;

function getStore(): NeonStore {
  if (!store) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    store = new NeonStore(process.env.POSTGRES_URL);
    console.log('Neon Postgres store initialized');
  }
  return store;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: process.env.POSTGRES_URL ? 'neon-postgres' : 'not-configured'
  });
});

// Initialize store and register routes
try {
  const storeInstance = getStore();
  registerApiRoutes(app, storeInstance as any);
  console.log('API routes registered successfully');
} catch (error) {
  console.error('Failed to initialize store:', error);
  
  // Fallback error handler
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'Database not configured',
      message: 'POSTGRES_URL environment variable is required'
    });
  });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Export for Vercel
export default app;
