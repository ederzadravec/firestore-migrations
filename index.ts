/**
 * @package @ederzadravec/firestore-migrations
 * @version 1.0.0
 * @description Sistema de migrations para Firestore - Framework agnostic
 *
 * @example
 * ```typescript
 * import { MigrationService } from '@ederzadravec/firestore-migrations'
 *
 * const migrationService = new MigrationService({
 *   firestoreAdapter: myFirestoreAdapter,
 *   migrationsCollection: 'migrations', // optional
 * })
 *
 * await migrationService.executeMigration(myMigration, 'admin')
 * ```
 */

// Core
export * from './core'

// Types
export * from './types'
