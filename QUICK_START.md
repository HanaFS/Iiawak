# Iiawak Backend — Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd Iiawak_backend
npm install redis winston nodemailer dotenv
npm install --save-dev # if needed
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your credentials:
# - GEMINI_API_KEY (for AI chat)
# - CLOUDINARY_* (for image uploads)
# - VNPAY_* (for payments - get from https://sandbox.vnpayment.vn)
# - EMAIL credentials (Gmail: use app password)
```

### 3. Start Docker Services
```bash
# From project root (Iiawak/)
docker-compose up -d

# Wait 30 seconds for MongoDB to initialize

# Verify all services are running:
docker-compose ps

# Expected output:
# NAME          STATUS        PORTS
# iiawak-mongodb  Up (healthy)  27017/tcp
# iiawak-redis    Up (healthy)  6379/tcp
# iiawak-backend  Up (healthy)  0.0.0.0:5000->5000/tcp
```

### 4. Test API
```bash
# Health check
curl http://localhost:5000
# Response: { "message": "🚀 Iiawak API v3.0...", "status": "ok" }

# View logs
docker-compose logs -f backend
```

### 5. Test Payment System (VNPay)
```bash
# Create payment URL
curl -X POST http://localhost:5000/api/payment/vnpay/create-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "PACKAGE_ID",
    "amount": 50000
  }'

# Response: { "success": true, "data": { "vnp_Url": "...", "txId": "..." } }
```

### 6. Test Cache (Redis)
```bash
# Check if Redis is working
docker-compose exec redis redis-cli -a redis123 ping
# Response: PONG

# Check cache stats
docker-compose logs backend | grep "cache"
```

### 7. Check Logs
```bash
# Backend application logs
docker-compose logs backend

# MongoDB logs
docker-compose logs mongodb

# Redis logs
docker-compose logs redis

# View log files (written to disk)
tail -f logs/combined.log
tail -f logs/error.log
```

---

## 📋 Implemented Features

### ✅ Payment System (VNPay)
- Generate payment URLs
- Process webhook callbacks
- Handle transaction status
- Refund support (admin)

### ✅ Caching (Redis)
- User profiles (1 hour)
- Feed posts (5 minutes)
- Characters list (30 min)
- Packages (1 hour)

### ✅ Logging
- Request/response logging
- Error tracking
- File-based storage with rotation
- Structured JSON format

### ✅ Notifications
- Email templates (welcome, reset, payment, OTP)
- In-app notifications
- Multi-channel delivery (email, Socket.io)

### ✅ Containerization
- Docker Compose local setup
- Health checks
- Volume mounting for development

---

## 🔧 Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (reset data)
docker-compose down -v

# Rebuild Docker image
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend npm run seed

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p admin123

# Access Redis CLI
docker-compose exec redis redis-cli -a redis123

# Check container status
docker-compose ps

# View resource usage
docker stats
```

---

## 🧪 Testing Payment Integration

### Using Postman:

1. **Get JWT Token** (from login endpoint)
   ```
   POST /api/auth/login
   Body: { "email": "user@example.com", "password": "password" }
   Save the token
   ```

2. **Create Payment URL**
   ```
   POST /api/payment/vnpay/create-url
   Header: Authorization: Bearer {token}
   Body: { "packageId": "...", "amount": 50000 }
   Response: { "vnp_Url": "...", "txId": "VNP-..." }
   ```

3. **Check Transaction Status**
   ```
   GET /api/payment/transaction/VNP-...
   Header: Authorization: Bearer {token}
   Response: { "status": "pending|success|failed", ... }
   ```

---

## 📊 Monitoring Dashboard

### Real-time Stats:
```bash
# Watch Docker stats
watch docker stats

# Watch Redis memory
docker-compose exec redis redis-cli -a redis123 info memory

# Watch MongoDB connections
docker-compose exec mongodb mongosh -u admin -p admin123 \
  --eval "db.serverStatus().connections"
```

---

## ⚠️ Troubleshooting

### "Cannot connect to MongoDB"
```bash
docker-compose logs mongodb
docker-compose restart mongodb
# Wait 30 seconds
docker-compose up -d backend
```

### "Redis connection refused"
```bash
docker-compose logs redis
docker-compose exec redis redis-cli -a redis123 ping
```

### "Port 5000 already in use"
```bash
# Option 1: Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Option 2: Change port in .env
PORT=5001
docker-compose restart backend
```

### "Email not sending"
```bash
# Check email configuration in .env
# Gmail: Use App Password (not regular password)
# Get app password: https://myaccount.google.com/apppasswords

# Test email connection
curl -X GET http://localhost:5000/api/email/test
```

---

## 🔐 Security Notes

1. **Never commit `.env` file** to git
2. **Change default passwords** in production:
   - MONGO_PASSWORD
   - REDIS_PASSWORD
   - JWT_SECRET
3. **Use strong credentials** for external services
4. **Keep VNPay credentials secret** (use environment variables)
5. **Rotate JWT_SECRET** periodically

---

## 📚 Documentation

- **Full Setup Guide**: `docs/DOCKER_SETUP.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **API Endpoints**: See individual route files in `src/routes/`
- **Database Schema**: See models in `src/3_DataAccess/Models/`

---

## 🎯 Next Steps

1. Install packages: `npm install`
2. Configure `.env` with your API keys
3. Start Docker: `docker-compose up -d`
4. Test API endpoints
5. Check logs for any errors
6. Proceed to remaining phases (5, 6, 8, 9)

---

## 📞 Need Help?

Check the comprehensive guide:
```bash
cat docs/DOCKER_SETUP.md
cat IMPLEMENTATION_SUMMARY.md
```

---

**Backend Version**: 3.1.0  
**Last Updated**: 2026-06-10  
**Status**: Production-Ready MVP
