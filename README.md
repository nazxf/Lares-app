# Lares POS

Lares POS is a compact point-of-sale and inventory dashboard for daily water and gas store operations. It focuses on fast cashier workflows, stock visibility, sales tracking, and owner-friendly reporting.

## What Is Included

- Operational POS dashboard for revenue, transactions, stock, and low-stock alerts.
- Product management with search, stock counts, prices, and status.
- Sales workflow with cart, payment summary, and recent transactions.
- Dark and light themes with a SaaS-style dark default.
- Neon Postgres data storage for local and production runtime.
- Upstash Redis caching for faster repeated API responses.
- GitHub Actions CI plus Dependabot dependency updates.

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS 4
- Express
- Neon Postgres
- Upstash Redis
- Recharts
- lucide-react

## Requirements

- Node.js 20 or newer
- npm
- Neon Postgres connection string
- Upstash Redis REST URL and token

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Fill these values:

```text
APP_URL=http://localhost:3000
POSTGRES_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Initialize the database by running `neon-schema.sql` in the Neon SQL Editor.

## Development

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
```

Run the production server locally:

```bash
npm run preview
```

## Checks

```bash
npm run lint
npm run build
```

## Deployment

Set the production environment variables in Vercel:

```text
POSTGRES_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NODE_ENV=production
```

Deploy with Vercel or through the connected GitHub repository.

## Maintenance

Dependabot is configured for npm packages and GitHub Actions. Pull requests should pass CI before merging.
