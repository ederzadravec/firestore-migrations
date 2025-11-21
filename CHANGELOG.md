# Changelog

All notable changes to @ederzadravec/firestore-migrations will be documented in this file.

## [1.0.2] - 2025-11-21

### Fixed
- 🐛 Fixed package entry points to use compiled JavaScript files
  - Changed `main` from `index.ts` to `dist/index.js`
  - Changed `types` from `index.ts` to `dist/index.d.ts`
  - Added `dist/` directory to published files
  - Library now works correctly when installed via npm/yarn

## [1.0.1] - 2025-11-21

### Fixed
- 🐛 Fixed "Unexpected token '{'" error when running migrations
  - MigrationLoader now automatically detects and prioritizes `.js` files over `.ts`
  - Added clear error messages when TypeScript files are found without ts-node
  - Improved TypeScript support with automatic ts-node registration when available
  - Added comprehensive documentation in docs/TYPESCRIPT-MIGRATIONS.md

- 🐛 Fixed seed template missing required `environments` field
  - Seed templates now include `environments: ['all']` by default
  - Added `validate()` function template for optional pre-execution validation
  - Seeds now execute correctly without TypeScript errors

- 🐛 Fixed migrations collection name mismatch
  - Changed default collection from `'migrations'` to `'_migrations'` to match ConfigLoader
  - All CLI functions now properly pass `migrationsCollection` from config
  - Collection `_migrations` is now correctly created in Firestore

### Added
- 📖 Comprehensive TypeScript/JavaScript usage guide (docs/TYPESCRIPT-MIGRATIONS.md)
- ✨ Better error messages with actionable solutions
- 📝 Updated README with troubleshooting section

## [1.0.0] - 2025-01-21

### Added
- ✨ Initial release
- 🎯 Core migration system
  - Execute migrations
  - Rollback migrations
  - Execute seeds
  - Migration tracking and auditing
  - Checksum validation
- 📝 Complete TypeScript support
- 🔌 Framework-agnostic adapter pattern
- 📦 Zero external dependencies (only Node.js crypto)
- 📚 Complete documentation
- 🎨 Templates for migrations, seeds, and adapters
- 🖥️ CLI template
- ✅ Full test coverage (in original project)

### Features
- **Versioning**: All migrations tracked with unique IDs
- **Reversibility**: Full rollback support via `down()`
- **Idempotency**: Safe to run multiple times
- **Audit Trail**: Track who, when, and execution time
- **Validation**: Pre-execution checks via `validate()`
- **Seeds**: Separate seed system for initial data
- **Environment-aware**: Seeds can target specific environments
- **Checksum**: Detect if migration changed after execution

### Documentation
- README.md - Complete documentation
- QUICK_START.md - 5-minute setup guide
- CHANGELOG.md - Version history
- Templates for migrations, seeds, and adapters

## [Unreleased]

### Planned
- [ ] npm package publication
- [ ] CLI as standalone package
- [ ] GitHub repository
- [ ] Additional adapter examples (Firestore Web SDK, etc)
- [ ] Migration generator CLI
- [ ] Dry-run mode
- [ ] Parallel migration execution
- [ ] Migration dependencies
- [ ] Automated tests for library itself
