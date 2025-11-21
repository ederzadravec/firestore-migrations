/**
 * Example: Batch Operations
 *
 * Shows how to use Firestore batch writes for better performance
 */

import * as admin from 'firebase-admin'
import { IMigrationScript } from '../index'

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
