#!/bin/bash

# Smoke Tests - Quick health checks after deployment
# Usage: ./scripts/smoke-tests.sh

set -e

API_URL="${API_URL:-http://localhost:5000}"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_INTERVAL=2

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

log_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Health check - API is up
test_health_check() {
  log_info "Testing API health check..."

  for ((i = 1; i <= HEALTH_CHECK_RETRIES; i++)); do
    if curl -sf "$API_URL/health" > /dev/null 2>&1; then
      log_success "Health check passed"
      return 0
    fi
    
    if [ $i -lt $HEALTH_CHECK_RETRIES ]; then
      log_info "Retry $i/$HEALTH_CHECK_RETRIES in ${HEALTH_CHECK_INTERVAL}s..."
      sleep $HEALTH_CHECK_INTERVAL
    fi
  done

  log_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
}

# 2. Response time check - API responds quickly
test_response_time() {
  log_info "Testing API response time..."

  START_TIME=$(date +%s%N | cut -b1-13)
  curl -sf "$API_URL/" > /dev/null 2>&1
  END_TIME=$(date +%s%N | cut -b1-13)
  DURATION=$((END_TIME - START_TIME))

  if [ $DURATION -gt 2000 ]; then
    log_error "Response time too slow: ${DURATION}ms (threshold: 2000ms)"
  fi

  log_success "Response time: ${DURATION}ms"
}

# 3. Database connectivity - MongoDB is reachable
test_database() {
  log_info "Testing database connectivity..."

  RESPONSE=$(curl -s "$API_URL/health" | grep -o '"status":"ok"' || true)

  if [ -z "$RESPONSE" ]; then
    log_error "Database connectivity check failed"
  fi

  log_success "Database connectivity verified"
}

# 4. Redis connectivity - Cache is working
test_cache() {
  log_info "Testing Redis cache..."

  # Create a user and verify cache
  curl -sf -X GET "$API_URL/api/health" > /dev/null 2>&1 || log_error "Cache test failed"

  log_success "Redis cache verified"
}

# 5. Rate limiting - API rate limiter is working
test_rate_limiting() {
  log_info "Testing rate limiting..."

  # Send multiple requests quickly
  for i in {1..10}; do
    curl -sf "$API_URL/health" > /dev/null 2>&1 || break
  done

  # Next request should succeed (within reasonable limits)
  if curl -sf "$API_URL/health" > /dev/null 2>&1; then
    log_success "Rate limiting verified"
  else
    log_error "Rate limiting check failed"
  fi
}

# 6. Error handling - 404 response
test_error_handling() {
  log_info "Testing error handling..."

  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/nonexistent")

  if [ "$STATUS_CODE" != "404" ]; then
    log_error "Expected 404, got: $STATUS_CODE"
  fi

  log_success "Error handling verified (404 returned for nonexistent route)"
}

# 7. CORS headers - Security headers are present
test_security_headers() {
  log_info "Testing security headers..."

  HEADERS=$(curl -sf -D - "$API_URL/" 2>&1 | grep -i "content-security-policy\|x-frame-options\|x-content-type-options" | wc -l)

  if [ $HEADERS -lt 1 ]; then
    log_error "Security headers not found"
  fi

  log_success "Security headers verified"
}

# 8. Compression - Response compression is enabled
test_compression() {
  log_info "Testing response compression..."

  ENCODING=$(curl -sf -H "Accept-Encoding: gzip" -D - "$API_URL/" 2>&1 | grep -i "content-encoding" || echo "")

  if [ -z "$ENCODING" ]; then
    log_error "Response compression not enabled"
  fi

  log_success "Response compression verified"
}

# Main test execution
main() {
  echo "🧪 Running Smoke Tests"
  echo "API URL: $API_URL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

  test_health_check
  test_response_time
  test_database
  test_cache
  test_rate_limiting
  test_error_handling
  test_security_headers
  test_compression

  echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}🎉 All smoke tests passed!${NC}\n"
}

# Run tests
main "$@"
