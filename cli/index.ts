#!/usr/bin/env node
/**
 * @package @ederzadravec/firestore-migrations
 * @description CLI tool for managing Firestore migrations (zero-config, auto-discovery)
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { ConfigLoader } from "../core/ConfigLoader";
import { FirebaseAdminAdapter } from "../core/FirebaseAdminAdapter";
import { MigrationService } from "../core/MigrationService";
import { MigrationLoader } from "../core/MigrationLoader";

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];
const name = args[2];

async function main() {
  try {
    switch (command) {
      case 'create':
        if (subcommand === 'migration') {
          await createMigration(name);
        } else if (subcommand === 'seed') {
          await createSeed(name);
        } else {
          console.error('❌ Use: create migration <name> ou create seed <name>');
          process.exit(1);
        }
        break;

      case 'up':
        await runMigrations();
        break;

      case 'down':
        await rollbackMigration();
        break;

      case 'seed':
        await runSeeds();
        break;

      case 'status':
        await showStatus();
        break;

      case 'list':
        await listMigrations();
        break;

      case 'init':
        await initProject();
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(`❌ Comando desconhecido: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔥 Firestore Migrations CLI - Zero Config

CRIAR:
  npx firestore-migrations create migration <name>   Criar nova migration
  npx firestore-migrations create seed <name>        Criar novo seed

EXECUTAR:
  npx firestore-migrations up                        Executar migrations pendentes
  npx firestore-migrations down                      Reverter última migration
  npx firestore-migrations seed                      Executar seeds

INFORMAÇÃO:
  npx firestore-migrations status                    Ver status das migrations
  npx firestore-migrations list                      Listar todas migrations

SETUP:
  npx firestore-migrations init                      Criar estrutura inicial
  npx firestore-migrations help                      Mostrar esta ajuda

CONFIGURAÇÃO (opcional):
  Crie firestore-migrations.config.js na raiz do projeto para customizar.
  Se não existir, usa defaults: ./migrations e ./seeds

EXEMPLOS:
  npx firestore-migrations create migration add-user-email
  npx firestore-migrations create seed initial-users
  npx firestore-migrations up
  npx firestore-migrations status

📖 Docs: https://github.com/ederzadravec/firestore-migrations
`);
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function createMigration(name: string) {
  if (!name) {
    console.error('❌ Informe o nome da migration');
    console.log('📝 Uso: npx firestore-migrations create migration <name>');
    process.exit(1);
  }

  const config = ConfigLoader.load();
  const timestamp = generateTimestamp();
  const fileName = `${timestamp}_${name}.ts`;
  const migrationDir = ConfigLoader.resolvePath(config.migrationsPath);

  if (!existsSync(migrationDir)) {
    mkdirSync(migrationDir, { recursive: true });
  }

  const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 * 
 * Firestore Migrations - Auto-discovered
 */

import type { IFirestoreAdapter } from '@ederzadravec/firestore-migrations'

export const migration = {
  id: '${timestamp}_${name}',
  name: '${name.replace(/_/g, " ")}',
  description: 'TODO: Adicione a descrição desta migration',

  async up(adapter: IFirestoreAdapter) {
    console.log('▶️  Executando: ${name}')
    
    // TODO: Implemente a lógica da migration
    // 
    // Exemplo 1: Adicionar campo em documentos existentes
    // const users = await adapter.getItems('users')
    // for (const user of users) {
    //   await adapter.updateItemById('users', user.id, {
    //     newField: 'defaultValue'
    //   })
    // }
    //
    // Exemplo 2: Criar collection/documentos
    // await adapter.createItemWithId('settings', 'app', {
    //   version: '1.0.0',
    //   createdAt: new Date()
    // })
    
    console.log('✅ Completo: ${name}')
  },

  async down(adapter: IFirestoreAdapter) {
    console.log('◀️  Revertendo: ${name}')
    
    // TODO: Implemente o rollback (desfazer o que up() fez)
    //
    // Exemplo 1: Remover campo adicionado
    // const users = await adapter.getItems('users')
    // for (const user of users) {
    //   await adapter.deleteItemProperty('users', user.id, 'newField')
    // }
    
    console.log('✅ Revertido: ${name}')
  },

  async validate() {
    // Opcional: validações antes de executar
    return true
  }
}

export default migration
`;

  const filePath = join(migrationDir, fileName);
  writeFileSync(filePath, template);

  console.log(`\n✅ Migration criada: ${fileName}`);
  console.log(`📂 Localização: ${migrationDir}`);
  console.log(`\n📝 Próximos passos:`);
  console.log(`   1. Edite o arquivo e implemente up() e down()`);
  console.log(`   2. Execute: npx firestore-migrations up\n`);
}

async function createSeed(name: string) {
  if (!name) {
    console.error('❌ Informe o nome do seed');
    console.log('📝 Uso: npx firestore-migrations create seed <name>');
    process.exit(1);
  }

  const config = ConfigLoader.load();
  const timestamp = generateTimestamp();
  const fileName = `${timestamp}_${name}.ts`;
  const seedDir = ConfigLoader.resolvePath(config.seedsPath);

  if (!existsSync(seedDir)) {
    mkdirSync(seedDir, { recursive: true });
  }

  const template = `/**
 * Seed: ${name}
 * Created: ${new Date().toISOString()}
 * 
 * Firestore Migrations - Auto-discovered
 */

import type { IFirestoreAdapter } from '@ederzadravec/firestore-migrations'

export const seed = {
  id: '${timestamp}_${name}',
  name: '${name.replace(/_/g, " ")}',
  description: 'TODO: Adicione a descrição deste seed',

  async run(adapter: IFirestoreAdapter) {
    console.log('🌱 Executando seed: ${name}')
    
    // TODO: Implemente a lógica do seed
    //
    // Exemplo: Criar dados iniciais
    // await adapter.createItemWithId('users', 'admin', {
    //   name: 'Admin User',
    //   email: 'admin@example.com',
    //   role: 'admin',
    //   createdAt: new Date()
    // })
    //
    // await adapter.createItemWithId('settings', 'app', {
    //   appName: 'My App',
    //   version: '1.0.0',
    //   maintenanceMode: false
    // })
    
    console.log('✅ Seed completo: ${name}')
  }
}

export default seed
`;

  const filePath = join(seedDir, fileName);
  writeFileSync(filePath, template);

  console.log(`\n✅ Seed criado: ${fileName}`);
  console.log(`📂 Localização: ${seedDir}`);
  console.log(`\n📝 Próximos passos:`);
  console.log(`   1. Edite o arquivo e implemente run()`);
  console.log(`   2. Execute: npx firestore-migrations seed\n`);
}

async function initProject() {
  const config = ConfigLoader.load();
  
  const migrationDir = ConfigLoader.resolvePath(config.migrationsPath);
  const seedDir = ConfigLoader.resolvePath(config.seedsPath);

  if (!existsSync(migrationDir)) {
    mkdirSync(migrationDir, { recursive: true });
    console.log(`✅ Criada pasta: ${config.migrationsPath}`);
  } else {
    console.log(`⏭️  Já existe: ${config.migrationsPath}`);
  }

  if (!existsSync(seedDir)) {
    mkdirSync(seedDir, { recursive: true });
    console.log(`✅ Criada pasta: ${config.seedsPath}`);
  } else {
    console.log(`⏭️  Já existe: ${config.seedsPath}`);
  }

  // Criar .gitignore se não existir
  const gitignorePath = join(process.cwd(), '.gitignore');
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8');
    if (!content.includes('serviceAccountKey.json')) {
      writeFileSync(gitignorePath, content + '\n# Firebase credentials\nserviceAccountKey.json\n.env\n');
      console.log(`✅ Atualizado .gitignore`);
    }
  }

  console.log(`\n🎉 Estrutura inicializada!`);
  console.log(`\n📝 Próximos passos:`);
  console.log(`   1. Configure Firebase credentials (veja docs/CREDENTIALS.md)`);
  console.log(`   2. Crie sua primeira migration:`);
  console.log(`      npx firestore-migrations create migration initial-setup`);
  console.log(`   3. Execute: npx firestore-migrations up\n`);
}

async function runMigrations() {
  console.log('🚀 Executando migrations...\n');
  
  const config = ConfigLoader.load();
  const db = await ConfigLoader.initializeFirebase(config);
  const adapter = new FirebaseAdminAdapter(db);
  const service = new MigrationService({
    firestoreAdapter: adapter,
  });

  const migrationsPath = ConfigLoader.resolvePath(config.migrationsPath);
  
  if (!existsSync(migrationsPath)) {
    console.log('⚠️  Pasta de migrations não encontrada. Execute: npx firestore-migrations init\n');
    return;
  }

  // Carregar todas migrations da pasta
  const allMigrations = await MigrationLoader.loadMigrations(migrationsPath);
  
  if (allMigrations.length === 0) {
    console.log('⚠️  Nenhuma migration encontrada\n');
    return;
  }

  const pending = await service.getPendingMigrations(allMigrations);
  
  if (pending.length === 0) {
    console.log('✅ Nenhuma migration pendente\n');
    return;
  }

  console.log(`📋 ${pending.length} migration(s) pendente(s):\n`);
  for (const migration of pending) {
    console.log(`   • ${migration.id} - ${migration.name}`);
  }
  console.log('');

  for (const migration of pending) {
    await service.executeMigration(migration);
  }

  console.log('\n✅ Todas migrations executadas com sucesso!\n');
}

async function rollbackMigration() {
  console.log('◀️  Revertendo última migration...\n');
  
  const config = ConfigLoader.load();
  const db = await ConfigLoader.initializeFirebase(config);
  const adapter = new FirebaseAdminAdapter(db);
  const service = new MigrationService({
    firestoreAdapter: adapter,
  });

  const migrationsPath = ConfigLoader.resolvePath(config.migrationsPath);
  const allMigrations = await MigrationLoader.loadMigrations(migrationsPath);

  const executed = await service.getExecutedMigrations();
  
  if (executed.length === 0) {
    console.log('⚠️  Nenhuma migration para reverter\n');
    return;
  }

  const lastMigration = executed[executed.length - 1];
  const migrationScript = allMigrations.find(m => m.id === lastMigration.id);
  
  if (!migrationScript) {
    console.error(`❌ Arquivo da migration ${lastMigration.id} não encontrado`);
    return;
  }

  console.log(`Revertendo: ${lastMigration.id} - ${lastMigration.name}\n`);
  
  await service.rollbackMigration(migrationScript);
  
  console.log('\n✅ Migration revertida com sucesso!\n');
}

async function runSeeds() {
  console.log('🌱 Executando seeds...\n');
  
  const config = ConfigLoader.load();
  const db = await ConfigLoader.initializeFirebase(config);
  const adapter = new FirebaseAdminAdapter(db);
  const service = new MigrationService({
    firestoreAdapter: adapter,
  });

  const seedDir = ConfigLoader.resolvePath(config.seedsPath);
  
  if (!existsSync(seedDir)) {
    console.log('⚠️  Pasta de seeds não encontrada. Execute: npx firestore-migrations init\n');
    return;
  }

  const seeds = await MigrationLoader.loadSeeds(seedDir);
  
  if (seeds.length === 0) {
    console.log('⚠️  Nenhum seed encontrado\n');
    return;
  }

  console.log(`📋 ${seeds.length} seed(s) encontrado(s)\n`);

  for (const seed of seeds) {
    await service.executeSeed(seed, 'development'); // ou process.env.NODE_ENV
  }

  console.log('\n✅ Todos seeds executados com sucesso!\n');
}

async function showStatus() {
  console.log('📊 Status das migrations:\n');
  
  const config = ConfigLoader.load();
  const db = await ConfigLoader.initializeFirebase(config);
  const adapter = new FirebaseAdminAdapter(db);
  const service = new MigrationService({
    firestoreAdapter: adapter,
  });

  const migrationsPath = ConfigLoader.resolvePath(config.migrationsPath);
  
  if (!existsSync(migrationsPath)) {
    console.log('⚠️  Pasta de migrations não encontrada\n');
    return;
  }

  const allMigrations = await MigrationLoader.loadMigrations(migrationsPath);
  const executed = await service.getExecutedMigrations();
  const pending = await service.getPendingMigrations(allMigrations);

  console.log(`✅ Executadas: ${executed.length}`);
  if (executed.length > 0) {
    for (const migration of executed) {
      console.log(`   • ${migration.id} - ${migration.name}`);
    }
  }

  console.log(`\n⏳ Pendentes: ${pending.length}`);
  if (pending.length > 0) {
    for (const migration of pending) {
      console.log(`   • ${migration.id} - ${migration.name}`);
    }
  }

  console.log('');
}

async function listMigrations() {
  console.log('📋 Todas as migrations:\n');
  
  const config = ConfigLoader.load();
  const migrationDir = ConfigLoader.resolvePath(config.migrationsPath);
  
  if (!existsSync(migrationDir)) {
    console.log('⚠️  Pasta de migrations não encontrada. Execute: npx firestore-migrations init\n');
    return;
  }

  const files = readdirSync(migrationDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  Nenhuma migration encontrada\n');
    return;
  }

  for (const file of files) {
    console.log(`   ${file}`);
  }

  console.log(`\nTotal: ${files.length} migration(s)\n`);
}

// Run CLI
main();
