# Performance Guide

Lares now uses Neon Postgres for all environments.

## Database

Run `neon-schema.sql` in the Neon SQL Editor before first use. The schema includes indexes for the hot paths:

- Products by store, category, status, stock, and update time
- Transactions by store, type, cashier, and created time
- Stock movements by store, product, type, and created time
- Users by email and store

## Caching

The app uses Upstash Redis when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured. The Redis helper also has an in-memory fallback so reads can still be cached locally if Redis writes fail.

Cached data includes:

- User profile lookups
- Product lists
- Transactions
- Stock movements
- Dashboard summaries

Cache invalidation runs after product, transaction, and stock writes.

## Response Optimization

- Gzip compression is enabled on the Express server.
- API responses include `X-Response-Time`.
- Requests over 100ms are logged as `[SLOW]`.
- Dashboard data is served from one aggregate endpoint to reduce client waterfalls.

## Expected Behavior

Warm cache responses should be fast. The first request after a cache miss can still be slower because Vercel serverless functions and Neon may need to wake or perform real database queries.

Recommended settings:

- Keep Redis enabled in production.
- Increase dashboard cache TTL if the dashboard does not need second-by-second freshness.
- Use a scheduled warm-up request if first-hit latency is painful.

## Checks

```bash
npm run lint
npm run build
curl http://localhost:3000/api/health
```
