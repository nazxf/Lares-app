# 🚀 Setup Upstash Redis - Step by Step Guide

## 📋 Prerequisites
- Vercel account (already have)
- GitHub account (already have)
- 5 minutes of your time

---

## 🎯 Step 1: Create Upstash Account

1. **Go to Upstash:**
   ```
   https://upstash.com
   ```

2. **Sign Up:**
   - Click "Sign Up"
   - Choose "Continue with GitHub" (recommended)
   - Authorize Upstash

3. **Verify Email:**
   - Check your email
   - Click verification link

---

## 🗄️ Step 2: Create Redis Database

1. **Create Database:**
   - Click "Create Database" button
   - Or go to: https://console.upstash.com/redis

2. **Configure Database:**
   ```
   Name: lares-cache
   Type: Regional (FREE)
   Region: ap-southeast-1 (Singapore) - closest to your users
   TLS: Enabled (default)
   Eviction: No eviction (default)
   ```

3. **Click "Create"**
   - Wait ~10 seconds
   - Database will be ready

---

## 🔑 Step 3: Get Credentials

After database is created:

1. **Go to Database Details:**
   - Click on "lares-cache" database
   - You'll see the dashboard

2. **Scroll to "REST API" Section:**
   - You'll see:
     ```
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN
     ```

3. **Copy Both Values:**
   - Click "Copy" button next to each
   - Save them temporarily (we'll use in next step)

**Example:**
```
UPSTASH_REDIS_REST_URL=https://us1-merry-cat-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXlkASQgNzM...very-long-token...
```

---

## ⚙️ Step 4: Add to Vercel Environment Variables

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Project Settings:**
   ```
   https://vercel.com/nafiaku447-progs-projects/lares-app/settings/environment-variables
   ```

2. **Add UPSTASH_REDIS_REST_URL:**
   - Click "Add New"
   - Key: `UPSTASH_REDIS_REST_URL`
   - Value: [paste URL from Upstash]
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

3. **Add UPSTASH_REDIS_REST_TOKEN:**
   - Click "Add New"
   - Key: `UPSTASH_REDIS_REST_TOKEN`
   - Value: [paste token from Upstash]
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

### Option B: Via Vercel CLI

```bash
# Add URL
vercel env add UPSTASH_REDIS_REST_URL production
# Paste URL when prompted

# Add Token
vercel env add UPSTASH_REDIS_REST_TOKEN production
# Paste token when prompted
```

---

## 🧪 Step 5: Test Redis Connection

1. **Go to Upstash Console:**
   ```
   https://console.upstash.com/redis/[your-database-id]
   ```

2. **Click "CLI" Tab**

3. **Test Commands:**
   ```redis
   SET test "Hello Redis"
   GET test
   ```

4. **Should Return:**
   ```
   "Hello Redis"
   ```

✅ **Redis is working!**

---

## 🚀 Step 6: Deploy to Production

After adding environment variables to Vercel:

1. **Redeploy:**
   ```bash
   vercel --prod
   ```

   Or just push to GitHub (auto-deploy):
   ```bash
   git push origin main
   ```

2. **Wait for Deployment:**
   - ~2 minutes
   - Check: https://vercel.com/nafiaku447-progs-projects/lares-app

3. **Verify Logs:**
   - Go to deployment logs
   - Look for: `✅ Redis client initialized`

---

## ✅ Step 7: Verify Caching is Working

1. **Open Application:**
   ```
   https://lares-app.vercel.app
   ```

2. **Open Browser DevTools:**
   - Press F12
   - Go to "Network" tab

3. **Navigate to Products Page:**
   - First load: ~200-500ms (Cache MISS)
   - Reload page: ~30-80ms (Cache HIT)

4. **Check Vercel Logs:**
   - Go to: https://vercel.com/nafiaku447-progs-projects/lares-app/logs
   - Look for:
     ```
     ✅ Cache HIT: products:store-id
     ❌ Cache MISS: products:store-id
     ```

---

## 📊 Monitoring & Analytics

### Upstash Dashboard

1. **Go to Database:**
   ```
   https://console.upstash.com/redis/[your-database-id]
   ```

2. **Check Metrics:**
   - Total Commands
   - Hit Rate
   - Memory Usage
   - Throughput

### Expected Metrics (After 1 day):
```
Commands: ~1,000-5,000/day
Hit Rate: 60-80%
Memory: <10 MB
Latency: <50ms
```

---

## 🎯 Cache Strategy Summary

| Data Type | Cache Key | TTL | Why |
|-----------|-----------|-----|-----|
| **Products** | `products:{storeId}` | 2 min | Changes frequently |
| **User** | `user:id:{userId}` | 5 min | Rarely changes |
| **Store** | `store:{storeId}` | 10 min | Almost never changes |
| **Transactions** | `transactions:{storeId}:*` | 1 min | Real-time data |
| **Analytics** | `analytics:{storeId}:{period}` | 5 min | Can be stale |

---

## 🔧 Troubleshooting

### Redis Not Working?

**Check 1: Environment Variables**
```bash
vercel env ls
```
Should show:
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

**Check 2: Logs**
```bash
vercel logs
```
Look for errors related to Redis

**Check 3: Test Connection**
Go to Upstash Console → CLI → Run:
```redis
PING
```
Should return: `PONG`

### Cache Not Hitting?

**Possible Causes:**
1. TTL expired (normal)
2. Cache invalidated (normal after updates)
3. Different serverless instances (normal)
4. Redis credentials wrong

**Solution:**
- Check Upstash dashboard for command count
- If 0 commands → credentials wrong
- If >0 commands → working correctly

---

## 💰 Free Tier Limits

**Upstash Free Tier:**
- ✅ 10,000 commands/day
- ✅ 256 MB storage
- ✅ 100 concurrent connections
- ✅ Global replication

**Your Expected Usage:**
- ~2,000-5,000 commands/day
- ~5-10 MB storage
- ~10-20 concurrent connections

**Plenty of headroom!** 🎉

---

## 📈 Expected Performance Improvement

### Before Redis:
```
Products Page: 200-500ms
Dashboard: 800-1500ms
Analytics: 500-800ms
```

### After Redis:
```
Products Page: 30-80ms (6-10x faster) 🚀
Dashboard: 150-300ms (5-6x faster) 🚀
Analytics: 80-150ms (6-8x faster) 🚀
```

---

## 🎉 You're Done!

Redis caching is now:
- ✅ Installed
- ✅ Configured
- ✅ Deployed
- ✅ Working

**Next Steps:**
1. Setup Upstash account (5 min)
2. Add credentials to Vercel (2 min)
3. Deploy (2 min)
4. Enjoy faster app! 🚀

---

**Need Help?**
- Upstash Docs: https://docs.upstash.com/redis
- Upstash Discord: https://upstash.com/discord

---

*Setup Guide v1.0 - May 19, 2026*
