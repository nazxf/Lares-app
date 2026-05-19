# Performance Optimization Guide

## Overview
Aplikasi Lares telah dioptimasi untuk performa maksimal dengan berbagai teknik caching, database indexing, dan monitoring.

## 1. Database Optimization

### SQLite PRAGMA Settings
```sql
PRAGMA journal_mode = WAL;        -- Write-Ahead Logging untuk concurrency
PRAGMA synchronous = NORMAL;      -- Balance antara speed dan safety
PRAGMA cache_size = -64000;       -- 64MB cache
PRAGMA temp_store = MEMORY;       -- Temporary tables di memory
PRAGMA mmap_size = 30000000000;   -- Memory-mapped I/O
PRAGMA page_size = 4096;          -- Optimal page size
PRAGMA auto_vacuum = INCREMENTAL; -- Automatic space reclamation
```

### Database Indexes
Indexes telah ditambahkan untuk query yang sering digunakan:

**Products Table:**
- `idx_products_store_name` - Pencarian produk by store dan nama
- `idx_products_store_category` - Filter by kategori
- `idx_products_store_status` - Filter by status (active/inactive)
- `idx_products_stock` - Query produk dengan stok rendah
- `idx_products_store_updated` - Sorting by update time

**Transactions Table:**
- `idx_transactions_store_created` - List transaksi by store (DESC)
- `idx_transactions_store_type` - Filter by type (sale/stock_in)
- `idx_transactions_cashier` - Transaksi per kasir
- `idx_transactions_type_created` - Global filter by type

**Stock Movements Table:**
- `idx_movements_store_created` - List movements by store
- `idx_movements_product` - History per produk
- `idx_movements_store_type` - Filter by movement type

**Users Table:**
- `idx_users_email` - Login lookup
- `idx_users_store` - Users per store
- `idx_users_role` - Filter by role

## 2. Caching Strategy

### In-Memory Cache
Menggunakan `node-cache` dengan konfigurasi:
- **TTL (Time To Live):** 5 menit (300 detik)
- **Check Period:** 2 menit (120 detik)
- **Auto flush:** Saat database di-update

### Cached Endpoints
- `GET /api/users/:userId` - User profile
- `GET /api/stores/:storeId/products` - Product list

### Cache Invalidation
Cache otomatis di-invalidate saat:
- User di-update
- Product ditambah/diubah
- Database di-save

## 3. Response Compression

Semua API responses di-compress menggunakan gzip:
- Mengurangi bandwidth usage 60-80%
- Faster response time untuk client
- Automatic compression untuk responses > 1KB

## 4. Performance Monitoring

### Response Time Headers
Setiap API response include header:
```
X-Response-Time: 45ms
```

### Slow Query Logging
Query yang memakan waktu > 100ms akan di-log:
```
[SLOW] GET /api/stores/store-123/products - 156ms
```

### Health Check Endpoint
```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "rss": "128MB",
    "heapUsed": "64MB",
    "heapTotal": "96MB"
  },
  "timestamp": "2026-05-19T10:30:00.000Z"
}
```

## 5. Best Practices

### Query Optimization
- Gunakan prepared statements (sudah implemented)
- Limit hasil query (max 500 records)
- Gunakan pagination untuk large datasets
- Avoid SELECT * (pilih kolom yang dibutuhkan saja)

### Database Maintenance
```bash
# Vacuum database (jalankan secara berkala)
sqlite3 data/lares.sqlite "VACUUM;"

# Analyze untuk update statistics
sqlite3 data/lares.sqlite "ANALYZE;"
```

### Monitoring
Monitor performa dengan:
1. Check `/api/health` endpoint
2. Review server logs untuk slow queries
3. Monitor memory usage
4. Check response time headers

## 6. Performance Benchmarks

### Expected Response Times
- User login: < 50ms
- List products: < 100ms
- Process transaction: < 200ms
- List transactions: < 150ms

### Database Size Guidelines
- < 100MB: Optimal performance
- 100MB - 500MB: Good performance
- > 500MB: Consider archiving old data

## 7. Troubleshooting

### Slow Queries
Jika query lambat:
1. Check indexes dengan `EXPLAIN QUERY PLAN`
2. Review cache hit rate
3. Consider adding more specific indexes

### High Memory Usage
Jika memory tinggi:
1. Reduce cache TTL
2. Limit query results
3. Restart server untuk clear memory

### Database Lock Issues
Jika terjadi lock:
1. Check WAL mode aktif
2. Reduce concurrent writes
3. Review transaction boundaries

## 8. Future Optimizations

Potential improvements:
- [ ] Redis untuk distributed caching
- [ ] Database connection pooling
- [ ] Query result pagination
- [ ] Background job processing
- [ ] CDN untuk static assets
- [ ] Database replication untuk read scaling
