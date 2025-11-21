/**
 * Example: Basic Usage
 *
 * This example shows the most basic usage of the migration system
 */

import { MigrationService, IMigrationScript, IFirestoreAdapter } from '../index'

// 1. Create your Firestore adapter
const myAdapter: IFirestoreAdapter = {
  async getItems(collection) {
    // Your implementation
    return []
  },
  async getItemById(collection, id) {
    // Your implementation
    return { id } as any
  },
  async createItemWithId(collection, id, data) {
    // Your implementation
    return id
  },
  async updateItemById(collection, id, data) {
    // Your implementation
  },
  async deleteItemById(collection, id) {
    // Your implementation
  },
}

// 2. Initialize migration service
const migrationService = new MigrationService({
  firestoreAdapter: myAdapter,
  migrationsCollection: 'migrations', // optional
})

// 3. Define a migration
const myMigration: IMigrationScript = {
  id: '20250121120000_add_field',
  name: 'Add new field',
  description: 'Adds a new field to all documents',

  async up() {
    console.log('Executing migration...')
    const items = await myAdapter.getItems('my_collection')

    for (const item of items) {
      await myAdapter.updateItemById('my_collection', item.id, {
        new_field: 'default_value',
      })
    }
  },

  async down() {
    console.log('Rolling back migration...')
    // Rollback logic
  },
}

// 4. Execute migration
async function runMigration() {
  const result = await migrationService.executeMigration(myMigration, 'admin')

  if (result.success) {
    console.log(`✓ Migration completed in ${result.executionTimeMs}ms`)
  } else {
    console.error(`✗ Migration failed: ${result.message}`)
  }
}

// Run it
runMigration()
