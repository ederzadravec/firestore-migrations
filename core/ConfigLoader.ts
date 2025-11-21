import * as path from 'path';
import * as fs from 'fs';
import * as admin from 'firebase-admin';

export interface FirestoreMigrationsConfig {
  migrationsPath: string;
  seedsPath: string;
  migrationsCollection: string;
  firebase?: {
    serviceAccountPath?: string;
    serviceAccount?: admin.ServiceAccount;
  };
}

export class ConfigLoader {
  private static readonly DEFAULT_CONFIG: FirestoreMigrationsConfig = {
    migrationsPath: './migrations',
    seedsPath: './seeds',
    migrationsCollection: '_migrations',
  };

  private static readonly CONFIG_FILES = [
    'firestore-migrations.config.js',
    'firestore-migrations.config.json',
    '.firestore-migrationsrc',
    '.firestore-migrationsrc.json',
  ];

  /**
   * Carrega configuração do projeto
   * Ordem de precedência:
   * 1. Arquivo de config (se existir)
   * 2. Defaults
   */
  static load(projectRoot: string = process.cwd()): FirestoreMigrationsConfig {
    // Tenta encontrar arquivo de config
    const configFile = this.findConfigFile(projectRoot);
    
    if (configFile) {
      console.log(`📋 Usando config: ${path.relative(projectRoot, configFile)}`);
      return this.loadConfigFile(configFile);
    }

    console.log('📋 Usando configuração padrão (sem arquivo de config)');
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * Procura arquivo de configuração no projeto
   */
  private static findConfigFile(projectRoot: string): string | null {
    for (const filename of this.CONFIG_FILES) {
      const filePath = path.join(projectRoot, filename);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  /**
   * Carrega e valida arquivo de configuração
   */
  private static loadConfigFile(configPath: string): FirestoreMigrationsConfig {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const userConfig = require(configPath);
      
      return {
        ...this.DEFAULT_CONFIG,
        ...userConfig,
      };
    } catch (error) {
      console.warn(`⚠️  Erro ao carregar ${configPath}, usando defaults:`, error);
      return { ...this.DEFAULT_CONFIG };
    }
  }

  /**
   * Inicializa Firebase automaticamente
   * Ordem de tentativas:
   * 1. Se já está inicializado, usa instância existente
   * 2. Se config tem serviceAccount, usa ele
   * 3. Se config tem serviceAccountPath, carrega e usa
   * 4. Usa Application Default Credentials
   */
  static async initializeFirebase(config: FirestoreMigrationsConfig): Promise<admin.firestore.Firestore> {
    // Já inicializado?
    if (admin.apps.length > 0) {
      console.log('✅ Firebase já inicializado');
      return admin.firestore();
    }

    console.log('🔧 Inicializando Firebase...');

    try {
      // Opção 1: Service Account object
      if (config.firebase?.serviceAccount) {
        console.log('  → Usando serviceAccount da config');
        admin.initializeApp({
          credential: admin.credential.cert(config.firebase.serviceAccount),
        });
        return admin.firestore();
      }

      // Opção 2: Service Account path
      if (config.firebase?.serviceAccountPath) {
        const serviceAccountPath = path.resolve(process.cwd(), config.firebase.serviceAccountPath);
        
        if (!fs.existsSync(serviceAccountPath)) {
          throw new Error(`Service Account não encontrado: ${serviceAccountPath}`);
        }

        console.log(`  → Carregando service account: ${config.firebase.serviceAccountPath}`);
        const serviceAccount = require(serviceAccountPath);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        return admin.firestore();
      }

      // Opção 3: Application Default Credentials
      console.log('  → Usando Application Default Credentials');
      console.log('    (GOOGLE_APPLICATION_CREDENTIALS ou gcloud auth)');
      
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      
      return admin.firestore();
    } catch (error) {
      console.error('\n❌ Erro ao inicializar Firebase:\n');
      
      if (error instanceof Error) {
        console.error(error.message);
      }
      
      console.error('\n💡 Soluções:');
      console.error('   1. Crie firestore-migrations.config.js com serviceAccountPath');
      console.error('   2. Defina GOOGLE_APPLICATION_CREDENTIALS env var');
      console.error('   3. Execute: gcloud auth application-default login');
      console.error('\n📖 Mais info: https://firebase.google.com/docs/admin/setup\n');
      
      throw error;
    }
  }

  /**
   * Resolve caminho absoluto a partir da raiz do projeto
   */
  static resolvePath(relativePath: string, projectRoot: string = process.cwd()): string {
    return path.resolve(projectRoot, relativePath);
  }
}
