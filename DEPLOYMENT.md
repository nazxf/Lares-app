# Deployment Guide - Vercel + Neon Postgres

## 🚀 Setup Neon Postgres (FREE)

### 1. Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub (recommended)
3. Create a new project: **lares-app**
4. Select region closest to your users
5. Copy the connection string

### 2. Get Database Connection String
After creating project, you'll get:
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

Save this as `POSTGRES_URL`

---

## 📦 Deploy to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Import: `nazxf/Lares-app`

2. **Configure Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   POSTGRES_URL=postgresql://[your-neon-connection-string]
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=production
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at: `https://lares-app.vercel.app`

### Option 2: Via CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables
vercel env add POSTGRES_URL
vercel env add GEMINI_API_KEY
vercel env add NODE_ENV

# Deploy to production
vercel --prod
```

---

## 🗄️ Initialize Database

After deployment, run the schema:

1. Go to Neon Console: https://console.neon.tech
2. Select your project
3. Go to "SQL Editor"
4. Copy and paste content from `database_schema.sql`
5. Click "Run"

---

## ✅ Verify Deployment

1. Visit your Vercel URL
2. Check health endpoint: `https://your-app.vercel.app/api/health`
3. Should return: `{"status":"ok","timestamp":"..."}`

---

## 🔧 Local Development

Keep using SQLite for local development:

```bash
npm run dev
```

Production will automatically use Postgres when `POSTGRES_URL` is set.

---

## 📊 Free Tier Limits

### Neon Postgres (FREE)
- ✅ 512 MB storage
- ✅ 3 GB data transfer/month
- ✅ Unlimited queries
- ✅ Auto-scaling
- ✅ Branching (like git for databases!)

### Vercel (FREE)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Serverless functions
- ✅ Auto SSL
- ✅ GitHub integration

---

## 🆘 Troubleshooting

### Database connection fails
- Check `POSTGRES_URL` is correct
- Ensure `?sslmode=require` is at the end
- Verify Neon project is active

### Build fails
- Check all dependencies are in `package.json`
- Verify `npm run build` works locally

### API routes not working
- Check `vercel.json` rewrites
- Verify `api/index.ts` exports correctly

---

## 📝 Next Steps

1. ✅ Setup Neon Postgres
2. ✅ Deploy to Vercel
3. ✅ Initialize database schema
4. ⚠️ Migrate existing SQLite data (if needed)
5. ⚠️ Setup custom domain (optional)

---

Need help? Check:
- Neon Docs: https://neon.tech/docs
- Vercel Docs: https://vercel.com/docs
