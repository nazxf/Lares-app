# Quick Reference

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

Local development requires `POSTGRES_URL` in `.env`.

## Database

```bash
# Initialize or update schema
# Run this file in the Neon SQL Editor:
neon-schema.sql
```

Required database environment variable:

```text
POSTGRES_URL=postgresql://user:password@host/database?sslmode=require
```

## Cache

```text
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

Redis is recommended for production. The app has a memory fallback for cache writes.

## API Endpoints

```bash
POST   /api/auth/login
GET    /api/users/:userId
PATCH  /api/users/:userId
POST   /api/stores
GET    /api/stores/:storeId
GET    /api/stores/:storeId/products
POST   /api/stores/:storeId/products
PATCH  /api/stores/:storeId/products/:productId
GET    /api/stores/:storeId/transactions?limit=50
POST   /api/stores/:storeId/transactions/process
GET    /api/stores/:storeId/stock-movements?limit=50
GET    /api/stores/:storeId/dashboard
GET    /api/health
```

## Monitoring

```bash
curl http://localhost:3000/api/health
curl -I http://localhost:3000/api/stores/STORE_ID/products
```

Check `X-Response-Time` headers and `[SLOW]` log lines for performance issues.

## Troubleshooting

### Port Already In Use

```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Not Configured

Set `POSTGRES_URL` in `.env`, then restart `npm run dev`.

### Slow First Request

First request after cache expiry can be slower because it queries Neon directly. Keep Redis enabled and consider increasing dashboard cache TTL if needed.
