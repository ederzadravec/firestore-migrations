/**
 * Example: Seed
 *
 * Shows how to create and use seeds
 */

import { ISeed, IFirestoreAdapter } from '../index'

// Assuming you have your adapter
declare const firestoreAdapter: IFirestoreAdapter

export const initialDataSeed: ISeed = {
  id: '20250121120000_initial_data',
  name: 'Initial development data',
  description: 'Creates initial data for development and testing',

  // Only run in test and homolog environments
  environments: ['test', 'homolog'],

  async run() {
    console.log('Starting seed: Initial development data')

    // Create test users
    const testUsers = [
      {
        id: 'test_user_001',
        name: 'Test User 1',
        email: 'test1@example.com',
        created_at: new Date(),
        is_test: true,
      },
      {
        id: 'test_user_002',
        name: 'Test User 2',
        email: 'test2@example.com',
        created_at: new Date(),
        is_test: true,
      },
    ]

    for (const user of testUsers) {
      // Check if already exists (idempotency)
      const exists = await firestoreAdapter
        .getItemById('users', user.id)
        .catch(() => null)

      if (!exists) {
        await firestoreAdapter.createItemWithId('users', user.id, user)
        console.log(`Created user: ${user.name}`)
      } else {
        console.log(`User already exists: ${user.name}`)
      }
    }

    // Create test products
    const testProducts = [
      { id: 'prod_001', name: 'Product 1', price: 100 },
      { id: 'prod_002', name: 'Product 2', price: 200 },
    ]

    for (const product of testProducts) {
      const exists = await firestoreAdapter
        .getItemById('products', product.id)
        .catch(() => null)

      if (!exists) {
        await firestoreAdapter.createItemWithId('products', product.id, product)
        console.log(`Created product: ${product.name}`)
      }
    }

    console.log('Seed completed successfully')
  },

  async validate() {
    // Validate we can connect to Firestore
    try {
      await firestoreAdapter.getItems('users')
      return true
    } catch (error) {
      console.error('Validation failed:', error)
      return false
    }
  },
}

// Usage:
// const result = await migrationService.executeSeed(initialDataSeed, 'test')
