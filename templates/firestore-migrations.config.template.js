/**
 * Firestore Migrations Configuration
 * 
 * Este arquivo é OPCIONAL. Se não existir, a lib usa defaults inteligentes.
 * Crie este arquivo na raiz do seu projeto se precisar customizar.
 */

module.exports = {
  /**
   * Caminho para pasta de migrations
   * @default './migrations'
   */
  migrationsPath: './migrations',

  /**
   * Caminho para pasta de seeds
   * @default './seeds'
   */
  seedsPath: './seeds',

  /**
   * Nome da collection no Firestore para controle de migrations
   * @default '_migrations'
   */
  migrationsCollection: '_migrations',

  /**
   * Firebase Admin config (OPCIONAL)
   * 
   * Se não fornecido, a lib tenta:
   * 1. Usar admin.firestore() se já inicializado
   * 2. Usar GOOGLE_APPLICATION_CREDENTIALS env var
   * 3. Usar Application Default Credentials
   */
  firebase: {
    // Opção 1: Service Account path
    serviceAccountPath: './serviceAccountKey.json',
    
    // Opção 2: Service Account object
    // serviceAccount: require('./serviceAccountKey.json'),
    
    // Opção 3: Deixar undefined para auto-discovery
    // serviceAccount: undefined,
  }
}
