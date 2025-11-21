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
    
    const allFiles = readdirSync(migrationsPath);
    
    // Prioriza arquivos .js sobre .ts (para produção)
    const files = allFiles
      .filter(f => {
        const baseName = f.replace(/\.(ts|js)$/, '');
        const hasJs = allFiles.includes(baseName + '.js');
        
        // Se existe versão .js, usa ela; caso contrário, tenta .ts
        if (f.endsWith('.js')) return true;
        if (f.endsWith('.ts') && !hasJs) return true;
        return false;
      })
      .sort(); // Ordem cronológica

    for (const file of files) {
      try {
        const filePath = join(migrationsPath, file);
        
        // Se for .ts, tenta registrar ts-node
        if (file.endsWith('.ts')) {
          try {
            require('ts-node/register');
          } catch {
            throw new Error(
              `❌ Arquivo TypeScript encontrado mas ts-node não está disponível.\n` +
              `   Opções:\n` +
              `   1. Compile as migrations: tsc migrations/**/*.ts --outDir migrations\n` +
              `   2. Instale ts-node: npm install --save-dev ts-node\n` +
              `   3. Use yarn dev:up para desenvolvimento`
            );
          }
        }
        
        // Limpa o cache do require para permitir recarregamento
        delete require.cache[require.resolve(filePath)];
        
        const module = require(filePath);
        
        // Suporta diferentes exports: { migration }, { default }, ou export direto
        const migrationData = module.migration || module.default || module;
        
        if (migrationData && migrationData.id) {
          migrations.push(migrationData);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('ts-node')) {
          throw error; // Re-lança erros de ts-node
        }
        console.warn(`⚠️  Erro ao carregar migration ${file}:`, error instanceof Error ? error.message : error);
      }
    }

    return migrations;
  }

  /**
   * Carrega todas seeds de uma pasta
   */
  static async loadSeeds(seedsPath: string): Promise<ISeed[]> {
    const seeds: ISeed[] = [];
    
    const allFiles = readdirSync(seedsPath);
    
    // Prioriza arquivos .js sobre .ts (para produção)
    const files = allFiles
      .filter(f => {
        const baseName = f.replace(/\.(ts|js)$/, '');
        const hasJs = allFiles.includes(baseName + '.js');
        
        // Se existe versão .js, usa ela; caso contrário, tenta .ts
        if (f.endsWith('.js')) return true;
        if (f.endsWith('.ts') && !hasJs) return true;
        return false;
      })
      .sort();

    for (const file of files) {
      try {
        const filePath = join(seedsPath, file);
        
        // Se for .ts, tenta registrar ts-node
        if (file.endsWith('.ts')) {
          try {
            require('ts-node/register');
          } catch {
            throw new Error(
              `❌ Arquivo TypeScript encontrado mas ts-node não está disponível.\n` +
              `   Opções:\n` +
              `   1. Compile os seeds: tsc seeds/**/*.ts --outDir seeds\n` +
              `   2. Instale ts-node: npm install --save-dev ts-node\n` +
              `   3. Use yarn dev:seed para desenvolvimento`
            );
          }
        }
        
        // Limpa o cache do require para permitir recarregamento
        delete require.cache[require.resolve(filePath)];
        
        const module = require(filePath);
        
        const seedData = module.seed || module.default || module;
        
        if (seedData && seedData.id) {
          seeds.push(seedData);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('ts-node')) {
          throw error; // Re-lança erros de ts-node
        }
        console.warn(`⚠️  Erro ao carregar seed ${file}:`, error instanceof Error ? error.message : error);
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
