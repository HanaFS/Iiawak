#!/bin/bash

# Database Backup & Restore Script
# Usage:
#   ./scripts/backup.sh backup    (create backup)
#   ./scripts/backup.sh restore   (restore from backup)
#   ./scripts/backup.sh list      (list backups)
#   ./scripts/backup.sh clean     (delete old backups)

set -e

BACKUP_DIR="./backups"
MONGODB_URI="${MONGODB_URI:-mongodb://admin:admin123@localhost:27017/iiawak}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/iiawak_backup_$TIMESTAMP.archive"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

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

# Backup MongoDB database
backup() {
  log_info "Starting backup..."

  if ! command -v mongodump &> /dev/null; then
    log_error "mongodump not found. Install MongoDB tools first."
  fi

  mongodump \
    --uri="$MONGODB_URI" \
    --archive="$BACKUP_FILE" \
    --gzip \
    --verbose 2>/dev/null || log_error "Backup failed"

  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
}

# Restore MongoDB database from backup
restore() {
  if [ -z "$1" ]; then
    log_error "Please provide backup file path"
  fi

  if [ ! -f "$1" ]; then
    log_error "Backup file not found: $1"
  fi

  log_info "Restoring from backup..."

  if ! command -v mongorestore &> /dev/null; then
    log_error "mongorestore not found. Install MongoDB tools first."
  fi

  mongorestore \
    --uri="$MONGODB_URI" \
    --archive="$1" \
    --gzip \
    --drop \
    --verbose 2>/dev/null || log_error "Restore failed"

  log_success "Database restored from: $1"
}

# List all backups
list_backups() {
  log_info "Available backups:\n"

  if [ ! "$(ls -A $BACKUP_DIR)" ]; then
    log_error "No backups found in $BACKUP_DIR"
  fi

  ls -lhS "$BACKUP_DIR"/*.archive 2>/dev/null | awk '{print $9, "(" $5 ")"}'
}

# Clean old backups (keep last 7 days)
clean_backups() {
  log_info "Cleaning backups older than 7 days..."

  DELETED_COUNT=0
  while IFS= read -r file; do
    rm -f "$file"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log_success "Deleted: $file"
  done < <(find "$BACKUP_DIR" -name "*.archive" -mtime +7 -type f)

  if [ $DELETED_COUNT -eq 0 ]; then
    log_info "No old backups to clean"
  else
    log_success "Cleaned up $DELETED_COUNT old backup(s)"
  fi
}

# Get backup statistics
stats() {
  log_info "Backup Statistics:\n"

  TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "*.archive" -type f | wc -l)
  TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.archive 2>/dev/null | head -1)

  echo "Total Backups: $TOTAL_BACKUPS"
  echo "Total Size: $TOTAL_SIZE"

  if [ -n "$LATEST_BACKUP" ]; then
    LATEST_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LATEST_BACKUP" 2>/dev/null || stat -c "%y" "$LATEST_BACKUP" | cut -d. -f1)
    echo "Latest Backup: $LATEST_BACKUP ($LATEST_TIME)"
  fi
}

# Main command handler
case "${1:-backup}" in
  backup)
    backup
    ;;
  restore)
    restore "$2"
    ;;
  list)
    list_backups
    ;;
  clean)
    clean_backups
    ;;
  stats)
    stats
    ;;
  *)
    log_error "Unknown command: $1\nUsage: ./scripts/backup.sh [backup|restore|list|clean|stats]"
    ;;
esac
