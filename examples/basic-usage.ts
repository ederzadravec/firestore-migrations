/**
 * Example: Basic Usage
 *
 * This example shows the most basic usage of the migration system
 */

import { MigrationService, IMigrationScript, IFirestoreAdapter, IQueryOptions } from '../index'

// 1. Create your Firestore adapter
const myAdapter: IFirestoreAdapter = {
  async getItems(collection, options?: IQueryOptions) {
    // Your implementation with optional filters
    // options?.filters - array of { field, operator, value }
    // options?.orderBy - { field, direction }
    // options?.limit - max items to return
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
    // Your implementation - update single document by ID
  },
  async updateItems(collection, data, options: IQueryOptions) {
    // Your implementation - update multiple documents matching filters
    // Returns number of updated documents
    return 0
  },
  async deleteItemById(collection, id) {
    // Your implementation - delete single document by ID
  },
  async deleteItems(collection, options: IQueryOptions) {
    // Your implementation - delete multiple documents matching filters
    // Returns number of deleted documents
    return 0
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

// ============================================================================
// Example: Using filters with the adapter
// ============================================================================

async function examplesWithFilters() {
  // Get items with filters
  const activeUsers = await myAdapter.getItems('users', {
    filters: [
      { field: 'status', operator: '==', value: 'active' },
      { field: 'age', operator: '>=', value: 18 },
    ],
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 100,
  })

  // Update multiple items matching filters
  const updatedCount = await myAdapter.updateItems(
    'users',
    { lastNotified: new Date() },
    {
      filters: [{ field: 'status', operator: '==', value: 'active' }],
    }
  )
  console.log(`Updated ${updatedCount} active users`)

  // Delete multiple items matching filters
  const deletedCount = await myAdapter.deleteItems('sessions', {
    filters: [{ field: 'expiresAt', operator: '<', value: new Date() }],
  })
  console.log(`Deleted ${deletedCount} expired sessions`)
}
