/**
 * Example: Firebase Admin SDK
 *
 * Complete example using Firebase Admin SDK
 */

import * as admin from 'firebase-admin'
import { MigrationService, IFirestoreAdapter, IMigrationScript, IQueryOptions } from '../index'

// Initialize Firebase Admin
admin.initializeApp()

// Create Firestore Adapter
class FirestoreAdapter implements IFirestoreAdapter {
  private applyFilters(
    query: admin.firestore.Query,
    options?: IQueryOptions
  ): admin.firestore.Query {
    let result = query

    if (options?.filters) {
      for (const filter of options.filters) {
        result = result.where(filter.field, filter.operator, filter.value)
      }
    }

    if (options?.orderBy) {
      result = result.orderBy(options.orderBy.field, options.orderBy.direction || 'asc')
    }

    if (options?.limit) {
      result = result.limit(options.limit)
    }

    return result
  }

  async getItems<T>(collection: string, options?: IQueryOptions) {
    let query: admin.firestore.Query = admin.firestore().collection(collection)
    query = this.applyFilters(query, options)

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }))
  }

  async getItemById<T>(collection: string, id: string) {
    const doc = await admin.firestore().collection(collection).doc(id).get()
    if (!doc.exists) throw new Error(`Document not found: ${collection}/${id}`)
    return { ...(doc.data() as T), id: doc.id }
  }

  async createItemWithId(collection: string, id: string, data: any) {
    await admin.firestore().collection(collection).doc(id).set(data)
    return id
  }

  async updateItemById(collection: string, id: string, data: any) {
    await admin.firestore().collection(collection).doc(id).update(data)
  }

  async updateItems(collection: string, data: any, options: IQueryOptions) {
    let query: admin.firestore.Query = admin.firestore().collection(collection)
    query = this.applyFilters(query, options)

    const snapshot = await query.get()
    const batch = admin.firestore().batch()
    let count = 0

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, data)
      count++
    })

    await batch.commit()
    return count
  }

  async deleteItemById(collection: string, id: string) {
    return await admin.firestore().collection(collection).doc(id).delete()
  }

  async deleteItems(collection: string, options: IQueryOptions) {
    let query: admin.firestore.Query = admin.firestore().collection(collection)
    query = this.applyFilters(query, options)

    const snapshot = await query.get()
    const batch = admin.firestore().batch()
    let count = 0

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
      count++
    })

    await batch.commit()
    return count
  }
}

// Initialize service
const firestoreAdapter = new FirestoreAdapter()
const migrationService = new MigrationService({
  firestoreAdapter,
})

// Define migration
const addEmailVerified: IMigrationScript = {
  id: '20250121120000_add_email_verified',
  name: 'Add email verified field',
  description: 'Adds email_verified boolean to all users',

  async up() {
    console.log('Starting migration: Add email verified field')

    const users = await firestoreAdapter.getItems('users')
    console.log(`Found ${users.length} users to update`)

    let updated = 0
    for (const user of users) {
      if (!('email_verified' in user)) {
        await firestoreAdapter.updateItemById('users', user.id, {
          email_verified: false,
          updated_at: new Date(),
        })
        updated++
      }
    }

    console.log(`Migration completed: Updated ${updated} users`)
  },

  async down() {
    console.log('Starting rollback: Remove email verified field')

    const users = await firestoreAdapter.getItems('users')

    for (const user of users) {
      if ('email_verified' in user) {
        await firestoreAdapter.updateItemById('users', user.id, {
          email_verified: admin.firestore.FieldValue.delete() as any,
        })
      }
    }

    console.log('Rollback completed')
  },

  async validate() {
    try {
      await firestoreAdapter.getItems('users')
      return true
    } catch {
      return false
    }
  },
}

// Execute
async function main() {
  try {
    // Check status
    const executed = await migrationService.getExecutedMigrations()
    console.log(`Executed migrations: ${executed.length}`)

    // Execute migration
    const result = await migrationService.executeMigration(addEmailVerified, 'admin')

    if (result.success) {
      console.log(`✓ Migration completed successfully`)
      console.log(`  Time: ${result.executionTimeMs}ms`)
    } else {
      console.error(`✗ Migration failed: ${result.message}`)
    }

    // Verify
    const migration = await migrationService.getMigrationById(addEmailVerified.id)
    console.log(`Migration status: ${migration?.status}`)

    // Clean up
    await admin.app().delete()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
