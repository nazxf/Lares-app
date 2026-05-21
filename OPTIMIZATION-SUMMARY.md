# Optimization Summary

## Current Runtime

- Frontend: React + Vite
- Backend: Express
- Database: Neon Postgres
- Cache: Upstash Redis with memory fallback
- Hosting target: Vercel

The app no longer includes a local file-backed database runtime.

## Implemented Optimizations

- Dashboard uses one aggregate API request.
- Product and transaction reads use SWR on the client.
- Server responses include `X-Response-Time`.
- Slow API responses over 100ms are logged.
- Redis caches product lists, transactions, stock movements, dashboard summaries, and user lookups.
- Cache invalidation runs after writes that change store data.
- Frontend routes are lazy-loaded.
- Production build uses code splitting.

## Verification

```bash
npm run lint
npm run build
curl http://localhost:3000/api/health
```

## Notes

The first request after cache expiry can still be slower because it performs real Neon queries. Subsequent warm-cache requests should be much faster.
