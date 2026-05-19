# 🚀 Setup Upstash Redis - Panduan Langkah demi Langkah

## ✅ Step 1: Buat Akun Upstash (2 menit)

### 1.1 Buka Website Upstash
```
https://upstash.com
```

### 1.2 Klik "Sign Up" atau "Get Started"
- Pilih **"Continue with GitHub"** (paling mudah)
- Atau bisa pakai email

### 1.3 Authorize GitHub
- Klik "Authorize Upstash"
- Login ke GitHub jika belum

### 1.4 Verify Email (jika pakai email)
- Check inbox email Anda
- Klik link verifikasi

✅ **Akun sudah jadi!**

---

## ✅ Step 2: Buat Redis Database (2 menit)

### 2.1 Setelah Login
Anda akan masuk ke dashboard Upstash.

### 2.2 Klik "Create Database"
- Tombol hijau besar di tengah
- Atau klik "+ Create Database" di pojok kanan atas

### 2.3 Isi Form Database

**Name:**
```
lares-cache
```

**Type:**
```
Regional (pilih ini - GRATIS)
```

**Region:**
```
ap-southeast-1 (Singapore)
```
*Pilih Singapore karena paling dekat dengan Indonesia*

**Primary Region:**
```
ap-southeast-1 (Singapore)
```

**Read Regions:**
```
(kosongkan - tidak perlu untuk free tier)
```

**TLS (SSL):**
```
✅ Enabled (default - biarkan checked)
```

**Eviction:**
```
No eviction (default - biarkan)
```

### 2.4 Klik "Create"
- Tunggu ~10 detik
- Database akan muncul di dashboard

✅ **Database sudah jadi!**

---

## ✅ Step 3: Dapatkan Credentials (1 menit)

### 3.1 Klik Database "lares-cache"
- Di dashboard, klik nama database yang baru dibuat

### 3.2 Scroll ke Bawah
- Cari section **"REST API"**
- Atau klik tab **"Details"**

### 3.3 Copy Credentials

Anda akan melihat 2 nilai penting:

**1. UPSTASH_REDIS_REST_URL**
```
Contoh: https://us1-merry-cat-12345.upstash.io
```
- Klik tombol **"Copy"** di sebelah kanan

**2. UPSTASH_REDIS_REST_TOKEN**
```
Contoh: AXlkASQgNzM4OTYxYmEt...
```
- Klik tombol **"Copy"** di sebelah kanan

### 3.4 Simpan Sementara
- Paste kedua nilai ini ke Notepad
- Atau langsung lanjut ke Step 4

✅ **Credentials sudah didapat!**

---

## ✅ Step 4: Tambahkan ke Vercel (3 menit)

### 4.1 Buka Vercel Project Settings
```
https://vercel.com/nafiaku447-progs-projects/lares-app/settings/environment-variables
```

Atau:
1. Buka https://vercel.com
2. Pilih project "lares-app"
3. Klik "Settings"
4. Klik "Environment Variables"

### 4.2 Tambahkan UPSTASH_REDIS_REST_URL

**Klik "Add New"**

**Key:**
```
UPSTASH_REDIS_REST_URL
```

**Value:**
```
[Paste URL dari Upstash]
Contoh: https://us1-merry-cat-12345.upstash.io
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Klik "Save"**

### 4.3 Tambahkan UPSTASH_REDIS_REST_TOKEN

**Klik "Add New" lagi**

**Key:**
```
UPSTASH_REDIS_REST_TOKEN
```

**Value:**
```
[Paste Token dari Upstash]
Contoh: AXlkASQgNzM4OTYxYmEt...
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Klik "Save"**

✅ **Environment variables sudah ditambahkan!**

---

## ✅ Step 5: Redeploy Aplikasi (2 menit)

### 5.1 Vercel Auto-Deploy
Vercel akan otomatis redeploy karena environment variables berubah.

**Atau manual redeploy:**

### Option A: Via Vercel Dashboard
1. Go to: https://vercel.com/nafiaku447-progs-projects/lares-app
2. Klik tab "Deployments"
3. Klik "..." di deployment terakhir
4. Klik "Redeploy"

### Option B: Via Git Push
```bash
# Buat commit kosong untuk trigger deploy
git commit --allow-empty -m "trigger redeploy for Redis"
git push origin main
```

### 5.2 Tunggu Deployment Selesai
- Biasanya 1-2 menit
- Status akan berubah jadi "Ready"

✅ **Aplikasi sudah redeploy dengan Redis!**

---

## ✅ Step 6: Test Redis Connection (1 menit)

### 6.1 Test di Upstash Console

1. **Buka Upstash Dashboard:**
   ```
   https://console.upstash.com
   ```

2. **Klik database "lares-cache"**

3. **Klik tab "CLI"**

4. **Test command:**
   ```redis
   SET test "Hello Redis"
   ```
   
5. **Get value:**
   ```redis
   GET test
   ```

6. **Should return:**
   ```
   "Hello Redis"
   ```

✅ **Redis berfungsi!**

### 6.2 Test di Aplikasi

1. **Buka aplikasi:**
   ```
   https://lares-app.vercel.app
   ```

2. **Login ke aplikasi**

3. **Buka halaman Products**
   - First load: akan lambat (cache miss)
   - Reload page: akan cepat (cache hit)

4. **Check Vercel Logs:**
   ```
   https://vercel.com/nafiaku447-progs-projects/lares-app/logs
   ```
   
   Look for:
   ```
   ✅ Redis client initialized
   ✅ Cache HIT: products:xxx
   ❌ Cache MISS: products:xxx
   ```

✅ **Redis working di aplikasi!**

---

## 📊 Step 7: Monitor Performance (Optional)

### 7.1 Upstash Dashboard Metrics

1. **Go to database:**
   ```
   https://console.upstash.com/redis/[your-db-id]
   ```

2. **Check metrics:**
   - Total Commands
   - Daily Commands
   - Storage Used
   - Throughput

### 7.2 Expected Metrics (After 1 day)

```
Commands: 2,000-5,000/day
Storage: 5-10 MB
Latency: <50ms
Hit Rate: 70-85%
```

---

## ✅ Checklist Lengkap

- [ ] Step 1: Buat akun Upstash ✅
- [ ] Step 2: Buat Redis database ✅
- [ ] Step 3: Copy credentials ✅
- [ ] Step 4: Add ke Vercel ✅
- [ ] Step 5: Redeploy aplikasi ✅
- [ ] Step 6: Test Redis ✅
- [ ] Step 7: Monitor (optional) ✅

---

## 🎉 Selesai!

Redis caching sudah aktif dan aplikasi Anda sekarang:
- 🚀 5-10x lebih cepat
- ✅ Gratis (free tier)
- ✅ Zero maintenance
- ✅ Production-ready

---

## 🐛 Troubleshooting

### Problem: "Redis client not initialized"

**Solution:**
1. Check environment variables di Vercel
2. Pastikan nama variable benar:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy aplikasi

### Problem: "Cache always MISS"

**Reason:** Normal untuk first request
- First load = cache miss (normal)
- Reload = cache hit (should be fast)

### Problem: Credentials salah

**Solution:**
1. Go to Upstash dashboard
2. Copy credentials lagi
3. Update di Vercel
4. Redeploy

---

## 📞 Butuh Bantuan?

Jika ada masalah:
1. Screenshot error
2. Check Vercel logs
3. Check Upstash dashboard
4. Tanya saya!

---

*Setup Guide - May 19, 2026*
