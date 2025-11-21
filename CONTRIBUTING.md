# Contributing to @ederzadravec/firestore-migrations

Obrigado por considerar contribuir! 🎉

## Como Contribuir

### Reportar Bugs

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/ederzadravec/firestore-migrations/issues)
2. Se não, abra uma nova issue com:
   - Título descritivo
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Versões (Node.js, TypeScript, etc.)

### Sugerir Features

1. Abra uma issue com tag `enhancement`
2. Descreva claramente o problema que resolve
3. Proponha uma solução
4. Discuta alternativas

### Pull Requests

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Faça suas alterações
4. Escreva/atualize testes
5. Atualize documentação se necessário
6. Commit: `git commit -m 'feat: adiciona minha feature'`
7. Push: `git push origin feature/minha-feature`
8. Abra um Pull Request

### Commit Messages

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de comportamento
test: adiciona ou corrige testes
chore: mudanças em build, CI, etc.
```

### Código de Conduta

- Seja respeitoso
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia

## Desenvolvimento

### Setup

```bash
git clone https://github.com/ederzadravec/firestore-migrations.git
cd firestore-migrations
npm install
```

### Estrutura

```
lib-migrations/
├── core/           # Lógica principal
├── types/          # TypeScript types
├── cli/            # CLI tool
├── examples/       # Exemplos de uso
├── templates/      # Templates para migrations
└── tests/          # Testes (futuro)
```

### Testes

```bash
npm test           # Rodar testes
npm run test:watch # Watch mode
npm run test:cov   # Coverage
```

### Build

```bash
npm run build      # Build TypeScript
npm run lint       # Lint
npm run format     # Format código
```

## Questões?

Abra uma issue ou entre em contato!
