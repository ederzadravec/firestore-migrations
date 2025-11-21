/**
 * Migration Loader - Carrega arquivos de migration/seed dinamicamente
 */

import { readdirSync } from 'fs';
import { join } from 'path';
import { IMigrationScript, ISeed } from '../types';

export class MigrationLoader {
  /**
   * Carrega todas migrations de uma pasta
   */
  static async loadMigrations(migrationsPath: string): Promise<IMigrationScript[]> {
    const migrations: IMigrationScript[] = [];
    
    const files = readdirSync(migrationsPath)
      .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
      .sort(); // Ordem cronológica

    for (const file of files) {
      const filePath = join(migrationsPath, file);
      const module = require(filePath);
      
      // Suporta diferentes exports: { migration }, { default }, ou export direto
      const migrationData = module.migration || module.default || module;
      
      if (migrationData && migrationData.id) {
        migrations.push(migrationData);
      }
    }

    return migrations;
  }

  /**
   * Carrega todas seeds de uma pasta
   */
  static async loadSeeds(seedsPath: string): Promise<ISeed[]> {
    const seeds: ISeed[] = [];
    
    const files = readdirSync(seedsPath)
      .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
      .sort();

    for (const file of files) {
      const filePath = join(seedsPath, file);
      const module = require(filePath);
      
      const seedData = module.seed || module.default || module;
      
      if (seedData && seedData.id) {
        seeds.push(seedData);
      }
    }

    return seeds;
  }

  /**
   * Carrega uma migration específica por ID
   */
  static async loadMigrationById(migrationsPath: string, id: string): Promise<IMigrationScript | null> {
    const migrations = await this.loadMigrations(migrationsPath);
    return migrations.find(m => m.id === id) || null;
  }
}
