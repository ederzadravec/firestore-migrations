/**
 * Example: Batch Operations
 *
 * Shows how to use Firestore batch writes for better performance
 *
 * NOTE: The FirebaseAdminAdapter now has built-in batch methods:
 * - updateItems(collection, data, options) - updates multiple docs matching filters
 * - deleteItems(collection, options) - deletes multiple docs matching filters
 *
 * These methods use Firestore batches internally, so for most use cases
 * you can use the adapter directly instead of manual batch operations.
 */

import * as admin from 'firebase-admin'
import { IMigrationScript, IFirestoreAdapter } from '../index'

const BATCH_SIZE = 500 // Firestore batch limit

export const batchMigration: IMigrationScript = {
  id: '20250121120100_batch_update',
  name: 'Batch update user status',
  description: 'Updates user status using batched writes for performance',

  async up() {
    console.log('Starting batch migration')

    // Get all users that need updating
    const snapshot = await admin
      .firestore()
      .collection('users')
      .where('status', '==', 'pending')
      .get()

    const users = snapshot.docs
    console.log(`Found ${users.length} users to update`)

    const db = admin.firestore()
    let totalUpdated = 0

    // Process in batches
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const batchUsers = users.slice(i, i + BATCH_SIZE)

      for (const userDoc of batchUsers) {
        batch.update(userDoc.ref, {
          status: 'active',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })
      }

      await batch.commit()
      totalUpdated += batchUsers.length

      console.log(`Progress: ${totalUpdated}/${users.length}`)
    }

    console.log(`Batch migration completed: ${totalUpdated} users updated`)
  },

  async down() {
    console.log('Starting batch rollback')

    const snapshot = await admin
      .firestore()
      .collection('users')
      .where('status', '==', 'active')
      .get()

    const users = snapshot.docs
    const db = admin.firestore()
    let totalReverted = 0

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const batchUsers = users.slice(i, i + BATCH_SIZE)

      for (const userDoc of batchUsers) {
        batch.update(userDoc.ref, {
          status: 'pending',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })
      }

      await batch.commit()
      totalReverted += batchUsers.length

      console.log(`Rollback progress: ${totalReverted}/${users.length}`)
    }

    console.log(`Batch rollback completed: ${totalReverted} users reverted`)
  },
}

// ============================================================================
// Alternative: Using the adapter's built-in batch methods
// ============================================================================

/**
 * Simplified migration using adapter's updateItems and deleteItems
 * These methods handle batching internally
 */
export const simplifiedBatchMigration: IMigrationScript = {
  id: '20250121120200_simplified_batch_update',
  name: 'Simplified batch update using adapter',
  description: 'Updates user status using adapter built-in batch methods',

  async up(adapter: IFirestoreAdapter) {
    console.log('Starting simplified batch migration')

    // Update all pending users to active in one call
    // The adapter handles batching internally
    const updatedCount = await adapter.updateItems(
      'users',
      {
        status: 'active',
        updated_at: new Date(),
      },
      {
        filters: [{ field: 'status', operator: '==', value: 'pending' }],
      }
    )

    console.log(`Simplified batch migration completed: ${updatedCount} users updated`)
  },

  async down(adapter: IFirestoreAdapter) {
    console.log('Starting simplified batch rollback')

    // Revert all active users to pending
    const revertedCount = await adapter.updateItems(
      'users',
      {
        status: 'pending',
        updated_at: new Date(),
      },
      {
        filters: [{ field: 'status', operator: '==', value: 'active' }],
      }
    )

    console.log(`Simplified batch rollback completed: ${revertedCount} users reverted`)
  },
}

/**
 * Example: Bulk delete expired sessions
 */
export const deleteExpiredSessionsMigration: IMigrationScript = {
  id: '20250121120300_delete_expired_sessions',
  name: 'Delete expired sessions',
  description: 'Removes all expired sessions from the database',

  async up(adapter: IFirestoreAdapter) {
    console.log('Deleting expired sessions...')

    const deletedCount = await adapter.deleteItems('sessions', {
      filters: [{ field: 'expiresAt', operator: '<', value: new Date() }],
    })

    console.log(`Deleted ${deletedCount} expired sessions`)
  },

  async down() {
    // Cannot restore deleted sessions
    console.log('Warning: Deleted sessions cannot be restored')
  },
}
