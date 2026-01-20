# 🔥 Firestore Migrations

> Sistema de migrations e seeds para Firestore com **zero configuração** - Funciona como Prisma, TypeORM, Sequelize

[![npm version](https://badge.fury.io/js/@ederzadravec%2Ffirestore-migrations.svg)](https://www.npmjs.com/package/@ederzadravec/firestore-migrations)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Por que usar?

- ✅ **Zero Config** - Funciona sem nenhum arquivo de configuração
- ✅ **Auto-Discovery** - Descobre Firebase e migrations automaticamente
- ✅ **CLI Simples** - Comandos diretos como `npx firestore-migrations up`
- ✅ **TypeScript First** - Suporte completo e types incluídos
- ✅ **Rollback** - Reverta migrations com segurança
- ✅ **Seeds** - Popule dados iniciais facilmente
- ✅ **Checksum Validation** - Detecta mudanças em migrations já executadas

## ⚠️ Erro "Unexpected token '{'?"

Se você receber este erro ao executar `npx firestore-migrations up`:

```bash
Erro: Unexpected token '{'
error Command failed with exit code 1.
```

**Solução rápida:**

```bash
# Opção 1: Instalar ts-node (desenvolvimento)
npm install --save-dev ts-node
npx firestore-migrations up

# Opção 2: Compilar migrations (produção)
npx tsc migrations/**/*.ts --outDir migrations --module commonjs
npx firestore-migrations up
```

📖 **[Ver Guia Completo de Solução](./docs/TYPESCRIPT-MIGRATIONS.md)**

## 🚀 Quick Start (3 minutos)

### 1️⃣ Instalar

```bash
npm install @ederzadravec/firestore-migrations firebase-admin
# ou
yarn add @ederzadravec/firestore-migrations firebase-admin
```

### 2️⃣ Configurar Firebase (escolha UMA opção)

**Opção A: Variável de ambiente** (mais fácil)

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
```

**Opção B: Arquivo de config** (mais controle)

Crie `firestore-migrations.config.js`:

```javascript
module.exports = {
  firebase: {
    serviceAccountPath: './serviceAccountKey.json'
  }
}
```

**Opção C: Application Default Credentials**

```bash
gcloud auth application-default login
```

### 3️⃣ Inicializar estrutura

```bash
npx firestore-migrations init
```

Isso cria:
```
seu-projeto/
├── migrations/     ← suas migrations aqui
└── seeds/         ← seus seeds aqui
```

### 4️⃣ Criar e executar migration

```bash
# Criar
npx firestore-migrations create migration add-user-email

# Editar migrations/TIMESTAMP_add-user-email.ts
# Implementar up() e down()

# Executar
npx firestore-migrations up
```

## 🎯 Uso Completo

### Comandos Disponíveis

```bash
# CRIAR
npx firestore-migrations create migration <name>   # Nova migration
npx firestore-migrations create seed <name>        # Novo seed

# EXECUTAR
npx firestore-migrations up                        # Rodar migrations pendentes
npx firestore-migrations down                      # Reverter última migration
npx firestore-migrations seed                      # Popular dados (seeds)

# INFORMAÇÃO
npx firestore-migrations status                    # Ver status
npx firestore-migrations list                      # Listar todas migrations
```

### ⚡ TypeScript vs JavaScript

As migrations são criadas em **TypeScript** por padrão. Para executá-las em produção, você tem **3 opções**:

**Opção 1: Usar ts-node (desenvolvimento)** ✅ Recomendado para dev

```bash
npm install --save-dev ts-node
npx firestore-migrations up
```

**Opção 2: Compilar migrations (produção)** ✅ Recomendado para produção

```bash
# Compile suas migrations
npx tsc migrations/**/*.ts --outDir migrations --module commonjs

# Execute normalmente
npx firestore-migrations up
```

**Opção 3: Scripts do package.json**

```json
{
  "scripts": {
    "migrate:build": "tsc migrations/**/*.ts --outDir migrations --module commonjs",
    "migrate:up": "npm run migrate:build && firestore-migrations up",
    "migrate:up:dev": "ts-node -r tsconfig-paths/register ./node_modules/.bin/firestore-migrations up"
  }
}
```

> 💡 O CLI detecta automaticamente se você tem arquivos `.js` ou `.ts` e usa a versão apropriada.  
> 📖 **Erro "Unexpected token '{'?"** Veja o [Guia Completo TypeScript/JavaScript](./docs/TYPESCRIPT-MIGRATIONS.md)

### Scripts no package.json (recomendado)

Adicione ao seu `package.json`:

```json
{
  "scripts": {
    "migrate:create": "firestore-migrations create migration",
    "migrate:up": "firestore-migrations up",
    "migrate:down": "firestore-migrations down",
    "migrate:status": "firestore-migrations status",
    "seed:create": "firestore-migrations create seed",
    "seed:run": "firestore-migrations seed"
  }
}
```

Agora use:

```bash
yarn migrate:create add-user-role
yarn migrate:up
yarn migrate:status
```

## 📝 Exemplo de Migration

Arquivo gerado automaticamente em `migrations/20231121120000_add_user_email.ts`:

```typescript
import type { IFirestoreAdapter } from '@ederzadravec/firestore-migrations'

export const migration = {
  id: '20231121120000_add_user_email',
  name: 'add user email',
  description: 'Adiciona campo email em todos users',

  async up(adapter: IFirestoreAdapter) {
    console.log('▶️  Adicionando campo email...')
    
    const users = await adapter.getItems('users')
    
    for (const user of users) {
      await adapter.updateItemById('users', user.id, {
        email: user.email || `${user.username}@example.com`,
        emailVerified: false
      })
    }
    
    console.log(`✅ ${users.length} usuários atualizados`)
  },

  async down(adapter: IFirestoreAdapter) {
    console.log('◀️  Removendo campo email...')
    
    const users = await adapter.getItems('users')
    
    for (const user of users) {
      await adapter.deleteItemProperty('users', user.id, 'email')
      await adapter.deleteItemProperty('users', user.id, 'emailVerified')
    }
    
    console.log('✅ Rollback completo')
  }
}

export default migration
```

## 🌱 Exemplo de Seed

Arquivo gerado automaticamente em `seeds/20231121120000_initial_users.ts`:

```typescript
import type { IFirestoreAdapter } from '@ederzadravec/firestore-migrations'

export const seed = {
  id: '20231121120000_initial_users',
  name: 'initial users',
  description: 'Cria usuários iniciais do sistema',
  environments: ['all'], // 'all' para todos ambientes, ou ['development', 'production']

  async run(adapter: IFirestoreAdapter) {
    console.log('🌱 Criando usuários iniciais...')
    
    await adapter.createItemWithId('users', 'admin', {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date()
    })
    
    await adapter.createItemWithId('users', 'guest', {
      name: 'Guest User',
      email: 'guest@example.com',
      role: 'guest',
      createdAt: new Date()
    })
    
    console.log('✅ 2 usuários criados')
  },

  async validate() {
    // Opcional: validações antes de executar
    return true
  }
}

export default seed
```

> 💡 **Campo `environments`**: Use `['all']` para executar em todos ambientes, ou especifique ambientes como `['development']`, `['production']`, ou `['development', 'staging']`.

## ⚙️ Configuração (Opcional)

A biblioteca funciona **sem configuração**, mas você pode customizar criando `firestore-migrations.config.js`:

```javascript
module.exports = {
  // Pasta de migrations (padrão: './migrations')
  migrationsPath: './database/migrations',
  
  // Pasta de seeds (padrão: './seeds')
  seedsPath: './database/seeds',
  
  // Collection de controle (padrão: '_migrations')
  migrationsCollection: '_migrations',
  
  // Firebase config (opcional - auto-discovery se não fornecido)
  firebase: {
    // Opção 1: Path para service account
    serviceAccountPath: './config/firebase-adminsdk.json',
    
    // Opção 2: Service account object
    // serviceAccount: require('./serviceAccountKey.json'),
  }
}
```

## 🔐 Credenciais Firebase

A biblioteca **descobre automaticamente** suas credenciais Firebase nesta ordem:

1. ✅ Se Firebase já está inicializado → usa instância existente
2. ✅ Se tem `firebase.serviceAccountPath` no config → carrega e usa
3. ✅ Se tem `GOOGLE_APPLICATION_CREDENTIALS` env var → usa
4. ✅ Application Default Credentials (gcloud auth)

**Você não precisa fazer nada!** Apenas garanta que uma dessas opções está configurada.

### Exemplo: Service Account

1. Baixe service account do Firebase Console
2. Salve como `serviceAccountKey.json` na raiz do projeto
3. Configure env var:

```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

4. Adicione ao `.gitignore`:

```
serviceAccountKey.json
.env
```

Pronto! A lib vai descobrir e usar automaticamente.

## 📚 API do Adapter

Todas migrations e seeds recebem um `adapter` com estes métodos:

```typescript
// Tipos de filtros suportados
type FirestoreFilterOperator =
  | '==' | '!=' | '<' | '<=' | '>' | '>='
  | 'array-contains' | 'array-contains-any' | 'in' | 'not-in'

interface IFirestoreFilter {
  field: string
  operator: FirestoreFilterOperator
  value: any
}

interface IQueryOptions {
  filters?: IFirestoreFilter[]
  limit?: number
  orderBy?: { field: string; direction?: 'asc' | 'desc' }
}

interface IFirestoreAdapter {
  // Buscar
  getItems<T>(collection: string, options?: IQueryOptions): Promise<T[]>
  getItemById<T>(collection: string, id: string): Promise<T>

  // Criar
  createItemWithId(collection: string, id: string, data: any): Promise<string>

  // Atualizar
  updateItemById(collection: string, id: string, data: any): Promise<void>
  updateItems(collection: string, data: any, options: IQueryOptions): Promise<number>

  // Deletar
  deleteItemById(collection: string, id: string): Promise<any>
  deleteItems(collection: string, options: IQueryOptions): Promise<number>
}
```

### Exemplos de uso com filtros

```typescript
// Buscar usuários ativos maiores de 18 anos
const users = await adapter.getItems('users', {
  filters: [
    { field: 'status', operator: '==', value: 'active' },
    { field: 'age', operator: '>=', value: 18 }
  ],
  orderBy: { field: 'createdAt', direction: 'desc' },
  limit: 100
})

// Atualizar múltiplos documentos de uma vez
const updatedCount = await adapter.updateItems(
  'users',
  { notifiedAt: new Date() },
  { filters: [{ field: 'status', operator: '==', value: 'active' }] }
)
console.log(`${updatedCount} usuários atualizados`)

// Deletar documentos expirados
const deletedCount = await adapter.deleteItems('sessions', {
  filters: [{ field: 'expiresAt', operator: '<', value: new Date() }]
})
console.log(`${deletedCount} sessões removidas`)
```

## 🎓 Casos de Uso

### Adicionar campo em documentos existentes (bulk)

```typescript
async up(adapter) {
  // Usando updateItems para atualizar em lote (mais eficiente)
  const count = await adapter.updateItems(
    'users',
    { status: 'active', updatedAt: new Date() },
    { filters: [] } // filtros vazios = todos os documentos
  )
  console.log(`${count} usuários atualizados`)
}
```

### Adicionar campo apenas em documentos específicos

```typescript
async up(adapter) {
  // Atualiza apenas usuários pendentes
  const count = await adapter.updateItems(
    'users',
    { status: 'active', updatedAt: new Date() },
    { filters: [{ field: 'status', operator: '==', value: 'pending' }] }
  )
  console.log(`${count} usuários pendentes atualizados`)
}
```

### Migrar dados entre collections

```typescript
async up(adapter) {
  const oldUsers = await adapter.getItems('users_old')

  for (const user of oldUsers) {
    await adapter.createItemWithId('users', user.id, {
      name: user.full_name,  // rename
      email: user.email,
      active: user.status === 'enabled'  // transform
    })
  }
}
```

### Criar estrutura inicial

```typescript
async up(adapter) {
  await adapter.createItemWithId('settings', 'app', {
    version: '1.0.0',
    maintenanceMode: false,
    features: {
      auth: true,
      payments: false
    }
  })
}
```

### Limpar dados antigos

```typescript
async up(adapter) {
  // Remove todas as sessões expiradas
  const deleted = await adapter.deleteItems('sessions', {
    filters: [{ field: 'expiresAt', operator: '<', value: new Date() }]
  })
  console.log(`${deleted} sessões expiradas removidas`)
}
```

### Buscar e processar com filtros complexos

```typescript
async up(adapter) {
  // Busca usuários premium inativos há mais de 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const inactiveUsers = await adapter.getItems('users', {
    filters: [
      { field: 'plan', operator: '==', value: 'premium' },
      { field: 'lastLogin', operator: '<', value: thirtyDaysAgo }
    ],
    orderBy: { field: 'lastLogin', direction: 'asc' }
  })

  // Processa cada usuário
  for (const user of inactiveUsers) {
    await adapter.updateItemById('users', user.id, {
      status: 'inactive',
      inactiveSince: new Date()
    })
  }
}
```

## 🛡️ Segurança

- ✅ **Checksum Validation** - Detecta alterações em migrations já executadas
- ✅ **Transaction Support** - Opera\u00e7\u00f5es atômicas quando possível
- ✅ **Rollback** - Sempre implemente `down()` para reverter
- ✅ **Dry-run** - Teste com `validate()` antes de executar

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](./CONTRIBUTING.md)

### Testando Localmente

```bash
# Setup rápido
./dev-setup.sh

# Testar comandos
cd test-project
npx ts-node ../cli/index.ts init
npx ts-node ../cli/index.ts create migration test
npx ts-node ../cli/index.ts list
```

Ver [DEVELOPMENT.md](./DEVELOPMENT.md) para mais opções de teste.

## 🧪 Testes

A biblioteca possui uma suíte completa de testes automatizados com Jest:

```bash
# Rodar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Rodar testes específicos
npm test -- tests/unit/MigrationService.test.ts

# Watch mode para desenvolvimento
npm run test:watch
```

### Cobertura de Testes

- ✅ **22 testes** passando
- ✅ **57% de cobertura** geral
- ✅ Testes unitários para `MigrationService` (70% cobertura)
- ✅ Testes unitários para `MockFirestoreAdapter` (100% cobertura)
- ✅ Testes de integração para `ConfigLoader`
- ✅ Mock completo do Firestore para testes rápidos

Ver [TESTING.md](./TESTING.md) para guia completo de testes.

## 📄 Licença

MIT © [Eder Zadravec](https://github.com/ederzadravec)

## 🔗 Links

- [GitHub](https://github.com/ederzadravec/firestore-migrations)
- [npm](https://www.npmjs.com/package/@ederzadravec/firestore-migrations)
- [Issues](https://github.com/ederzadravec/firestore-migrations/issues)

