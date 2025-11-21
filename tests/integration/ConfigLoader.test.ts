/**
 * Testes de Integração com ConfigLoader
 */

import { ConfigLoader } from '../../core/ConfigLoader';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';

describe('ConfigLoader Integration', () => {
  const testDir = join(process.cwd(), 'test-config-loader');
  const configFile = join(testDir, 'firestore-migrations.config.js');

  beforeAll(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (existsSync(configFile)) unlinkSync(configFile);
    if (existsSync(testDir)) rmdirSync(testDir, { recursive: true });
  });

  it('deve carregar configuração padrão se não houver arquivo', () => {
    const config = ConfigLoader.load(testDir);

    expect(config.migrationsPath).toBe('./migrations');
    expect(config.seedsPath).toBe('./seeds');
    expect(config.migrationsCollection).toBe('_migrations');
  });

  it('deve carregar configuração de arquivo se existir', () => {
    // Criar arquivo de config
    const configContent = `
      module.exports = {
        migrationsPath: './custom/migrations',
        seedsPath: './custom/seeds',
        migrationsCollection: '_custom_migrations'
      }
    `;
    writeFileSync(configFile, configContent);

    const config = ConfigLoader.load(testDir);

    expect(config.migrationsPath).toBe('./custom/migrations');
    expect(config.seedsPath).toBe('./custom/seeds');
    expect(config.migrationsCollection).toBe('_custom_migrations');

    // Limpar
    unlinkSync(configFile);
  });

  it('deve resolver paths absolutos corretamente', () => {
    const relativePath = './migrations';
    const absolutePath = ConfigLoader.resolvePath(relativePath, testDir);

    expect(absolutePath).toBe(join(testDir, 'migrations'));
  });
});
