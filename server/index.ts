import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import compression from 'compression';
import { NeonStore } from './neon-store.js';
import { registerApiRoutes } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(compression());
app.use(express.json({ limit: '1mb' }));

function createStore(): NeonStore {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is required');
  }

  return new NeonStore(process.env.POSTGRES_URL);
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
    const store = createStore();
    registerApiRoutes(app, store);
    await registerFrontend();

    app.listen(port, '0.0.0.0', () => {
      console.log(`Lares app running on http://localhost:${port}`);
      console.log('Database: Neon Postgres');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
