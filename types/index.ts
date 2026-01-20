/**
 * @package @safira/firestore-migrations
 * @description Tipos e interfaces para o sistema de migrations
 */

export interface IMigration {
  id: string
  name: string
  description: string
  executedAt: Date
  executedBy: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back'
  error?: string
  rollbackExecutedAt?: Date
  rollbackExecutedBy?: string
  rollbackError?: string
  checksum?: string
  executionTimeMs?: number
  rollbackTimeMs?: number
}

export interface IMigrationScript {
  /**
   * Unique identifier for the migration
   * Format: YYYYMMDDHHMMSS_description
   * Example: 20250121120000_add_payment_status_field
   */
  id: string

  /**
   * Human-readable name for the migration
   */
  name: string

  /**
   * Detailed description of what this migration does
   */
  description: string

  /**
   * Function to execute the migration
   * Should be idempotent when possible
   * @param adapter Firestore adapter instance for database operations
   */
  up: (adapter: IFirestoreAdapter) => Promise<void>

  /**
   * Function to rollback the migration
   * Should undo what the up function did
   * @param adapter Firestore adapter instance for database operations
   */
  down: (adapter: IFirestoreAdapter) => Promise<void>

  /**
   * Optional validation function to check if migration can be executed
   * Returns true if migration can run, false otherwise
   */
  validate?: () => Promise<boolean>
}

export interface IMigrationResult {
  success: boolean
  migrationId: string
  message: string
  error?: Error
  executionTimeMs: number
}

export interface ISeed {
  /**
   * Unique identifier for the seed
   * Format: YYYYMMDDHHMMSS_description
   * Example: 20250121120000_initial_distributors
   */
  id: string

  /**
   * Human-readable name for the seed
   */
  name: string

  /**
   * Detailed description of what this seed does
   */
  description: string

  /**
   * Environment where this seed should run
   * Use 'all' for all environments, or specific env names
   */
  environments: Array<string | 'all'>

  /**
   * Function to execute the seed
   * Should be idempotent
   * @param adapter Firestore adapter instance for database operations
   */
  run: (adapter: IFirestoreAdapter) => Promise<void>

  /**
   * Optional validation function to check if seed can be executed
   * Returns true if seed can run, false otherwise
   */
  validate?: () => Promise<boolean>
}

export interface ISeedResult {
  success: boolean
  seedId: string
  message: string
  error?: Error
  executionTimeMs: number
}

/**
 * Configuration for the migration system
 */
export interface IMigrationConfig {
  /**
   * Firestore collection name to store migrations
   * Default: 'migrations'
   */
  migrationsCollection?: string

  /**
   * Custom Firestore adapter implementation
   */
  firestoreAdapter: IFirestoreAdapter
}

/**
 * Filter operator types supported by Firestore
 */
export type FirestoreFilterOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in'

/**
 * Single filter condition for Firestore queries
 */
export interface IFirestoreFilter {
  field: string
  operator: FirestoreFilterOperator
  value: any
}

/**
 * Options for query operations
 */
export interface IQueryOptions {
  filters?: IFirestoreFilter[]
  limit?: number
  orderBy?: {
    field: string
    direction?: 'asc' | 'desc'
  }
}

/**
 * Minimal Firestore adapter interface
 * Implement this interface to use with different Firestore setups
 */
export interface IFirestoreAdapter {
  getItems: <T>(collection: string, options?: IQueryOptions) => Promise<Array<T & { id: string }>>
  getItemById: <T>(collection: string, id: string) => Promise<T & { id: string }>
  createItemWithId: (collection: string, id: string, data: any) => Promise<string>
  updateItemById: (collection: string, id: string, data: any) => Promise<void>
  updateItems: (collection: string, data: any, options: IQueryOptions) => Promise<number>
  deleteItemById: (collection: string, id: string) => Promise<any>
  deleteItems: (collection: string, options: IQueryOptions) => Promise<number>
}
