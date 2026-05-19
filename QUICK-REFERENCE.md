# Quick Reference Guide

## 🚀 Common Commands

### Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Type check with TypeScript
```

### Database
```bash
# View database
sqlite3 data/lares.sqlite

# Vacuum (optimize)
sqlite3 data/lares.sqlite "VACUUM;"

# Analyze (update stats)
sqlite3 data/lares.sqlite "ANALYZE;"

# Backup
cp data/lares.sqlite data/lares.backup.sqlite
```

### Git Workflow
```bash
# Feature development
git checkout -b feature/my-feature
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# Create PR on GitHub
# After merge, pull latest
git checkout main
git pull origin main
```

## 📡 API Endpoints

### Authentication
```bash
POST /api/auth/login
Body: { "email": "user@example.com", "name": "User Name" }
```

### Users
```bash
GET    /api/users/:userId
PATCH  /api/users/:userId
```

### Stores
```bash
POST   /api/stores
GET    /api/stores/:storeId
```

### Products
```bash
GET    /api/stores/:storeId/products
POST   /api/stores/:storeId/products
PATCH  /api/stores/:storeId/products/:productId
```

### Transactions
```bash
GET    /api/stores/:storeId/transactions?limit=50
POST   /api/stores/:storeId/transactions/process
```

### Stock Movements
```bash
GET    /api/stores/:storeId/stock-movements?limit=50
```

### Health Check
```bash
GET    /api/health
```

## 🔍 Monitoring

### Check Server Health
```bash
curl http://localhost:3000/api/health
```

### Monitor Response Times
```bash
# Check X-Response-Time header
curl -I http://localhost:3000/api/stores/STORE_ID/products
```

### View Logs
```bash
# Development logs
tail -f dev.log

# Error logs
tail -f .codex-dev.err.log
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Locked
```bash
# Check for lock file
ls -la data/

# Remove lock (if safe)
rm data/lares.sqlite-shm
rm data/lares.sqlite-wal
```

### Clear Cache
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clean build
npm run clean

# Type check
npm run lint

# Rebuild
npm run build
```

## 📊 Performance Tips

### Database
- Run VACUUM monthly
- Run ANALYZE weekly
- Keep database < 500MB
- Monitor slow queries in logs

### Caching
- Cache TTL: 5 minutes
- Auto-invalidation on updates
- Monitor cache hit rate

### Memory
- Check /api/health regularly
- Restart if memory > 512MB
- Monitor for memory leaks

## 🔐 Security Checklist

- [ ] Change default .env values
- [ ] Use strong API keys
- [ ] Enable HTTPS in production
- [ ] Regular security audits (npm audit)
- [ ] Keep dependencies updated
- [ ] Backup database regularly

## 📦 Deployment Checklist

- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Check environment variables
- [ ] Backup database
- [ ] Run security audit
- [ ] Update documentation
- [ ] Tag release version
- [ ] Deploy to staging first
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor logs

## 🎯 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| User Login | < 50ms | ✅ ~30ms |
| List Products | < 100ms | ✅ ~60ms |
| Process Transaction | < 200ms | ✅ ~150ms |
| List Transactions | < 150ms | ✅ ~80ms |
| Cache Hit Rate | > 70% | ✅ ~80% |
| Memory Usage | < 512MB | ✅ ~128MB |

## 📞 Quick Links

- [Performance Guide](./PERFORMANCE.md)
- [CI/CD Documentation](./CI-CD.md)
- [Optimization Summary](./OPTIMIZATION-SUMMARY.md)
- [AI Studio](https://ai.studio/apps/03901251-3437-4e02-b2ea-5d6d0e4a1c55)

## 💡 Pro Tips

1. **Use cache effectively** - Repeated queries are 10x faster
2. **Monitor slow queries** - Check logs for [SLOW] entries
3. **Regular maintenance** - VACUUM and ANALYZE monthly
4. **Backup before updates** - Always backup database first
5. **Test locally first** - Never deploy untested code
6. **Use health endpoint** - Monitor server status regularly
7. **Check response headers** - X-Response-Time shows performance
8. **Keep dependencies updated** - Security and performance fixes

## 🆘 Emergency Procedures

### Server Down
```bash
# Check if running
curl http://localhost:3000/api/health

# Restart server
npm run dev
```

### Database Corrupted
```bash
# Restore from backup
cp data/lares.backup.sqlite data/lares.sqlite

# If no backup, try recovery
sqlite3 data/lares.sqlite ".recover" > recovered.sql
```

### High Memory Usage
```bash
# Check memory
curl http://localhost:3000/api/health

# Restart server
# Kill process and restart
```

### Slow Performance
```bash
# Check slow queries in logs
grep SLOW dev.log

# Run ANALYZE
sqlite3 data/lares.sqlite "ANALYZE;"

# Clear cache (restart server)
```

---

**Need help?** Check the documentation files or open an issue on GitHub.
