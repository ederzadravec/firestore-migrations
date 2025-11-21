/**
 * @package @ederzadravec/firestore-migrations
 * @description Core migration service - framework agnostic
 */

import { createHash } from 'crypto'

import {
  IFirestoreAdapter,
  IMigration,
  IMigrationConfig,
  IMigrationResult,
  IMigrationScript,
  ISeed,
  ISeedResult,
} from '../types'

export class MigrationService {
  private readonly migrationsCollection: string
  private readonly firestoreAdapter: IFirestoreAdapter

  constructor(config: IMigrationConfig) {
    this.migrationsCollection = config.migrationsCollection || '_migrations'
    this.firestoreAdapter = config.firestoreAdapter
  }

  /**
   * Executes a migration script
   */
  public async executeMigration(
    migration: IMigrationScript,
    executedBy: string = 'system',
  ): Promise<IMigrationResult> {
    const startTime = Date.now()

    try {
      // Check if migration was already executed
      const existing = await this.getMigrationById(migration.id)
      if (existing && existing.status === 'completed') {
        return {
          success: false,
          migrationId: migration.id,
          message: `Migration ${migration.id} was already executed`,
          executionTimeMs: 0,
        }
      }

      // Validate if provided
      if (migration.validate) {
        const isValid = await migration.validate()
        if (!isValid) {
          throw new Error('Migration validation failed')
        }
      }

      // Create or update migration record
      const migrationRecord: IMigration = {
        id: migration.id,
        name: migration.name,
        description: migration.description,
        executedAt: new Date(),
        executedBy,
        status: 'running',
        checksum: this.calculateChecksum(migration),
      }

      await this.firestoreAdapter.createItemWithId(
        this.migrationsCollection,
        migration.id,
        migrationRecord,
      )

      // Execute migration
      await migration.up(this.firestoreAdapter)

      // Update status to completed
      const executionTimeMs = Date.now() - startTime
      await this.firestoreAdapter.updateItemById(this.migrationsCollection, migration.id, {
        status: 'completed',
        executionTimeMs,
      })

      return {
        success: true,
        migrationId: migration.id,
        message: `Migration ${migration.id} executed successfully`,
        executionTimeMs,
      }
    } catch (error) {
      const executionTimeMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update migration record with error
      try {
        await this.firestoreAdapter.updateItemById(this.migrationsCollection, migration.id, {
          status: 'failed',
          error: errorMessage,
          executionTimeMs,
        })
      } catch (updateError) {
        console.error('Failed to update migration record:', updateError)
      }

      return {
        success: false,
        migrationId: migration.id,
        message: `Migration ${migration.id} failed: ${errorMessage}`,
        error: error as Error,
        executionTimeMs,
      }
    }
  }

  /**
   * Rollback a migration
   */
  public async rollbackMigration(
    migration: IMigrationScript,
    executedBy: string = 'system',
  ): Promise<IMigrationResult> {
    const startTime = Date.now()

    try {
      // Check if migration exists and was executed
      const existing = await this.getMigrationById(migration.id)
      if (!existing) {
        return {
          success: false,
          migrationId: migration.id,
          message: `Migration ${migration.id} was not found`,
          executionTimeMs: 0,
        }
      }

      if (existing.status !== 'completed') {
        return {
          success: false,
          migrationId: migration.id,
          message: `Migration ${migration.id} is not in completed state (current: ${existing.status})`,
          executionTimeMs: 0,
        }
      }

      // Update status to rolling back
      await this.firestoreAdapter.updateItemById(this.migrationsCollection, migration.id, {
        status: 'running',
      })

      // Execute rollback
      await migration.down(this.firestoreAdapter)

      // Update status
      const rollbackTimeMs = Date.now() - startTime
      await this.firestoreAdapter.updateItemById(this.migrationsCollection, migration.id, {
        status: 'rolled_back',
        rollbackExecutedAt: new Date(),
        rollbackExecutedBy: executedBy,
        rollbackTimeMs,
      })

      return {
        success: true,
        migrationId: migration.id,
        message: `Migration ${migration.id} rolled back successfully`,
        executionTimeMs: rollbackTimeMs,
      }
    } catch (error) {
      const rollbackTimeMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update migration record with rollback error
      try {
        await this.firestoreAdapter.updateItemById(this.migrationsCollection, migration.id, {
          status: 'failed',
          rollbackError: errorMessage,
          rollbackTimeMs,
        })
      } catch (updateError) {
        console.error('Failed to update migration record:', updateError)
      }

      return {
        success: false,
        migrationId: migration.id,
        message: `Rollback of migration ${migration.id} failed: ${errorMessage}`,
        error: error as Error,
        executionTimeMs: rollbackTimeMs,
      }
    }
  }

  /**
   * Execute a seed
   */
  public async executeSeed(seed: ISeed, environment: string): Promise<ISeedResult> {
    const startTime = Date.now()

    try {
      // Check if seed should run in this environment
      if (!seed.environments.includes('all') && !seed.environments.includes(environment)) {
        return {
          success: false,
          seedId: seed.id,
          message: `Seed ${seed.id} is not configured to run in ${environment} environment`,
          executionTimeMs: 0,
        }
      }

      // Validate if provided
      if (seed.validate) {
        const isValid = await seed.validate()
        if (!isValid) {
          throw new Error('Seed validation failed')
        }
      }

      // Execute seed
      await seed.run(this.firestoreAdapter)

      const executionTimeMs = Date.now() - startTime

      return {
        success: true,
        seedId: seed.id,
        message: `Seed ${seed.id} executed successfully`,
        executionTimeMs,
      }
    } catch (error) {
      const executionTimeMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: false,
        seedId: seed.id,
        message: `Seed ${seed.id} failed: ${errorMessage}`,
        error: error as Error,
        executionTimeMs,
      }
    }
  }

  /**
   * Get all executed migrations
   */
  public async getExecutedMigrations(): Promise<IMigration[]> {
    return await this.firestoreAdapter.getItems<IMigration>(this.migrationsCollection)
  }

  /**
   * Get migration by ID
   */
  public async getMigrationById(id: string): Promise<IMigration | null> {
    try {
      return await this.firestoreAdapter.getItemById<IMigration>(this.migrationsCollection, id)
    } catch {
      return null
    }
  }

  /**
   * Get pending migrations
   */
  public async getPendingMigrations(allMigrations: IMigrationScript[]): Promise<IMigrationScript[]> {
    const executedMigrations = await this.getExecutedMigrations()
    const executedIds = new Set(executedMigrations.filter(m => m.status === 'completed').map(m => m.id))

    return allMigrations.filter(m => !executedIds.has(m.id))
  }

  /**
   * Calculate checksum for a migration
   * Used to detect if migration code has changed after execution
   */
  private calculateChecksum(migration: IMigrationScript): string {
    const content = `${migration.id}:${migration.name}:${migration.up.toString()}`
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Verify if migration checksum matches
   */
  public async verifyMigrationChecksum(migration: IMigrationScript): Promise<boolean> {
    const existing = await this.getMigrationById(migration.id)
    if (!existing || !existing.checksum) {
      return true // No checksum to compare
    }

    const currentChecksum = this.calculateChecksum(migration)
    return currentChecksum === existing.checksum
  }
}
