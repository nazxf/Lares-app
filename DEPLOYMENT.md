# Deployment Guide - Vercel + Neon Postgres

## Setup Neon

1. Open https://neon.tech.
2. Create a project for Lares.
3. Copy the connection string.
4. Save it as `POSTGRES_URL`.

The connection string should look like:

```text
postgresql://user:password@host/database?sslmode=require
```

## Initialize Schema

Run `neon-schema.sql` in the Neon SQL Editor.

## Configure Vercel

Add these environment variables in Vercel:

```text
POSTGRES_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NODE_ENV=production
```

## Deploy

```bash
vercel --prod
```

## Local Development

Local development also uses Neon Postgres. Create `.env` with:

```text
POSTGRES_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
APP_URL=http://localhost:3000
```

Then run:

```bash
npm run dev
```

Local development and production use the same Neon-backed data layer.

## Verify

```bash
curl https://lares-app.vercel.app/api/health
```

The health response should show the API is online and whether Redis is enabled.
