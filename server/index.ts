import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { createServer as createViteServer } from 'vite';
import compression from 'compression';
import { SqlStore } from './database.js';
import { registerApiRoutes } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Create SQL store
async function createSqlStore(): Promise<SqlStore> {
  const databasePath = path.join(__dirname, '..', 'data', 'lares.sqlite');
  const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist');
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(wasmPath, file),
  });
  const db = fs.existsSync(databasePath)
    ? new SQL.Database(fs.readFileSync(databasePath))
    : new SQL.Database();

  return new SqlStore(db, databasePath);
}

// Register frontend
async function registerFrontend() {
  if (isProduction) {
    const distPath = path.join(__dirname, '..', 'dist');
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

// Start server
async function startServer() {
  try {
    const store = await createSqlStore();
    registerApiRoutes(app, store);
    await registerFrontend();

    app.listen(port, '0.0.0.0', () => {
      console.log(`Lares app running on http://localhost:${port}`);
      console.log(`SQL database: ${path.join(__dirname, '..', 'data', 'lares.sqlite')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
