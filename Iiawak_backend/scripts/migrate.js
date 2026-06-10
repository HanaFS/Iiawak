/**
 * Database Migration System
 * Tracks and applies database schema/data migrations
 * Usage: 
 *   node scripts/migrate.js up     (apply pending migrations)
 *   node scripts/migrate.js down   (rollback last migration)
 *   node scripts/migrate.js status (show migration status)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const logger = require('../src/4_Core/Logger/logger');
require('dotenv').config();

// Migration tracking model
const migrationSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  executedAt: { type: Date, default: Date.now },
  duration: { type: Number }, // milliseconds
  status: { type: String, enum: ['up', 'down'], default: 'up' },
});

const Migration = mongoose.model('Migration', migrationSchema);

/**
 * Migration 001: Add VNPay fields to Transaction
 */
const migration001 = {
  name: '001_add_vnpay_to_transaction',
  async up(db) {
    logger.info('🔄 Migration 001: Adding VNPay fields to Transaction...');
    const Transaction = db.model('Transaction');
    await Transaction.updateMany(
      {},
      {
        $set: {
          paymentMethod: 'VNPAY',
          vnp_ResponseCode: null,
          refundReason: null,
        },
      }
    );
    logger.info('✅ Migration 001 completed');
  },
  async down(db) {
    logger.warn('⏮️  Rollback: Removing VNPay fields from Transaction...');
    const Transaction = db.model('Transaction');
    await Transaction.updateMany(
      {},
      {
        $unset: {
          paymentMethod: '',
          vnp_TransactionNo: '',
          vnp_BankCode: '',
          vnp_BankTranNo: '',
          vnp_PayDate: '',
          vnp_ResponseCode: '',
          refundReason: '',
          refundedAt: '',
        },
      }
    );
    logger.info('✅ Rollback completed');
  },
};

/**
 * Migration 002: Add notification preferences to User
 */
const migration002 = {
  name: '002_add_notification_preferences',
  async up(db) {
    logger.info('🔄 Migration 002: Adding notification preferences to User...');
    const User = db.model('User');
    await User.updateMany(
      { preferences: { $exists: false } },
      {
        $set: {
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            inAppNotifications: true,
          },
        },
      }
    );
    logger.info('✅ Migration 002 completed');
  },
  async down(db) {
    logger.warn('⏮️  Rollback: Removing notification preferences from User...');
    const User = db.model('User');
    await User.updateMany({}, { $unset: { preferences: '' } });
    logger.info('✅ Rollback completed');
  },
};

/**
 * Migration 003: Create Notification model indexes
 */
const migration003 = {
  name: '003_create_notification_indexes',
  async up(db) {
    logger.info('🔄 Migration 003: Creating Notification indexes...');
    const Notification = db.model('Notification');
    await Notification.collection.createIndex({ userId: 1, read: 1, createdAt: -1 });
    logger.info('✅ Migration 003 completed');
  },
  async down(db) {
    logger.warn('⏮️  Rollback: Removing Notification indexes...');
    const Notification = db.model('Notification');
    await Notification.collection.dropIndex('userId_1_read_1_createdAt_-1');
    logger.info('✅ Rollback completed');
  },
};

/**
 * Migration 004: Backup existing data
 */
const migration004 = {
  name: '004_backup_before_phase5',
  async up(db) {
    logger.info('🔄 Migration 004: Backing up data...');
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

    // Export collections
    const User = db.model('User');
    const Transaction = db.model('Transaction');

    const userData = await User.find().lean();
    const transactionData = await Transaction.find().lean();

    const backup = { timestamp, userData, transactionData };
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    logger.info(`✅ Backup created: ${backupFile}`);
  },
  async down(db) {
    logger.warn('⏮️  Rollback: Backup cannot be rolled back');
  },
};

const migrations = [migration001, migration002, migration003, migration004];

/**
 * Get applied migrations
 */
const getAppliedMigrations = async () => {
  return await Migration.find().sort({ executedAt: -1 });
};

/**
 * Get pending migrations
 */
const getPendingMigrations = async () => {
  const applied = await getAppliedMigrations();
  const appliedNames = applied.map((m) => m.name);
  return migrations.filter((m) => !appliedNames.includes(m.name));
};

/**
 * Apply pending migrations (UP)
 */
const migrateUp = async () => {
  try {
    logger.info('🚀 Starting migrations...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iiawak');

    const pending = await getPendingMigrations();

    if (pending.length === 0) {
      logger.info('✅ All migrations already applied');
      await mongoose.connection.close();
      return;
    }

    logger.info(`📊 Found ${pending.length} pending migration(s)\n`);

    for (const migration of pending) {
      try {
        const startTime = Date.now();
        logger.info(`\n⏳ Applying: ${migration.name}`);

        await migration.up(mongoose);

        const duration = Date.now() - startTime;
        await Migration.create({
          name: migration.name,
          status: 'up',
          duration,
        });

        logger.info(`✅ Applied: ${migration.name} (${duration}ms)\n`);
      } catch (error) {
        logger.error(`❌ Migration failed: ${migration.name}`);
        logger.error(`Error: ${error.message}`);
        throw error;
      }
    }

    logger.info('\n🎉 All migrations applied successfully!');
    await mongoose.connection.close();
  } catch (error) {
    logger.error(`Migration error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Rollback last migration (DOWN)
 */
const migrateDown = async () => {
  try {
    logger.info('🔙 Rollback started...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iiawak');

    const applied = await getAppliedMigrations();

    if (applied.length === 0) {
      logger.info('ℹ️  No migrations to rollback');
      await mongoose.connection.close();
      return;
    }

    const lastMigration = applied[0];
    const migration = migrations.find((m) => m.name === lastMigration.name);

    if (!migration) {
      logger.error(`Migration not found: ${lastMigration.name}`);
      process.exit(1);
    }

    try {
      logger.info(`⏳ Rollback: ${migration.name}`);
      await migration.down(mongoose);

      await Migration.deleteOne({ name: migration.name });
      logger.info(`✅ Rolled back: ${migration.name}`);
    } catch (error) {
      logger.error(`❌ Rollback failed: ${migration.name}`);
      logger.error(`Error: ${error.message}`);
      throw error;
    }

    logger.info('\n✅ Rollback completed!');
    await mongoose.connection.close();
  } catch (error) {
    logger.error(`Rollback error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Show migration status
 */
const migrateStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iiawak');

    const applied = await getAppliedMigrations();
    const pending = await getPendingMigrations();

    logger.info('\n📊 MIGRATION STATUS\n');
    logger.info(`Total Migrations: ${migrations.length}`);
    logger.info(`Applied: ${applied.length}`);
    logger.info(`Pending: ${pending.length}\n`);

    if (applied.length > 0) {
      logger.info('✅ Applied Migrations:');
      applied.forEach((m) => {
        logger.info(`  - ${m.name} (${m.executedAt}) - ${m.duration}ms`);
      });
    }

    if (pending.length > 0) {
      logger.info('\n⏳ Pending Migrations:');
      pending.forEach((m) => {
        logger.info(`  - ${m.name}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    logger.error(`Status error: ${error.message}`);
    process.exit(1);
  }
};

// CLI Interface
const command = process.argv[2] || 'status';

switch (command) {
  case 'up':
    migrateUp();
    break;
  case 'down':
    migrateDown();
    break;
  case 'status':
    migrateStatus();
    break;
  default:
    logger.error(`Unknown command: ${command}`);
    logger.info('Usage: node scripts/migrate.js [up|down|status]');
    process.exit(1);
}

module.exports = { migrateUp, migrateDown, migrateStatus };
