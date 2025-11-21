/**
 * Script completo de exemplo: Como executar migrations em um projeto
 *
 * Este arquivo demonstra como configurar e executar migrations
 * em um projeto Firebase usando lib-migrations
 */

import * as admin from "firebase-admin";
import {
  MigrationService,
  FirebaseAdminAdapter,
  IMigrationScript,
} from "../../lib-migrations";

// ============================================================================
// 1. INICIALIZAR FIREBASE ADMIN
// ============================================================================

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // ou
    // credential: admin.credential.cert(serviceAccount),
  });
}

// ============================================================================
// 2. CRIAR ADAPTER
// ============================================================================

const firestoreAdapter = new FirebaseAdminAdapter();

// ============================================================================
// 3. CRIAR MIGRATION SERVICE
// ============================================================================

const migrationService = new MigrationService({
  firestoreAdapter,
  migrationsCollection: "migrations", // opcional
});

// ============================================================================
// 4. DEFINIR MIGRATIONS (normalmente importadas de migrations/index.ts)
// ============================================================================

const addEmailField: IMigrationScript = {
  id: "20250121120000_add_email_field",
  name: "Add email verified field",
  description: "Add email_verified field to all users",

  async up() {
    console.log("  📝 Adding email_verified field to users...");

    const users = await firestoreAdapter.getItems("users");
    let updated = 0;

    for (const user of users) {
      await firestoreAdapter.updateItemById("users", user.id, {
        email_verified: false,
      });
      updated++;
    }

    console.log(`  ✅ Updated ${updated} users`);
  },

  async down() {
    console.log("  📝 Removing email_verified field from users...");

    const users = await firestoreAdapter.getItems("users");
    let reverted = 0;

    for (const user of users) {
      await firestoreAdapter.updateItemById("users", user.id, {
        email_verified: admin.firestore.FieldValue.delete(),
      });
      reverted++;
    }

    console.log(`  ✅ Reverted ${reverted} users`);
  },

  async validate() {
    // Optional: Check if collection exists, etc.
    return true;
  },
};

const migrations: IMigrationScript[] = [addEmailField];

// ============================================================================
// 5. FUNÇÕES UTILITÁRIAS
// ============================================================================

async function showMigrationStatus() {
  console.log("\n📊 Migration Status\n");

  const executed = await migrationService.getExecutedMigrations();
  const pending = await migrationService.getPendingMigrations(migrations);

  console.log(`Total migrations: ${migrations.length}`);
  console.log(`Executed: ${executed.length}`);
  console.log(`Pending: ${pending.length}\n`);

  if (executed.length > 0) {
    console.log("Executed migrations:");
    executed.forEach((m) => {
      console.log(`  ✅ ${m.name} (${m.status}) - ${m.executedAt}`);
    });
    console.log();
  }

  if (pending.length > 0) {
    console.log("Pending migrations:");
    pending.forEach((m) => {
      console.log(`  ⏳ ${m.name}`);
    });
    console.log();
  }
}

async function runPendingMigrations() {
  console.log("\n🚀 Running Pending Migrations\n");

  const pending = await migrationService.getPendingMigrations(migrations);

  if (pending.length === 0) {
    console.log("✅ No pending migrations\n");
    return;
  }

  for (const migration of pending) {
    console.log(`\nExecuting: ${migration.name}`);
    console.log(`ID: ${migration.id}`);
    console.log(`Description: ${migration.description}\n`);

    const result = await migrationService.executeMigration(
      migration,
      "admin@example.com"
    );

    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`   Execution time: ${result.executionTimeMs}ms\n`);
    } else {
      console.error(`❌ ${result.message}\n`);
      if (result.error) {
        console.error("Error details:", result.error);
      }
      throw new Error("Migration failed");
    }
  }

  console.log("🎉 All migrations completed successfully!\n");
}

async function rollbackLastMigration() {
  console.log("\n⏪ Rolling Back Last Migration\n");

  const executed = await migrationService.getExecutedMigrations();
  const completedMigrations = executed.filter((m) => m.status === "completed");

  if (completedMigrations.length === 0) {
    console.log("ℹ️  No migrations to rollback\n");
    return;
  }

  // Get last executed migration
  const last = completedMigrations.sort(
    (a, b) => b.executedAt.getTime() - a.executedAt.getTime()
  )[0];

  console.log(`Found last migration: ${last.name}`);

  // Find migration script
  const migrationScript = migrations.find((m) => m.id === last.id);

  if (!migrationScript) {
    console.error("❌ Migration script not found for:", last.id);
    return;
  }

  console.log(`Rolling back: ${migrationScript.name}\n`);

  const result = await migrationService.rollbackMigration(
    migrationScript,
    "admin@example.com"
  );

  if (result.success) {
    console.log(`✅ ${result.message}`);
    console.log(`   Rollback time: ${result.executionTimeMs}ms\n`);
  } else {
    console.error(`❌ ${result.message}\n`);
    if (result.error) {
      console.error("Error details:", result.error);
    }
  }
}

async function verifyMigrationIntegrity() {
  console.log("\n🔍 Verifying Migration Integrity\n");

  const executed = await migrationService.getExecutedMigrations();

  for (const executedMigration of executed) {
    if (executedMigration.status !== "completed") continue;

    const script = migrations.find((m) => m.id === executedMigration.id);
    if (!script) {
      console.log(`⚠️  Migration script not found: ${executedMigration.id}`);
      continue;
    }

    const isValid = await migrationService.verifyMigrationChecksum(script);
    if (isValid) {
      console.log(`✅ ${executedMigration.name} - Checksum valid`);
    } else {
      console.log(
        `⚠️  ${executedMigration.name} - Checksum mismatch (code changed!)`
      );
    }
  }

  console.log();
}

// ============================================================================
// 6. MAIN FUNCTION - CLI
// ============================================================================

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case "status":
        await showMigrationStatus();
        break;

      case "run":
      case "migrate":
        await runPendingMigrations();
        break;

      case "rollback":
        await rollbackLastMigration();
        break;

      case "verify":
        await verifyMigrationIntegrity();
        break;

      default:
        console.log(`
🔧 Migration Runner

Usage:
  ts-node complete-example.ts <command>

Commands:
  status      Show migration status
  run         Run pending migrations
  rollback    Rollback last migration
  verify      Verify migration integrity

Examples:
  ts-node complete-example.ts status
  ts-node complete-example.ts run
  ts-node complete-example.ts rollback
        `);
    }
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("✅ Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

// Export for use in other scripts
export { migrationService, migrations, firestoreAdapter };
