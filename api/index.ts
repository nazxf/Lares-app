import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { neon } from '@neondatabase/serverless';
import { SqlStore } from '../server/database.js';
import { registerApiRoutes } from '../server/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));

// Create SQL store based on environment
async function createStore() {
  // Check if we're in production with Postgres
  if (process.env.POSTGRES_URL) {
    console.log('Using Neon Postgres database');
    
    // For now, still use SQLite as we need to implement Postgres adapter
    // TODO: Implement full Postgres support
    console.warn('Postgres adapter not yet implemented, falling back to SQLite');
  }
  
  // Use SQLite (works in serverless with limitations)
  console.log('Using SQLite database');
  const databasePath = path.join(__dirname, '..', 'data', 'lares.sqlite');
  const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist');
  
  try {
    const SQL = await initSqlJs({
      locateFile: (file) => path.join(wasmPath, file),
    });
    
    const db = fs.existsSync(databasePath)
      ? new SQL.Database(fs.readFileSync(databasePath))
      : new SQL.Database();

    return new SqlStore(db, databasePath);
  } catch (error) {
    console.error('Failed to initialize SQLite:', error);
    throw error;
  }
}

// Initialize store (singleton pattern for serverless)
let storePromise: Promise<SqlStore> | null = null;

async function getStore(): Promise<SqlStore> {
  if (!storePromise) {
    storePromise = createStore();
  }
  return storePromise;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: process.env.POSTGRES_URL ? 'postgres (pending)' : 'sqlite'
  });
});

// Register routes
getStore().then((store) => {
  registerApiRoutes(app, store);
}).catch((error) => {
  console.error('Failed to initialize store:', error);
});

// Export for Vercel
export default app;
