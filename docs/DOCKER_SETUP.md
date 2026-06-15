# Iiawak Backend — Docker Setup Guide

## Prerequisites

Ensure you have installed:
- **Docker**: https://docs.docker.com/get-docker/
- **Docker Compose**: https://docs.docker.com/compose/install/

## Quick Start

### 1. Clone Environment Variables

Copy the example environment file:

```bash
cp Iiawak_backend/.env.example Iiawak_backend/.env
```

Edit `Iiawak_backend/.env` and fill in your credentials:
- `GEMINI_API_KEY` — Google Gemini API key
- `CLOUDINARY_*` — Cloudinary credentials
- `VNPAY_*` — VNPay merchant credentials (if using payments)

### 2. Create Docker Compose Override (Optional)

For local development, you can create a `.env` file in the root directory:

```bash
cat > .env << EOF
# MongoDB
MONGO_USERNAME=admin
MONGO_PASSWORD=admin123

# Redis
REDIS_PASSWORD=redis123

# Node Environment
NODE_ENV=development

# Other services
GEMINI_API_KEY=your_key
CLOUDINARY_CLOUD_NAME=your_name
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
EOF
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- **MongoDB** on port `27017`
- **Redis** on port `6379`
- **Backend API** on port `5000`

### 4. Verify Services

Check that all containers are running:

```bash
docker-compose ps
```

Expected output:
```
NAME              STATUS              PORTS
iiawak-mongodb    Up (healthy)        27017/tcp
iiawak-redis      Up (healthy)        6379/tcp
iiawak-backend    Up (healthy)        0.0.0.0:5000->5000/tcp
```

### 5. Test API

```bash
curl http://localhost:5000/
```

Expected response:
```json
{
  "message": "🚀 Iiawak API v3.0 — Kiến trúc 5 lớp",
  "status": "ok",
  "timestamp": "2026-06-10T..."
}
```

### 6. View Logs

View backend logs:

```bash
docker-compose logs -f backend
```

View all logs:

```bash
docker-compose logs -f
```

---

## Common Commands

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove All Data (Reset)

```bash
docker-compose down -v
```

### Rebuild Docker Image

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Execute Command in Backend Container

```bash
docker-compose exec backend npm run seed
```

### Access MongoDB Shell

```bash
docker-compose exec mongodb mongosh -u admin -p admin123
```

### Access Redis CLI

```bash
docker-compose exec redis redis-cli -a redis123
```

---

## Development Workflow

### 1. Edit Code Locally

The `Iiawak_backend` folder is volume-mounted, so changes are reflected immediately:

```bash
vim Iiawak_backend/src/server.js
# Changes auto-reload (if nodemon is installed)
```

### 2. Install New Package

```bash
cd Iiawak_backend
npm install some-package
cd ..
docker-compose restart backend
```

### 3. Database Seeding

Run the seed script inside container:

```bash
docker-compose exec backend node scripts/seed.js
```

### 4. Database Migrations

If needed, run migrations:

```bash
docker-compose exec backend npm run migrate
```

---

## Production Deployment

### 1. Build Docker Image

```bash
docker build -t iiawak-backend:1.0.0 .
```

### 2. Push to Registry

```bash
docker tag iiawak-backend:1.0.0 your-registry/iiawak-backend:1.0.0
docker push your-registry/iiawak-backend:1.0.0
```

### 3. Deploy on Server

Use the production docker-compose file (recommended to use Kubernetes or managed services):

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Health Checks

The container includes built-in health checks:

```bash
docker inspect --format='{{.State.Health.Status}}' iiawak-backend
```

---

## Troubleshooting

### Container Won't Start

Check logs:

```bash
docker-compose logs backend
```

Common issues:
- `PORT 5000 already in use` → Change `PORT` in `.env`
- `Cannot connect to MongoDB` → Ensure MongoDB container started (check `docker-compose ps`)
- `EADDRINUSE: address already in use` → Kill existing process on port 5000

### MongoDB Connection Failed

```bash
docker-compose logs mongodb
```

Fix:
```bash
docker-compose down -v
docker-compose up -d mongodb
# Wait 30 seconds for MongoDB to initialize
docker-compose up -d
```

### Redis Connection Failed

```bash
docker-compose logs redis
```

Test connection:

```bash
docker-compose exec redis redis-cli -a redis123 ping
# Should return: PONG
```

### Application Memory Usage Too High

Redis or MongoDB using too much memory:

```bash
docker stats
```

Reduce memory limits in `docker-compose.yml`:

```yaml
services:
  mongodb:
    deploy:
      resources:
        limits:
          memory: 512M
  redis:
    deploy:
      resources:
        limits:
          memory: 256M
```

---

## Monitoring

### CPU & Memory Usage

```bash
docker stats iiawak-backend
```

### Network Usage

```bash
docker exec iiawak-backend ifstat 1
```

### Check Container Logs

```bash
docker-compose logs --tail=100 backend
```

---

## Performance Optimization

### 1. Enable Redis Persistence

Redis AOF (Append-Only File) is already enabled in docker-compose.yml.

### 2. MongoDB Indexes

Create indexes for faster queries:

```bash
docker-compose exec backend node scripts/createIndexes.js
```

### 3. Caching Strategy

Ensure caching middleware is enabled:
- User profiles: 1-hour TTL
- Feed: 5-minute TTL
- Packages: 1-hour TTL

---

## Security Best Practices

1. **Change Default Passwords** in `.env`:
   ```env
   MONGO_PASSWORD=your_secure_password_here
   REDIS_PASSWORD=your_secure_password_here
   JWT_SECRET=your_very_long_secret_key_here
   ```

2. **Use Environment Secrets** in production (not in `.env` file):
   - Use Docker Secrets
   - Use Kubernetes Secrets
   - Use Cloud provider secrets (AWS Secrets Manager, GCP Secret Manager)

3. **Network Isolation**:
   - Containers communicate via internal network
   - MongoDB/Redis are not exposed to the internet (no public ports)
   - Only Backend API is exposed on port 5000

4. **Run as Non-Root User**:
   - Backend runs as `nodejs` user (UID 1001)

---

## Next Steps

- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure production database (MongoDB Atlas)
- [ ] Set up Redis cluster for scaling
- [ ] Implement monitoring (Prometheus, Grafana)
- [ ] Set up log aggregation (ELK Stack, DataDog)
- [ ] Configure SSL/TLS (Let's Encrypt)

---

## Support

For issues or questions:
1. Check Docker logs: `docker-compose logs`
2. Review `.env` configuration
3. Ensure all services are healthy: `docker-compose ps`
4. Restart services: `docker-compose restart`

---

Last Updated: 2026-06-10
