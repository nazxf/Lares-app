# 🚀 Quick Setup - Upstash Redis (10 Menit)

## 📋 Checklist

### ✅ Step 1: Buat Akun (2 min)
```
1. Buka: https://upstash.com
2. Klik "Sign Up"
3. Pilih "Continue with GitHub"
4. Authorize
```

### ✅ Step 2: Buat Database (2 min)
```
1. Klik "Create Database"
2. Name: lares-cache
3. Type: Regional (FREE)
4. Region: ap-southeast-1 (Singapore)
5. Klik "Create"
```

### ✅ Step 3: Copy Credentials (1 min)
```
1. Klik database "lares-cache"
2. Scroll ke "REST API" section
3. Copy:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
```

### ✅ Step 4: Add ke Vercel (3 min)
```
1. Buka: https://vercel.com/nafiaku447-progs-projects/lares-app/settings/environment-variables
2. Add "UPSTASH_REDIS_REST_URL"
   - Value: [paste URL]
   - Environment: ✅ All
3. Add "UPSTASH_REDIS_REST_TOKEN"
   - Value: [paste token]
   - Environment: ✅ All
4. Save
```

### ✅ Step 5: Redeploy (2 min)
```
Vercel auto-redeploy atau:
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### ✅ Step 6: Test (1 min)
```
1. Buka: https://lares-app.vercel.app
2. Login & buka Products page
3. Reload page (should be faster!)
4. Check logs: https://vercel.com/nafiaku447-progs-projects/lares-app/logs
   Look for: "✅ Redis client initialized"
```

---

## 🎯 Expected Result

### Before Redis:
- Products page: 200-500ms

### After Redis:
- First load: 200-500ms (cache miss)
- Reload: 30-80ms (cache hit) 🚀

---

## 📞 Need Help?

**Detailed guide:** `SETUP-UPSTASH-REDIS.md`

**Troubleshooting:**
- Check environment variables spelling
- Redeploy after adding env vars
- Check Vercel logs for errors

---

*Quick Reference - May 19, 2026*
