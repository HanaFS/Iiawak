# 🚀 Complete Backend Setup — Phase 1-9 (100% Implemented)

## Installation & Deployment Guide

### ✅ Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- MongoDB 7.0+
- Redis 7+
- Git

---

## 🔧 STEP 1: Install All Dependencies

```bash
cd Iiawak_backend

# Install all packages including Phase 5-9 additions
npm install

# Packages added for complete implementation:
# Phase 2: redis, rate-limit-redis
# Phase 3: winston
# Phase 4: nodemailer
# Phase 5: (Socket.io extensions - built-in)
# Phase 6: express-rate-limit, express-validator, helmet, compression
# Phase 8: jest, supertest, eslint
# Phase 9: (MongoDB tools - external)
```

**Verify Installation**:
```bash
npm list redis winston nodemailer express-rate-limit
```

---

## 📋 STEP 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
```

### Required Variables (All Phases)

```env
# Application (Phase 1-7)
PORT=5000
NODE_ENV=development
ADMIN_URL=http://localhost:5173

# Database (Phase 1-9)
MONGODB_URI=mongodb://admin:admin123@localhost:27017/iiawak

# Authentication
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# External APIs (Existing)
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret

# VNPay Payment (Phase 1)
VNPAY_TMN_CODE=XXXXXXXX
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paygate
VNPAY_RETURN_URL=http://localhost:3000/payment-result
VNPAY_API=https://api.sandbox.vnpayment.vn

# Email Service (Phase 4)
EMAIL_PROVIDER=gmail
EMAIL_FROM=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Redis Cache (Phase 2)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis123

# Logging (Phase 3)
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

**Note**: For Gmail, use [App Passwords](https://myaccount.google.com/apppasswords) instead of your regular password.

---

## 🐳 STEP 3: Start Docker Services

```bash
# From project root (Iiawak/)
docker-compose up -d

# Wait 30 seconds for MongoDB to initialize
sleep 30

# Verify all services are running
docker-compose ps

# Expected output:
# NAME              STATUS        PORTS
# iiawak-mongodb    Up (healthy)  27017/tcp
# iiawak-redis      Up (healthy)  6379/tcp
# iiawak-backend    Up (healthy)  0.0.0.0:5000->5000/tcp
```

---

## 📊 STEP 4: Initialize Database (Phase 9)

```bash
# Create all MongoDB indexes
npm run indexes:create

# Expected output:
# ✅ User: email index created
# ✅ User: username index created
# ✅ Post: full-text search index created
# ✅ Transaction: userId + createdAt index created
# ... (20+ indexes)
# 🎉 All indexes created successfully!
```

---

## 🔄 STEP 5: Run Database Migrations (Phase 9)

```bash
# Check migration status
npm run migrate:status

# Apply all pending migrations
npm run migrate:up

# Expected output:
# 🚀 Starting migrations...
# ⏳ Applying: 001_add_vnpay_to_transaction
# ✅ Applied: 001_add_vnpay_to_transaction (234ms)
# ... (4 migrations)
# 🎉 All migrations applied successfully!
```

---

## 💾 STEP 6: Create Database Backup (Phase 9)

```bash
# Create initial backup before testing
npm run backup

# Expected output:
# ✅ Backup created: ./backups/iiawak_backup_20260610_143022.archive (2.3MB)

# List all backups
npm run backup:list
```

---

## ✅ STEP 7: Verify Installation

### Health Check
```bash
# Test API health
curl http://localhost:5000/health

# Response:
{
  "status": "ok",
  "timestamp": "2026-06-10T...",
  "uptime": 45.123,
  "websocket": {
    "stats": {
      "totalUsers": 0,
      "onlineUsers": 0,
      "queuedMessages": 0,
      "typingUsers": 0
    }
  }
}
```

### Smoke Tests (Phase 8)
```bash
# Run comprehensive health checks
npm run smoke-tests

# Expected output:
# ✅ Health check passed
# ✅ Response time: 145ms
# ✅ Database connectivity verified
# ✅ Redis cache verified
# ✅ Rate limiting verified
# ✅ Error handling verified (404 returned)
# ✅ Security headers verified
# ✅ Response compression verified
# 🎉 All smoke tests passed!
```

### View Logs (Phase 3)
```bash
# Real-time backend logs
docker-compose logs -f backend

# View MongoDB logs
docker-compose logs mongodb

# View Redis logs
docker-compose logs redis

# Check log files
tail -f logs/combined.log
tail -f logs/error.log
```

---

## 🧪 STEP 8: Test Core Features

### Test Payment System (Phase 1)
```bash
# Get JWT token first (from login)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' | jq -r '.data.token')

# Create payment URL
curl -X POST http://localhost:5000/api/payment/vnpay/create-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "6478abc123def456789ghi00",
    "amount": 50000
  }'

# Response:
{
  "success": true,
  "data": {
    "vnp_Url": "https://sandbox.vnpayment.vn/paygate?...",
    "txId": "VNP-20260610-001234",
    "amount": 50000,
    "currency": "VND"
  }
}
```

### Test Rate Limiting (Phase 6)
```bash
# Send requests rapidly - should be rate limited
for i in {1..101}; do
  curl -s http://localhost:5000/ > /dev/null
  echo "Request $i"
done

# After 100 requests should get 429 Too Many Requests
```

### Test WebSocket Security (Phase 5)
```bash
# Use WebSocket client to test JWT authentication
# Example: Postman, Thunder Client, or wscat
wscat -c ws://localhost:5000 \
  --header "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: Connection accepted
```

### Test Caching (Phase 2)
```bash
# First request (cache miss)
time curl http://localhost:5000/api/user/profile

# Second request (cache hit - should be faster)
time curl http://localhost:5000/api/user/profile

# Check Redis
docker-compose exec redis redis-cli -a redis123 keys "*"
```

---

## 🔧 STEP 9: Configure CI/CD (Phase 8)

### Create GitHub Secrets
```bash
# GitHub Settings → Secrets and variables → Actions

# For Staging Deployment
STAGING_HOST=staging.example.com
STAGING_USER=deploy
STAGING_DEPLOY_KEY=your_private_key
STAGING_API_URL=https://staging-api.example.com

# For Production Deployment
PROD_HOST=production.example.com
PROD_USER=deploy
PROD_DEPLOY_KEY=your_private_key
PROD_API_URL=https://api.example.com

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SONAR_TOKEN=your_sonarcloud_token
```

### Verify CI/CD Setup
```bash
# Push to develop branch triggers staging deployment
git push origin develop

# Push tag to main triggers production deployment
git tag v1.0.0
git push origin v1.0.0
```

---

## 📝 STEP 10: Seed Data (Optional)

```bash
# Populate database with sample data
npm run seed

# Output: Seeds created for users, posts, characters, etc.
```

---

## 🚀 STEP 11: Production Deployment

### Build Docker Image
```bash
# Build production image
docker build -t iiawak-backend:3.1.0 .

# Tag for registry
docker tag iiawak-backend:3.1.0 your-registry/iiawak-backend:3.1.0

# Push to registry
docker push your-registry/iiawak-backend:3.1.0
```

### Deploy to Server
```bash
# SSH into production server
ssh user@production-server

# Pull latest code
git pull origin main

# Deploy via docker-compose
docker-compose pull
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate:up

# Verify deployment
curl https://api.example.com/health
```

---

## 📊 Maintenance Commands

### Daily Operations
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend --tail=100

# Restart service
docker-compose restart backend

# Check resource usage
docker stats

# Check database size
docker-compose exec mongodb mongosh -u admin -p admin123 \
  --eval "db.stats()"
```

### Weekly Maintenance
```bash
# Create backup
npm run backup

# Verify backup integrity
npm run backup:list

# Check database indexes
docker-compose exec mongodb mongosh -u admin -p admin123 \
  --eval "db.users.getIndexes()"

# Monitor logs for errors
grep "ERROR" logs/error.log | head -20
```

### Monthly Maintenance
```bash
# Clean old backups (keep last 7 days)
npm run backup:clean

# Full database optimization
npm run indexes:create

# Check and repair indexes
docker-compose exec mongodb mongosh -u admin -p admin123 \
  --eval "db.users.reIndex()"

# Review migration history
npm run migrate:status
```

---

## 🆘 Troubleshooting

### MongoDB Connection Error
```bash
# Check MongoDB is running
docker-compose ps | grep mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Wait 30 seconds and reconnect
sleep 30
docker-compose exec mongodb mongosh -u admin -p admin123
```

### Redis Connection Error
```bash
# Check Redis connectivity
docker-compose exec redis redis-cli -a redis123 ping
# Should return: PONG

# Clear Redis cache if corrupted
docker-compose exec redis redis-cli -a redis123 FLUSHALL

# Restart Redis
docker-compose restart redis
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
docker-compose restart backend
```

### Email Not Sending
```bash
# Verify SMTP configuration
# Gmail: Generate app-specific password
# https://myaccount.google.com/apppasswords

# Test email service
curl -X GET http://localhost:5000/api/email/test

# Check email logs
grep "email" logs/combined.log
```

### Payment Webhook Not Working
```bash
# Verify VNPay credentials
cat .env | grep VNPAY

# Test webhook signature
node -e "const crypto = require('crypto'); 
  console.log(crypto.createHash('md5').update('test').digest('hex'))"

# Check VNPay transaction logs
grep "VNPAY\|payment" logs/combined.log
```

---

## 📞 Support & Documentation

| Document | Purpose |
|----------|---------|
| **QUICK_START.md** | 5-minute setup |
| **IMPLEMENTATION_COMPLETE.md** | Full feature list |
| **PROJECT_STRUCTURE.md** | File organization |
| **docs/DOCKER_SETUP.md** | Docker guide |
| **API docs** | In route files |

---

## ✅ Complete Implementation Checklist

### Backend Core (Phases 1-7)
- ✅ VNPay payment system
- ✅ Redis caching
- ✅ Winston logging
- ✅ Email notifications
- ✅ WebSocket security
- ✅ Rate limiting & validation
- ✅ Docker containerization

### Operations (Phase 8-9)
- ✅ CI/CD automation
- ✅ Database indexing
- ✅ Migration system
- ✅ Backup & restore
- ✅ Health checks

### Ready for Production
- ✅ All dependencies installed
- ✅ Environment configured
- ✅ Database initialized
- ✅ Services running
- ✅ Smoke tests passing
- ✅ Backups created
- ✅ CI/CD configured
- ✅ Logs monitored

---

## 🎉 Success!

Your complete backend system is now:
- ✅ Fully implemented (9 phases)
- ✅ Production-ready (MVP)
- ✅ Secure & monitored
- ✅ Scalable & optimized
- ✅ Automated & tested

**Status**: Ready for deployment! 🚀

---

**Backend Version**: 3.1.0  
**Last Updated**: June 10, 2026  
**Team**: AI-Assisted Development
