# TypeScript Migrations - Guia Completo

## 📋 Problema

Quando você executa `npx firestore-migrations up` e recebe o erro:

```
Erro: Unexpected token '{'
```

Isso acontece porque:
- Suas migrations foram criadas em **TypeScript** (.ts)
- O CLI compilado está tentando carregar arquivos .ts sem um compilador TypeScript
- Node.js não consegue executar TypeScript nativamente

## ✅ Soluções

### Solução 1: Instalar ts-node (Desenvolvimento) 

**Mais fácil para desenvolvimento local**

```bash
npm install --save-dev ts-node typescript

# Agora funciona!
npx firestore-migrations up
```

**Vantagens:**
- ✅ Setup rápido
- ✅ Sem step de build
- ✅ Ideal para desenvolvimento

**Desvantagens:**
- ❌ Mais lento (compila on-the-fly)
- ❌ Requer ts-node em produção

---

### Solução 2: Compilar Migrations (Produção) ⭐ Recomendado

**Melhor para produção e CI/CD**

#### Opção A: Comando Manual

```bash
# Compila todas migrations TypeScript para JavaScript
npx tsc migrations/**/*.ts --outDir migrations --module commonjs --target ES2020

# Executa normalmente
npx firestore-migrations up
```

#### Opção B: Adicionar Scripts no package.json

```json
{
  "scripts": {
    "migrate:build": "tsc migrations/**/*.ts seeds/**/*.ts --outDir . --module commonjs --target ES2020",
    "migrate:up": "npm run migrate:build && firestore-migrations up",
    "migrate:down": "npm run migrate:build && firestore-migrations down",
    "migrate:status": "firestore-migrations status",
    
    "migrate:dev": "ts-node ./node_modules/.bin/firestore-migrations up",
    "migrate:create": "firestore-migrations create migration"
  }
}
```

Agora use:

```bash
# Desenvolvimento (com ts-node)
npm run migrate:dev

# Produção (compila + executa)
npm run migrate:up
```

**Vantagens:**
- ✅ Mais rápido em produção
- ✅ Não precisa de ts-node instalado
- ✅ Ideal para CI/CD

**Desvantagens:**
- ❌ Requer step de build antes de executar

---

### Solução 3: TSConfig Dedicado para Migrations

Crie um arquivo `tsconfig.migrations.json` na raiz:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": ".",
    "rootDir": ".",
    "declaration": false,
    "sourceMap": false
  },
  "include": [
    "migrations/**/*.ts",
    "seeds/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

Atualize seus scripts:

```json
{
  "scripts": {
    "migrate:build": "tsc -p tsconfig.migrations.json",
    "migrate:up": "npm run migrate:build && firestore-migrations up"
  }
}
```

---

## 🚀 Fluxo de Trabalho Recomendado

### Durante Desenvolvimento

```bash
# 1. Instale ts-node
npm install --save-dev ts-node typescript

# 2. Crie migration
npx firestore-migrations create migration add-user-status

# 3. Edite a migration (TypeScript)
# migrations/TIMESTAMP_add-user-status.ts

# 4. Execute com ts-node (automático)
npx firestore-migrations up
```

### Para Produção / CI/CD

```bash
# 1. Compile migrations
npm run migrate:build

# 2. Commit os arquivos .js gerados
git add migrations/*.js seeds/*.js
git commit -m "Build migrations for production"

# 3. No servidor, execute normalmente
npx firestore-migrations up
```

---

## 🔍 Como o CLI Funciona

O `MigrationLoader` usa esta lógica:

```typescript
// 1. Lista todos arquivos na pasta migrations/
const allFiles = ['20231121_test.ts', '20231121_test.js', '20231122_other.ts']

// 2. Prioriza .js sobre .ts
//    Se existe 20231121_test.js, ignora 20231121_test.ts
//    Carrega apenas: ['20231121_test.js', '20231122_test.ts']

// 3. Para arquivos .ts, tenta registrar ts-node
if (file.endsWith('.ts')) {
  require('ts-node/register') // Se falhar, mostra erro claro
}

// 4. Carrega o módulo
const migration = require(filePath)
```

**Resultado:**
- Se você tem `.js` → usa ele (rápido)
- Se você tem apenas `.ts` → tenta ts-node (mais lento, mas funciona)
- Se não tem ts-node → erro claro com instruções

---

## 📊 Comparação

| Aspecto | ts-node | Compilar (.js) |
|---------|---------|----------------|
| **Setup** | Instalar ts-node | Criar script de build |
| **Velocidade** | Lento (compila on-fly) | Rápido (já compilado) |
| **Prod Ready** | ❌ Precisa ts-node | ✅ Apenas Node.js |
| **CI/CD** | ⚠️ Funciona mas lento | ✅ Ideal |
| **Dev Experience** | ✅ Excelente | ⚠️ Requer rebuild |
| **Recomendado para** | Desenvolvimento | Produção |

---

## 🎯 Recomendação Final

**Setup Ideal:**

```json
{
  "scripts": {
    "migrate:create": "firestore-migrations create migration",
    "migrate:dev": "firestore-migrations up",
    "migrate:build": "tsc migrations/**/*.ts seeds/**/*.ts --outDir . --module commonjs",
    "migrate:prod": "npm run migrate:build && firestore-migrations up",
    "migrate:status": "firestore-migrations status"
  },
  "devDependencies": {
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

**Durante desenvolvimento:**
```bash
npm run migrate:create add-feature
# Edite a migration
npm run migrate:dev  # Usa ts-node, sem build
```

**Para deploy:**
```bash
npm run migrate:build  # Compila .ts → .js
git add migrations/*.js
git commit -m "Build migrations"
git push

# No servidor (sem ts-node)
npm run migrate:prod  # Usa .js compilados
```

---

## ❓ FAQ

**P: Por que minhas migrations são criadas em TypeScript?**  
R: Para type-safety e melhor DX. Você pode compilá-las para JavaScript quando necessário.

**P: Posso criar migrations em JavaScript direto?**  
R: Sim! Crie manualmente arquivos `.js` na pasta `migrations/` seguindo o mesmo formato.

**P: Preciso commitar os .js gerados?**  
R: Para produção, sim. Para dev com ts-node, não é necessário.

**P: E se eu já tenho um build process?**  
R: Adicione a compilação das migrations ao seu processo de build existente.

**P: Funciona com Yarn Workspaces / Monorepo?**  
R: Sim! Apenas certifique-se que ts-node está instalado no workspace correto.

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'ts-node/register'"

```bash
npm install --save-dev ts-node
```

### Erro: "Unexpected token '{'"

Suas migrations estão em TypeScript mas você não tem ts-node:

```bash
# Opção 1: Instalar ts-node
npm install --save-dev ts-node

# Opção 2: Compilar migrations
npx tsc migrations/**/*.ts --outDir migrations --module commonjs
```

### Migrations não aparecem

Certifique-se que estão no formato correto:

```typescript
export const migration = {
  id: 'timestamp_name',
  name: 'Migration Name',
  async up(adapter) { },
  async down(adapter) { }
}
```

### CI/CD falha com "ts-node not found"

Compile as migrations antes do deploy:

```yaml
# .github/workflows/deploy.yml
- name: Build migrations
  run: npm run migrate:build

- name: Run migrations
  run: npm run migrate:prod
```
